"use server";

// Offres de stage et d'emploi : proposées par les membres, validées par le bureau.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adresseSite, emailsAdmins, emailsMembresActifs, envoyerEmail } from "@/lib/email";
import { LIBELLES_TYPE_OFFRE } from "@/lib/format";
import { champ, valider, type EtatFormulaire } from "@/lib/formulaire";
import { autoriser } from "@/lib/limite";
import { estDuBureau } from "@/lib/roles";
import { exigerBureau, exigerMembreActif } from "@/lib/session";

const schemaOffre = z.object({
  titre: champ.texte(160),
  organisation: champ.texte(160),
  type: champ.choix(["STAGE", "ALTERNANCE", "EMPLOI"]),
  lieu: champ.texteFacultatif(120),
  description: champ.texte(5000),
  lien: champ.lienFacultatif(),
  contact: champ.texteFacultatif(200),
  dateLimite: champ.dateFacultative(),
});

function rafraichir() {
  revalidatePath("/espace", "layout");
  revalidatePath("/admin", "layout");
}

export async function proposerOffre(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { user } = await exigerMembreActif();
  if (!autoriser(`offre:${user.id}`, 5, 86400)) {
    return { erreur: "Vous avez déjà proposé plusieurs offres aujourd’hui. Réessayez demain." };
  }
  const resultat = valider(schemaOffre, formData);
  if (!resultat.ok) return resultat.etat;

  // Une offre proposée par un administrateur est publiée directement.
  const parAdmin = estDuBureau(user.role);
  const offre = await prisma.offre.create({
    data: {
      ...resultat.donnees,
      deposeParId: user.id,
      statut: parAdmin ? "PUBLIEE" : "EN_ATTENTE",
      publieeLe: parAdmin ? new Date() : null,
    },
  });

  if (parAdmin) {
    await notifierMembres(offre.id);
  } else {
    void envoyerEmail({
      a: await emailsAdmins(),
      sujet: "Nouvelle offre à valider",
      texte: `${user.name} propose une offre : « ${offre.titre} » (${offre.organisation}).\n\nPour la valider :\n${adresseSite("/admin/offres")}`,
    });
  }

  rafraichir();
  return {
    succes: parAdmin
      ? "Offre publiée. Les membres ont été prévenus par e-mail."
      : "Merci ! Votre offre a été transmise au bureau, qui la publiera après relecture.",
  };
}

async function notifierMembres(offreId: string) {
  const offre = await prisma.offre.findUniqueOrThrow({ where: { id: offreId } });
  void envoyerEmail({
    a: await emailsMembresActifs(),
    copieCachee: true,
    sujet: `Nouvelle offre : ${offre.titre}`,
    texte: [
      `${LIBELLES_TYPE_OFFRE[offre.type]} — ${offre.organisation}${offre.lieu ? `, ${offre.lieu}` : ""}`,
      "",
      `${offre.titre}`,
      "",
      "Détails dans l’espace membres :",
      adresseSite("/espace/offres"),
    ].join("\n"),
  });
}

// ─── Modération (bureau) ───────────────────────────────────────────────────────

export async function publierOffre(formData: FormData) {
  await exigerBureau();
  const id = String(formData.get("id"));
  await prisma.offre.update({ where: { id }, data: { statut: "PUBLIEE", publieeLe: new Date() } });
  await notifierMembres(id);
  rafraichir();
}

export async function refuserOffre(formData: FormData) {
  await exigerBureau();
  await prisma.offre.update({ where: { id: String(formData.get("id")) }, data: { statut: "REFUSEE" } });
  rafraichir();
}

export async function supprimerOffre(formData: FormData) {
  await exigerBureau();
  await prisma.offre.delete({ where: { id: String(formData.get("id")) } });
  rafraichir();
}
