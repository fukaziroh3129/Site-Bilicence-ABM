// Repère les formations complémentaires (DU, licence en parallèle, certification, MOOC) saisies ou
// importées comme des masters, avec la même méthode que le site (src/lib/complementaires.ts).
// Ne déplace rien : remplit la liste « À reclasser » de /admin/formations-complementaires, où le bureau
// range chaque formation ou la garde comme master. N'affiche que les intitulés, jamais de nom.
// Sans danger : peut être relancé autant de fois que nécessaire.
//
// Utilisation : npm run complementaires:detecter                  → simulation (rien n'est écrit)
//               npm run complementaires:detecter -- --confirmer

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { LIBELLES_COMPLEMENTAIRE } from "../src/lib/complementaires";
import { repererComplementaires } from "../src/lib/detection-complementaires";

const confirmer = process.argv.includes("--confirmer");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

repererComplementaires(prisma, { confirmer })
  .then(({ examinees, modifiees, propositions }) => {
    for (const p of propositions) console.log(`  → « ${p.intitule} » : ${LIBELLES_COMPLEMENTAIRE[p.type].un} (${p.raison})`);
    console.log(`\n${examinees} formation(s) examinée(s) : ${propositions.length} à reclasser.`);
    console.log(`${modifiees} formation(s) ${confirmer ? "mise(s) à jour" : "à mettre à jour"}.`);
    if (!confirmer) console.log("\nSimulation : relancez avec --confirmer pour remplir la liste « À reclasser ».");
  })
  .finally(() => prisma.$disconnect());
