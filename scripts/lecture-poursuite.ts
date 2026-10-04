// Lecture de l'Excel « Poursuite d'étude Bilicence » (une feuille par promotion), partagée par
// `import-excel.ts` et `import-donnees-reelles.ts`. Aucune écriture en base ici.

import ExcelJS from "exceljs";

export type Ligne = {
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

export async function lirePoursuite(chemin: string): Promise<Ligne[]> {
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
