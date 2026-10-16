import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { genererMotDePasse } from "./creer-proprietaire";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const email = "test-devenir@exemple.test";

async function nettoyer() {
  const u = await prisma.user.findUnique({ where: { email }, select: { personneId: true } });
  await prisma.user.deleteMany({ where: { email } });
  await prisma.personne.deleteMany({ where: { OR: [{ emailContact: { endsWith: "@exemple.test" }, nom: { startsWith: "Test" } }, ...(u?.personneId ? [{ id: u.personneId }] : [])] } });
}

async function main() {
  await nettoyer();
  if (process.argv[2] === "nettoyer") return;
  const mdp = genererMotDePasse();
  const admin = await prisma.personne.create({ data: { prenom: "Test", nom: "Admin", promoEntree: 2021, emailContact: email } });
  const id = randomUUID();
  await prisma.user.create({ data: { id, email, name: "Test Admin", prenom: "Test", nom: "Admin", promoEntree: 2021, emailVerified: true, statut: "ACTIF", role: "ADMIN", personneId: admin.id } });
  await prisma.account.create({ data: { id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(mdp) } });
  writeFileSync(process.argv[3], mdp);
  for (const [prenom, nom, presentation] of [
    ["Alice", "Test-Alpha", "Je travaille sur les politiques européennes."],
    ["Bruno", "Test-Beta", "Contactez-moi au 06 00 00 00 00 pour en parler."],
    ["Chloé", "Test-Gamma", null],
  ] as const) {
    await prisma.personne.create({
      data: { prenom, nom, promoEntree: 2022, emailContact: `${prenom.toLowerCase()}@exemple.test`, presentation, consentementPublic: true, consentementPublicLe: new Date(), situationActuelle: "Chargé de mission", structureActuelle: "Région Occitanie", statutActuel: "EN_POSTE" },
    });
  }
}
main().finally(() => prisma.$disconnect());
