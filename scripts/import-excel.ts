// Import de l'Excel historique « Poursuite d'étude Bilicence » vers la base (fiches, formations).
//
// Utilisation :
//   npm run import:excel -- "C:\chemin\vers\fichier.xlsx"              → simulation (rien n'est écrit)
//   npm run import:excel -- "C:\chemin\vers\fichier.xlsx" --confirmer  → import réel
//
// Règles :
// - une feuille par promotion, nommée « Promo 2021-2024 » ; en-têtes sur les 3 premières lignes ;
// - une ligne avec un nom = une personne ; les lignes suivantes sans nom = ses autres vœux de master
//   (non importés, listés dans le rapport pour vérification) ;
// - la première ligne de chaque personne donne sa formation (Master + mention, parcours, établissement) ;
// - les contacts (mail, téléphone) sont importés mais restent MASQUÉS (visibilité à cocher par la personne) ;
// - personne n'apparaît dans l'historique public (consentement à recueillir) ;
// - une personne déjà présente (même prénom, nom et promotion) est ignorée : le script peut être relancé.
//
// Un rapport « import-excel-rapport.csv » (ignoré par Git : il contient des données personnelles)
// liste chaque personne et les points à vérifier dans Administration → Fiches.

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { relierEtablissements } from "./relier-etablissements";

const [chemin, ...options] = process.argv.slice(2);
const confirmer = options.includes("--confirmer");
if (!chemin) {
  console.error('Usage : npm run import:excel -- "chemin/vers/fichier.xlsx" [--confirmer]');
  process.exit(1);
}

type Ligne = {
  promoEntree: number;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  formation: { intitule: string; parcours: string | null; etablissement: string } | null;
  situation: string | null;
  ville: string | null;
  autresVoeux: string[];
  aVerifier: string[];
};

// ─── Lecture des cellules ──────────────────────────────────────────────────────

function texte(cellule: ExcelJS.Cell): string | null {
  const v = cellule.value;
  let t: string;
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && "richText" in v) t = v.richText.map((r) => r.text).join("");
  else if (typeof v === "object" && "text" in v) t = String(v.text);
  else if (typeof v === "object" && "result" in v) t = String(v.result ?? "");
  else t = String(v);
  t = t.replace(/\s+/g, " ").trim();
  // Valeurs « vides » utilisées dans le tableau
  if (["", "/", "//", "-", "--", "·", "?"].includes(t)) return null;
  return t;
}

