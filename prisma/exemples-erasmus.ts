// Données d'EXEMPLE pour la carte des Erasmus : universités réelles, séjours FICTIFS rattachés
// aux seules fiches de démonstration du fichier seed.ts. Les vraies données seront importées
// avant la mise en service (voir CLAUDE.md).
//   - appelé par seed.ts (npm run db:remplir) ;
//   - ou seul, sans rien effacer : npx tsx prisma/exemples-erasmus.ts

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const UNIVERSITES = [
  { nom: "Université de Vienne", ville: "Vienne", pays: "AT" },
  { nom: "KU Leuven", ville: "Louvain", pays: "BE" },
  { nom: "Université libre de Bruxelles", ville: "Bruxelles", pays: "BE" },
  { nom: "Université de Salamanque", ville: "Salamanque", pays: "ES" },
  { nom: "Université Complutense de Madrid", ville: "Madrid", pays: "ES" },
  { nom: "Université de Bologne", ville: "Bologne", pays: "IT" },
  { nom: "Université libre de Berlin", ville: "Berlin", pays: "DE" },
  { nom: "Université de Lisbonne", ville: "Lisbonne", pays: "PT" },
  { nom: "Trinity College Dublin", ville: "Dublin", pays: "IE" },
  { nom: "Université de Montréal", ville: "Montréal", pays: "CA" },
] as const;

// [prénom, nom de la fiche de démonstration, université, année, durée, niveau, descriptif]
const SEJOURS = [
  ["Claire", "Fictive", "Université de Vienne", 2023, "SEMESTRE", "LICENCE", "Cours de science politique européenne en anglais, et une ville idéale pour les étudiants."],
  ["Hugo", "Imaginaire", "Université de Salamanque", 2023, "ANNEE", "LICENCE", "Une année en espagnol, beaucoup d’économie du développement."],
  ["Inès", "Inventée", "KU Leuven", 2023, "SEMESTRE", "LICENCE", null],
  ["Inès", "Inventée", "Université de Montréal", 2025, "SEMESTRE", "MASTER", "Échange de master en relations internationales."],
  ["Lucas", "Supposé", "Université de Bologne", 2024, "SEMESTRE", "LICENCE", "Le plus vieux campus d’Europe, des cours d’économie publique exigeants."],
  ["Nina", "Hypothèse", "Université de Salamanque", 2024, "SEMESTRE", "LICENCE", null],
  ["Sarah", "Démo", "Université libre de Berlin", 2025, "ANNEE", "LICENCE", "Cours en allemand et en anglais ; pensez au certificat de langue tôt."],
  ["Tom", "Essai", "Université Complutense de Madrid", 2025, "SEMESTRE", "LICENCE", null],
  ["Tom", "Essai", "Trinity College Dublin", 2026, "SEMESTRE", "MASTER", null],
  ["Hugo", "Imaginaire", "Université de Lisbonne", 2025, "SEMESTRE", "MASTER", null],
] as const;

export async function creerExemplesErasmus(prisma: PrismaClient) {
  if (await prisma.etablissement.count()) {
    console.log("Erasmus : des universités existent déjà, exemples non ajoutés.");
    return;
  }
  const ids = new Map<string, string>();
  for (const u of UNIVERSITES) ids.set(u.nom, (await prisma.etablissement.create({ data: u })).id);

  let n = 0;
  for (const [prenom, nom, universite, annee, duree, niveau, descriptif] of SEJOURS) {
    const personne = await prisma.personne.findFirst({ where: { prenom, nom } });
    if (!personne) continue;
    await prisma.erasmus.create({
      data: {
        personneId: personne.id,
        universiteId: ids.get(universite)!,
        annee,
        duree,
        niveau,
        descriptif,
        retour: descriptif ? "Retour d’expérience d’exemple : candidature, logement, budget, conseils." : null,
      },
    });
    n++;
  }
  console.log(`Erasmus : ${UNIVERSITES.length} universités et ${n} séjours d’exemple ajoutés.`);
}

// Lancement direct : npx tsx prisma/exemples-erasmus.ts
if (process.argv[1]?.endsWith("exemples-erasmus.ts")) {
  config({ path: [".env.local", ".env"], quiet: true });
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  creerExemplesErasmus(prisma).finally(() => prisma.$disconnect());
}
