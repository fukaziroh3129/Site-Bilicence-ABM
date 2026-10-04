// Donne les droits d'administration à un compte existant (et le valide).
// Sert surtout à créer le tout premier administrateur, en production :
//   1. s'inscrire normalement sur le site et confirmer son e-mail ;
//   2. lancer, depuis le terminal Coolify : npm run admin:promouvoir -- adresse@exemple.fr
// Ensuite, les administrateurs gèrent les autres comptes depuis /admin/comptes.

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage : npm run admin:promouvoir -- adresse@exemple.fr");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const compte = await prisma.user.findUnique({ where: { email } });
  if (!compte) {
    console.error(`Aucun compte avec l'adresse ${email}. Inscrivez-vous d'abord sur le site.`);
    process.exit(1);
  }

  // Crée la fiche de la personne si elle n'en a pas encore.
  let personneId = compte.personneId;
  if (!personneId) {
    const personne = await prisma.personne.create({
      data: {
        prenom: compte.prenom,
        nom: compte.nom,
        promoEntree: compte.promoEntree ?? new Date().getFullYear(),
        emailContact: compte.email,
      },
    });
    personneId = personne.id;
  }

  await prisma.user.update({ where: { id: compte.id }, data: { role: (await prisma.user.count({ where: { role: "PROPRIETAIRE" } })) ? "ADMIN" : "PROPRIETAIRE", statut: "ACTIF", personneId } });
  console.log(`${compte.name} (${email}) est maintenant administrateur.`);
  if (!compte.emailVerified) console.log("Attention : l'adresse e-mail n'est pas encore confirmée, la connexion sera refusée tant que ce n'est pas fait.");
}

main().finally(() => prisma.$disconnect());
