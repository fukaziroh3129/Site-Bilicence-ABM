// Produit, à partir des trois fichiers Excel, le CSV à importer dans Administration → Pré-comptes
// (prénom, nom, e-mail, promotion, formation, parcours, établissement, téléphone, ville, séjour Erasmus)
// et la liste des personnes sans adresse e-mail (pas de pré-compte possible). Aucune écriture en base.
//
//   npm run export:precomptes -- --annuaire "…" --poursuite "…" --erasmus "…" --sortie "../donnees-production" \
//        [--exclure "Prénom Nom"]   (la personne du compte propriétaire, déjà créé à part)
//
// Les fichiers produits contiennent des données personnelles : ils restent hors du dépôt Git.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compiler, sansAccent } from "./compilation-donnees";
import { codePays, universiteDe } from "./universites-erasmus";

const argv = process.argv.slice(2);
const option = (nom: string) => {
  const i = argv.indexOf(`--${nom}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const [annuaire, poursuite, erasmus, sortie] = ["annuaire", "poursuite", "erasmus", "sortie"].map(option);
const exclure = option("exclure");
if (!annuaire || !poursuite || !erasmus || !sortie) {
  console.error('Usage : npm run export:precomptes -- --annuaire "…" --poursuite "…" --erasmus "…" --sortie "dossier" [--exclure "Prénom Nom"]');
  process.exit(1);
}

const cle = (t: string) => sansAccent(t).split(/\s+/).sort().join(" ");
const csv = (v: unknown) => {
  let texte = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return `"${texte.replace(/"/g, '""')}"`;
};

async function main() {
  const { personnes } = await compiler({ annuaire: annuaire!, poursuite: poursuite!, erasmus: erasmus! });
  const exclue = exclure ? cle(exclure) : null;

  const lignes = [["Prénom", "Nom", "E-mail", "Promotion", "Formation", "Parcours", "Établissement", "Téléphone", "Ville", "Université Erasmus", "Ville Erasmus", "Pays Erasmus"].map(csv).join(";")];
  const sansEmail: string[] = [];
  const emails = new Set<string>();
  let nb = 0;
  for (const p of personnes) {
    if (exclue && cle(`${p.prenom} ${p.nom}`) === exclue) continue;
    if (!p.email || emails.has(p.email)) {
      sansEmail.push(`${p.prenom} ${p.nom} — promotion ${p.promoEntree}${p.telephone ? ` — ${p.telephone}` : ""}${p.formation ? ` — ${p.formation.intitule}, ${p.formation.etablissement}` : ""}${p.sejours.length ? ` — Erasmus : ${p.sejours.map((s) => `${universiteDe(s.lieu, s.pays).nom} (${s.pays})`).join(", ")}` : ""}`);
      continue;
    }
    emails.add(p.email);
    const s = p.sejours[0];
    const u = s ? universiteDe(s.lieu, s.pays) : null;
    lignes.push(
      [
        p.prenom,
        p.nom,
        p.email,
        p.promoEntree,
        p.formation?.intitule,
        p.formation?.parcours,
        p.formation?.etablissement,
        p.telephone,
        p.ville,
        u?.nom,
        u?.ville,
        s ? (codePays(s.pays) ?? s.pays) : null, // code à deux lettres : « Rep.Tchèque » → CZ
      ]
        .map(csv)
        .join(";"),
    );
    nb++;
  }

  mkdirSync(sortie!, { recursive: true });
  writeFileSync(join(sortie!, "precomptes-abm.csv"), "﻿" + lignes.join("\r\n"), "utf8");
  writeFileSync(join(sortie!, "sans-adresse-email.txt"), sansEmail.join("\r\n") + "\r\n", "utf8");
  console.log(`${nb} ligne(s) dans precomptes-abm.csv ; ${sansEmail.length} personne(s) sans adresse e-mail dans sans-adresse-email.txt`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
