// Supprime les formations « bi-licence » saisies ou importées par erreur : la bi-licence est déjà
// affichée automatiquement sur chaque fiche, elle apparaissait donc en double (et faussait les
// statistiques). Pour une personne dont la promotion est encore en cours et sans situation indiquée,
// la situation devient « En licence » (bouton « Je suis encore en bi-licence » de « Ma fiche »).
// N'affiche aucun nom : seulement l'intitulé et l'établissement de chaque formation concernée.
//
// Utilisation : npm run bilicence:nettoyer               → simulation (rien n'est écrit)
//               npm run bilicence:nettoyer -- --confirmer

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { promoEnCours } from "../src/lib/format";
import { estBiLicence } from "../src/lib/mentions";

async function main(prisma: PrismaClient, confirmer: boolean) {
  const formations = await prisma.formation.findMany({
    select: { id: true, intitule: true, etablissement: true, personne: { select: { id: true, promoEntree: true, statutActuel: true } } },
  });
  const doublons = formations.filter((f) => estBiLicence(f.intitule, f.etablissement));
  let statuts = 0;
  for (const f of doublons) {
    const passeEnLicence = promoEnCours(f.personne.promoEntree) && !f.personne.statutActuel;
    console.log(`  − « ${f.intitule} » (${f.etablissement})${passeEnLicence ? " → situation « En licence »" : ""}`);
    if (passeEnLicence) statuts++;
    if (!confirmer) continue;
    await prisma.formation.delete({ where: { id: f.id } });
    if (passeEnLicence) await prisma.personne.update({ where: { id: f.personne.id }, data: { statutActuel: "EN_LICENCE" } });
  }
  console.log(`\n${doublons.length} formation(s) bi-licence ${confirmer ? "supprimée(s)" : "à supprimer"}, ${statuts} situation(s) « En licence ».`);
  if (!confirmer) console.log("Simulation : relancez avec --confirmer pour écrire dans la base.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
main(prisma, process.argv.includes("--confirmer")).finally(() => prisma.$disconnect());
