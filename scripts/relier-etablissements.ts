// Relie à la liste commune des établissements (patch ADM-03) les formations saisies avant elle, ou
// importées par un script : pour chaque formation sans lien, l'établissement est retrouvé (même nom,
// ou même établissement écrit autrement, « Sciences Po » = « Sciences Po Paris ») ou ajouté, marqué
// « à contrôler » pour le bureau. Sans danger : peut être relancé autant de fois que nécessaire.
//
// Utilisation : npm run etablissements:relier            → simulation (rien n'est écrit)
//               npm run etablissements:relier -- --confirmer

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { decrireEtablissement, reconnaitreEtablissement } from "../src/lib/etablissements";
import { normaliser } from "../src/lib/format";

/** Relie les formations sans établissement ; renvoie le nombre de formations reliées et d'établissements créés. */
export async function relierEtablissements(prisma: PrismaClient, confirmer = true) {
  const formations = await prisma.formation.findMany({ where: { etablissementId: null }, select: { id: true, etablissement: true } });
  const liste = await prisma.etablissement.findMany({ select: { id: true, nom: true, type: true } });
  let crees = 0;

  for (const f of formations) {
    const devine = reconnaitreEtablissement(f.etablissement);
    let cible =
      liste.find((e) => normaliser(e.nom) === normaliser(f.etablissement)) ??
      liste.find((e) => decrireEtablissement({ etablissement: e.nom, etablissementRef: e }).cle === devine.cle);
    if (!cible) {
      crees++;
      cible = confirmer
        ? await prisma.etablissement.create({ data: { nom: devine.nom, type: devine.type, pays: "FR", aControler: true }, select: { id: true, nom: true, type: true } })
        : { id: `simulation-${crees}`, nom: devine.nom, type: devine.type };
      liste.push(cible);
      console.log(`  + ${cible.nom} (${cible.type})`);
    }
    if (confirmer) await prisma.formation.update({ where: { id: f.id }, data: { etablissementId: cible.id, etablissement: cible.nom } });
  }
  return { reliees: formations.length, crees };
}

// Lancé directement (et non importé par seed.ts)
if (process.argv[1]?.includes("relier-etablissements")) {
  const confirmer = process.argv.includes("--confirmer");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  relierEtablissements(prisma, confirmer)
    .then(({ reliees, crees }) => {
      console.log(`${reliees} formation(s) à relier, ${crees} établissement(s) à ajouter.`);
      if (!confirmer) console.log("Simulation : relancez avec --confirmer pour écrire dans la base.");
    })
    .finally(() => prisma.$disconnect());
}
