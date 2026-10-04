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
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { lirePoursuite } from "./lecture-poursuite";
import { relierEtablissements } from "./relier-etablissements";

const [chemin, ...options] = process.argv.slice(2);
const confirmer = options.includes("--confirmer");
if (!chemin) {
  console.error('Usage : npm run import:excel -- "chemin/vers/fichier.xlsx" [--confirmer]');
  process.exit(1);
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
  const lignes = await lirePoursuite(chemin);
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