/** Retire les mentions de statut de candidature : « (acceptée) », « Liste d'attente : », « option 2 : »… */
function nettoyerVoeu(t: string) {
  return t
    .replace(/^\s*(\d\)|option\s*\d+\s*:?|liste d['’]attente\s*:|admission\s*:)\s*/i, "")
    .replace(/\((?:[^()]*?(accept|admis|admission|refus|attente|proposition|choix|oral|alternance|vœu|voeu|candidature|puis)[^()]*?)\)/gi, "")
    // « 1) Choix A 2) Choix B » : garde le premier
    .replace(/\s+2\).*$/, "")
    // Statut écrit sans parenthèses en fin de texte : « … Accepté dès les premiers jours »
    .replace(/\s+(acceptée?s?|admise?s?|admissible|candidature|refusée?s?|liste d['’]attente)(?=[\s.,;:]|$).*$/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** « - Choix A / - Choix B » : garde le premier choix et signale la cellule. */
function premierChoix(t: string | null, champ: string, aVerifier: string[]) {
  if (!t) return null;
  if (/^\s*-\s/.test(t) || / \/ - /.test(t)) {
    aVerifier.push(`${champ} à plusieurs valeurs : « ${t} »`);
    return t.replace(/^\s*-\s*/, "").split(/\s*\/\s*-\s*|\s+-\s+/)[0].trim();
  }
  return t;
}

function capitaliser(mot: string) {
  return mot.toLowerCase().replace(/(^|[-\s'’])(\p{L})/gu, (_, sep, l) => sep + l.toUpperCase());
}

/**
 * Promotions 2021 et 2022 : « NOM Prénom » (nom en capitales).
 * Promotion 2023 : « Prénom Nom » (ordre déduit des adresses e-mail).
 */
function decouperNom(brut: string, aVerifier: string[]) {
  const mots = brut.split(/\s+/);
  const majuscules = mots.filter((m) => m.length > 1 && m === m.toUpperCase() && /\p{L}/u.test(m));

  if (majuscules.length > 0 && majuscules.length < mots.length) {
    const nom = mots.filter((m) => majuscules.includes(m)).map(capitaliser).join(" ");
    const prenom = mots.filter((m) => !majuscules.includes(m)).map(capitaliser).join(" ");
    return { prenom, nom };
  }
  if (majuscules.length === mots.length) {
    aVerifier.push("ordre prénom / nom incertain (tout en capitales)");
    return { nom: capitaliser(mots[0]), prenom: mots.slice(1).map(capitaliser).join(" ") };
  }
  if (mots.length > 2) aVerifier.push("nom composé : vérifier la séparation prénom / nom");
  return { prenom: capitaliser(mots[0]), nom: mots.slice(1).map(capitaliser).join(" ") };
}

function intituleMaster(mention: string) {
  return /^(master|licence|l3|m1|m2|msc|ma |double|diplôme|dipl)/i.test(mention) ? mention : `Master ${mention}`;
}

// ─── Lecture du classeur ───────────────────────────────────────────────────────

async function lire(): Promise<Ligne[]> {
  const classeur = new ExcelJS.Workbook();
  await classeur.xlsx.readFile(chemin);
  const lignes: Ligne[] = [];

  for (const feuille of classeur.worksheets) {
    const annees = feuille.name.match(/(\d{4})\s*-\s*(\d{4})/);
    if (!annees) {
      console.log(`Feuille « ${feuille.name} » ignorée (nom sans promotion).`);
      continue;
    }
    const promoEntree = Number(annees[1]);
    // Colonne « Ville » présente seulement sur certaines feuilles
    let colonneVille: number | null = null;
    feuille.getRow(3).eachCell((c, n) => {
      if (texte(c)?.toLowerCase() === "ville") colonneVille = n;
    });

    let courante: Ligne | null = null;
    feuille.eachRow((row, numero) => {
      if (numero <= 3) return;
      // Cellules fusionnées : exceljs recopie la valeur de la cellule principale sur les suivantes.
      const nomCellule = row.getCell(1);
      const estFusionSuite = nomCellule.isMerged && nomCellule.master.address !== nomCellule.address;
      const nomBrut = estFusionSuite ? null : texte(nomCellule);
      const mention = texte(row.getCell(4));
      const parcours = texte(row.getCell(5));
      const etablissement = texte(row.getCell(6));

      if (nomBrut) {
        const aVerifier: string[] = [];
        const { prenom, nom } = decouperNom(nomBrut, aVerifier);
        const mentionPropre = premierChoix(mention, "Mention", aVerifier);
        const etablissementPropre = premierChoix(etablissement, "Établissement", aVerifier);
        const parcoursPropre = premierChoix(parcours, "Parcours", aVerifier);
        if (mention && mentionPropre && nettoyerVoeu(mentionPropre) !== mentionPropre) {
          aVerifier.push(`mention avec statut de candidature : « ${mention} »`);
        }
        const travail = texte(row.getCell(7));
        if (travail) aVerifier.push("colonne Travail reprise comme « situation actuelle »");

        courante = {
          promoEntree,
          prenom,
          nom,
          email: texte(row.getCell(2))?.toLowerCase() ?? null,
          telephone: texte(row.getCell(3)),
          formation:
            mentionPropre && etablissementPropre
              ? {
                  intitule: intituleMaster(nettoyerVoeu(mentionPropre)),
                  parcours: parcoursPropre ? nettoyerVoeu(parcoursPropre) || null : null,
                  etablissement: etablissementPropre,
                }
              : null,
          situation: travail ? travail.slice(0, 160) : null,
          ville: colonneVille ? texte(row.getCell(colonneVille)) : null,
          autresVoeux: [],
          aVerifier,
        };
        if (!courante.formation && (mention || etablissement)) aVerifier.push("formation incomplète, non importée");
        lignes.push(courante);
      } else if (courante && (mention || parcours || etablissement)) {
        courante.autresVoeux.push([mention, parcours, etablissement].filter(Boolean).join(" — "));
      }
    });
  }

  for (const l of lignes) {
    if (l.autresVoeux.length > 0) l.aVerifier.push(`${l.autresVoeux.length} autre(s) vœu(x) non importé(s) : vérifier le master retenu`);
  }
  return lignes;
}

// ─── Import ────────────────────────────────────────────────────────────────────

const normaliser = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
// Cellule CSV ; un texte commençant par = + - @ serait exécuté comme formule par Excel.
const csv = (v: unknown) => {
  let texte = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return `"${texte.replace(/"/g, '""')}"`;
};

async function main() {
  const lignes = await lire();
  const url = process.env.DATABASE_URL ?? "";
  const hote = url.match(/@([^:/]+)/)?.[1] ?? "?";
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  const existantes = await prisma.personne.findMany({ select: { prenom: true, nom: true, promoEntree: true } });
  const cles = new Set(existantes.map((p) => `${normaliser(p.prenom)}|${normaliser(p.nom)}|${p.promoEntree}`));

  let creees = 0;
  let ignorees = 0;
  const rapport = [["Promotion", "Prénom", "Nom", "Résultat", "Formation importée", "Autres vœux", "À vérifier"].map(csv).join(";")];

  for (const l of lignes) {
    const cle = `${normaliser(l.prenom)}|${normaliser(l.nom)}|${l.promoEntree}`;
    let resultat: string;
    if (cles.has(cle)) {
      ignorees++;
      resultat = "déjà présente, ignorée";
    } else {
      if (confirmer) {
        await prisma.personne.create({
          data: {
            prenom: l.prenom,
            nom: l.nom,
            promoEntree: l.promoEntree,
            emailContact: l.email,
            telephone: l.telephone,
            situationActuelle: l.situation,
            ville: l.ville,
            formations: l.formation
              ? { create: [{ ...l.formation, anneeDebut: l.promoEntree + 3 }] }
              : undefined,
          },
        });
      }
      cles.add(cle);
      creees++;
      resultat = confirmer ? "créée" : "serait créée";
    }
    const f = l.formation;
    rapport.push(
      [
        `${l.promoEntree}-${l.promoEntree + 3}`,
        l.prenom,
        l.nom,
        resultat,
        f ? [f.intitule, f.parcours, f.etablissement].filter(Boolean).join(" — ") : "",
        l.autresVoeux.join(" | "),
        l.aVerifier.join(" | "),
      ]
        .map(csv)
        .join(";"),
    );
  }

  // Formations importées reliées à la liste commune des établissements (ADM-03), « à contrôler ».
  if (confirmer) {
    const { crees } = await relierEtablissements(prisma);
    console.log(`Établissements : ${crees} ajouté(s) à la liste commune, à contrôler dans Administration → Établissements.`);
  }

  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  writeFileSync("import-excel-rapport.csv", "\uFEFF" + rapport.join("\r\n"), "utf8");

  const parPromo = new Map<number, number>();
  for (const l of lignes) parPromo.set(l.promoEntree, (parPromo.get(l.promoEntree) ?? 0) + 1);

  console.log(`\nBase cible : ${hote}`);
  console.log(`Personnes lues : ${lignes.length} (${[...parPromo].map(([p, n]) => `${p}-${p + 3} : ${n}`).join(", ")})`);
  console.log(`Avec formation : ${lignes.filter((l) => l.formation).length}`);
  console.log(`À vérifier : ${lignes.filter((l) => l.aVerifier.length > 0).length} fiche(s)`);
  console.log(`${confirmer ? "Créées" : "Seraient créées"} : ${creees} · déjà présentes : ${ignorees}`);
  console.log("Rapport détaillé : import-excel-rapport.csv (ne pas le partager : données personnelles)");
  if (!confirmer) console.log("\nSimulation uniquement. Relancer avec --confirmer pour importer.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
