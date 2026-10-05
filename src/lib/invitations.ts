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
import { modeleEmail } from "@/lib/modele-email";
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
  ].filter((d): d is string => Boolean(d));

  const titre = `Bonjour ${user.prenom}, prenez votre place dans le réseau de la Bi-Licence`;
  const presentation = `${site.nom}, c’est le réseau de celles et ceux qui sont passés par la ${site.formation}. Les anciens s’y retrouvent et transmettent ; les étudiants y trouvent tout ce qu’il leur faut : annuaire, conseils, archive des stages et des poursuites d’études / masters, offres, retours Erasmus, événements.`;
  const preparation = "Le bureau vous a préparé un compte à partir de la base de suivi des poursuites d’études de la bi-licence, dans laquelle vous aviez accepté de figurer. Il contient :";
  const accroche = "En bref : placez votre marque dans la Bi-Licence !";
  const bouton = { libelle: "Activer mon compte", url: lien };
  const noteBouton = `Lien valable ${DUREE_JOURS} jours · vous y choisirez votre mot de passe`;
  const confidentialite = "Votre fiche est visible uniquement des membres connectés ; elle n’apparaît sur les pages publiques que si vous l’acceptez. Une fois connecté, vous pouvez la modifier ou la compléter (« Ma fiche »), ou supprimer votre compte et vos données (« Mon compte »).";
  const signature = `Le bureau d’${site.nom}`;

  await envoyerEmail({
    a: user.email,
    sujet: `Votre compte sur le site d’${site.nom}`,
    ...(site.association.email ? { repondreA: site.association.email } : {}),
    texte: [
      titre,
      "",
      presentation,
      "",
      preparation,
      ...donnees.map((d) => `- ${d}`),
      "",
      accroche,
      "",
      `${bouton.libelle} (${noteBouton.replace(" · ", ", ")}) :`,
      lien,
      "",
      confidentialite,
      `Vous ne souhaitez pas de compte ? Vous pouvez demander la suppression de vos données sans l’activer : ${adresseSite("/contact")}`,
      `En savoir plus sur vos données : ${adresseSite("/confidentialite")}`,
      "",
      signature,
    ].join("\n"),
    html: modeleEmail({
      titre,
      apercu: "Votre compte est prêt : activez-le et choisissez votre mot de passe.",
      contenu: [
        { paragraphe: presentation },
        { paragraphe: preparation },
        { encadre: donnees.map((d) => d.charAt(0).toUpperCase() + d.slice(1)) },
        { accroche },
        { bouton, note: noteBouton },
        { paragraphe: confidentialite, petit: true },
        { paragraphe: signature, petit: true },
      ],
      pied: [
        ["Vous ne souhaitez pas de compte ? ", { libelle: "Demandez la suppression de vos données", url: adresseSite("/contact") }, " sans l’activer."],
        [{ libelle: "En savoir plus sur vos données", url: adresseSite("/confidentialite") }],
      ],
    }),
  });
  await prisma.user.update({ where: { id: user.id }, data: { invitationEnvoyeeLe: new Date() } });
  return true;
}
