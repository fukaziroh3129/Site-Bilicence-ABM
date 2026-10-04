// Pré-comptes (patch ADM-04) : le bureau crée à l'avance le compte et la fiche des anciens connus
// (bases de master), puis leur envoie un lien d'invitation. En cliquant, la personne confirme son
// adresse (le lien a été reçu sur cette adresse), choisit son mot de passe et retrouve sa fiche déjà
// commencée. Statut du compte : INVITE, puis ACTIF à l'activation (le bureau l'a déjà validé).
//
// Le lien contient un jeton aléatoire ; la base n'en garde que l'empreinte (SHA-256), dans la table
// Verification de Better Auth (« invitation:<id du compte> »). Il est valable 30 jours ; en envoyer
// un nouveau rend l'ancien inutilisable.

import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { adresseSite, envoyerEmail } from "@/lib/email";
import { libellePromo } from "@/lib/format";
import { site } from "@/lib/site";

const DUREE_JOURS = 30;
const PREFIXE = "invitation:";

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/** Crée un nouveau lien d'invitation pour un pré-compte (l'ancien cesse de fonctionner). */
export async function creerLienInvitation(userId: string) {
  const jeton = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.verification.deleteMany({ where: { identifier: `${PREFIXE}${userId}` } }),
    prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier: `${PREFIXE}${userId}`,
        value: empreinte(jeton),
        expiresAt: new Date(Date.now() + DUREE_JOURS * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  return adresseSite(`/invitation/${jeton}`);
}

/** Le pré-compte correspondant à un lien, s'il est encore valable (sinon null). */
export async function trouverInvitation(jeton: string) {
  if (!/^[\w-]{20,100}$/.test(jeton)) return null;
  const verification = await prisma.verification.findFirst({
    where: { value: empreinte(jeton), identifier: { startsWith: PREFIXE }, expiresAt: { gt: new Date() } },
  });
  if (!verification) return null;
  const user = await prisma.user.findUnique({
    where: { id: verification.identifier.slice(PREFIXE.length) },
    include: { personne: { include: { formations: { orderBy: { anneeDebut: { sort: "asc", nulls: "last" } } } } } },
  });
  if (!user || user.statut !== "INVITE") return null;
  return { user, verificationId: verification.id };
}

/**
 * Envoie (ou renvoie) l'e-mail d'invitation. Il dit d'où viennent les données et comment les
 * modifier ou les supprimer (engagement RGPD du patch ADM-04).
 */
export async function envoyerInvitation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { personne: { include: { formations: { select: { intitule: true, etablissement: true } } } } },
  });
  if (!user || user.statut !== "INVITE") return false;

  const lien = await creerLienInvitation(user.id);
  const donnees = [
    "vos prénom et nom",
    "votre adresse e-mail",
    user.personne && `votre promotion (${libellePromo(user.personne.promoEntree)})`,
    ...(user.personne?.formations ?? []).map((f) => `votre formation : ${f.intitule}, ${f.etablissement}`),
  ].filter(Boolean);

  await envoyerEmail({
    a: user.email,
    sujet: `Votre compte sur le site d’${site.nom}`,
    ...(site.association.email ? { repondreA: site.association.email } : {}),
    texte: [
      `Bonjour ${user.prenom},`,
      "",
      `L’association ${site.nom} ouvre son site, réservé aux étudiants et diplômés de la ${site.formation} : annuaire des anciens, archive des stages, offres, événements.`,
      "",
      "Le bureau vous a préparé un compte à partir de la base de suivi des poursuites d’études de la bi-licence, dans laquelle vous aviez accepté de figurer. Il contient :",
      ...donnees.map((d) => `- ${d}`),
      "",
      `Pour activer votre compte et choisir votre mot de passe (lien valable ${DUREE_JOURS} jours) :`,
      lien,
      "",
      "Votre fiche est visible uniquement des membres connectés ; elle n’apparaît sur les pages publiques que si vous l’acceptez.",
      "Une fois connecté, vous pouvez modifier ou compléter ces informations (« Ma fiche »), ou supprimer votre compte et vos données (« Mon compte »).",
      `Vous ne souhaitez pas de compte ? Vous pouvez demander la suppression de vos données sans l’activer : ${adresseSite("/contact")}`,
      `En savoir plus sur vos données : ${adresseSite("/confidentialite")}`,
      "",
      `Le bureau d’${site.nom}`,
    ].join("\n"),
  });
  await prisma.user.update({ where: { id: user.id }, data: { invitationEnvoyeeLe: new Date() } });
  return true;
}
