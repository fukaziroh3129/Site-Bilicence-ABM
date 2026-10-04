"use server";

// Formulaire de contact : le message est transmis par e-mail aux administrateurs (bureau).
// Il n'est pas enregistré en base.

import { z } from "zod";
import { emailsAdmins, envoyerEmail } from "@/lib/email";
import { champ, valider, type EtatFormulaire } from "@/lib/formulaire";
import { MESSAGE_LIMITE, adresseIp, autoriser } from "@/lib/limite";

const OBJETS = ["question", "donnees", "partenariat", "autre"] as const;
export type ObjetContact = (typeof OBJETS)[number];

const LIBELLES_OBJET: Record<ObjetContact, string> = {
  question: "Question sur l’association",
  donnees: "Mes données personnelles (RGPD)",
  partenariat: "Partenariat, offre de stage ou d’emploi",
  autre: "Autre",
};

const schemaContact = z.object({
  nom: champ.texte(120),
  email: champ.email(),
  objet: champ.choix(OBJETS),
  message: champ.texte(5000),
  // Champ piège invisible : un humain le laisse vide, un robot le remplit.
  site: z.string().optional(),
});

export async function envoyerContact(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!autoriser(`contact:${await adresseIp()}`, 3, 3600)) return { erreur: MESSAGE_LIMITE };

  const resultat = valider(schemaContact, formData);
  if (!resultat.ok) return resultat.etat;
  const d = resultat.donnees;

  // Robot détecté : on fait comme si tout s'était bien passé, sans rien envoyer.
  if (d.site) return { succes: "Merci, votre message a bien été envoyé." };

  const destinataires = await emailsAdmins();
  if (destinataires.length === 0) {
    return { erreur: "Le formulaire n’est pas encore opérationnel. Réessayez plus tard." };
  }

  await envoyerEmail({
    a: destinataires,
    repondreA: d.email,
    sujet: `[Contact] ${LIBELLES_OBJET[d.objet]}`,
    texte: [`De : ${d.nom} <${d.email}>`, `Objet : ${LIBELLES_OBJET[d.objet]}`, "", d.message, "", "—", "Répondez directement à cet e-mail pour écrire à l’expéditeur."].join("\n"),
  });

  return { succes: "Merci, votre message a bien été envoyé. Le bureau vous répondra par e-mail." };
}

export async function libellesObjets() {
  return OBJETS.map((valeur) => ({ valeur, libelle: LIBELLES_OBJET[valeur] }));
}
