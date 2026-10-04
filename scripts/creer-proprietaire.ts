// Crée (ou remet à neuf) le compte PROPRIÉTAIRE du site : compte actif, adresse confirmée, tous les
// droits. Remplace l'inscription + `admin:promouvoir` quand on veut un compte prêt à l'emploi.
//
// Utilisation :
//   npm run admin:creer -- adresse@exemple.fr "Prénom" "Nom" [promotion]
//
// Le mot de passe est généré au hasard (16 caractères) et écrit dans un fichier hors du dépôt Git
// (`../IDENTIFIANTS-ADMIN.txt`, à côté du dossier du projet) : jamais affiché dans le terminal, jamais
// commité. Pour imposer un mot de passe (ex. reproduire le même compte en production), définir
// `PROPRIETAIRE_MOT_DE_PASSE` (10 caractères minimum) avant de lancer la commande.

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { randomInt, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";

/** Mot de passe lisible (sans 0/O, 1/l/I) : lettres et chiffres, au moins un de chaque. */
export function genererMotDePasse(longueur = 16) {
  const lettres = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const chiffres = "23456789";
  const tout = lettres + chiffres;
  let mdp = "";
  do {
    mdp = Array.from({ length: longueur }, () => tout[randomInt(tout.length)]).join("");
  } while (!/[a-z]/.test(mdp) || !/[A-Z]/.test(mdp) || !/\d/.test(mdp));
  return mdp;
}

type Proprietaire = { email: string; prenom: string; nom: string; promoEntree?: number };

/** Crée ou met à jour le propriétaire ; renvoie le mot de passe défini. Un seul propriétaire à la fois. */
export async function creerProprietaire(prisma: PrismaClient, p: Proprietaire) {
  const email = p.email.trim().toLowerCase();
  const motDePasse = process.env.PROPRIETAIRE_MOT_DE_PASSE || genererMotDePasse();
  if (motDePasse.length < 10) throw new Error("PROPRIETAIRE_MOT_DE_PASSE : 10 caractères minimum.");
  const hash = await hashPassword(motDePasse);

  // Un seul propriétaire : s'il y en a déjà un autre, il redevient administrateur.
  await prisma.user.updateMany({ where: { role: "PROPRIETAIRE", NOT: { email } }, data: { role: "ADMIN" } });

  const existant = await prisma.user.findUnique({ where: { email }, select: { id: true, personneId: true, promoEntree: true } });
  const promo = p.promoEntree ?? existant?.promoEntree ?? new Date().getFullYear();

  let personneId = existant?.personneId ?? null;
  if (!personneId) {
    const personne = await prisma.personne.create({ data: { prenom: p.prenom, nom: p.nom, promoEntree: promo, emailContact: email } });
    personneId = personne.id;
  }

  const id = existant?.id ?? randomUUID();
  await prisma.user.upsert({
    where: { email },
    create: { id, email, name: `${p.prenom} ${p.nom}`, prenom: p.prenom, nom: p.nom, promoEntree: promo, emailVerified: true, statut: "ACTIF", role: "PROPRIETAIRE", personneId },
    update: { emailVerified: true, statut: "ACTIF", role: "PROPRIETAIRE", personneId },
  });
  await prisma.account.deleteMany({ where: { userId: id, providerId: "credential" } });
  await prisma.account.create({ data: { id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash } });
  await prisma.session.deleteMany({ where: { userId: id } });
  return motDePasse;
}

/** Écrit l'adresse et le mot de passe dans un fichier à côté du dossier du projet (hors dépôt Git). */
export function ecrireIdentifiants(email: string, motDePasse: string, adresseSite: string) {
  // Mot de passe imposé (production) : il est déjà connu de la personne, rien à écrire sur le serveur.
  if (process.env.PROPRIETAIRE_MOT_DE_PASSE) return "(mot de passe imposé : aucun fichier écrit)";
  const chemin = resolve(process.cwd(), "..", "IDENTIFIANTS-ADMIN.txt");
  writeFileSync(
    chemin,
    [
      "Compte propriétaire du site ABM — NE PAS PARTAGER, NE PAS METTRE SUR GITHUB",
      "",
      `Adresse du site  : ${adresseSite}/connexion`,
      `Adresse e-mail   : ${email}`,
      `Mot de passe     : ${motDePasse}`,
      "",
      "Changez le mot de passe dès la première connexion (Mon profil → Mon compte), puis supprimez ce fichier.",
      "",
    ].join("\r\n"),
    "utf8",
  );
  return chemin;
}

// Lancé directement (et non importé par import-donnees-reelles.ts)
if (process.argv[1]?.includes("creer-proprietaire")) {
  const [email, prenom, nom, promo] = process.argv.slice(2);
  if (!email || !prenom || !nom) {
    console.error('Usage : npm run admin:creer -- adresse@exemple.fr "Prénom" "Nom" [promotion]');
    process.exit(1);
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  creerProprietaire(prisma, { email, prenom, nom, promoEntree: promo ? Number(promo) : undefined })
    .then((mdp) => {
      const chemin = ecrireIdentifiants(email.toLowerCase(), mdp, process.env.BETTER_AUTH_URL ?? "http://localhost:3000");
      console.log(`Compte propriétaire prêt pour ${email}. Identifiants écrits dans : ${chemin}`);
    })
    .finally(() => prisma.$disconnect());
}
