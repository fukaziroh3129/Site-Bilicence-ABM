// Notes de modification (patch ADM-02) : quand un administrateur modifie la fiche d'un membre, il
// indique ce qu'il a changé et pourquoi. La note est visible par la personne (« Ma fiche ») et par
// les administrateurs (historique sur la page de la fiche). Pas de note pour sa propre fiche, ni pour
// une fiche sans compte (personne à prévenir).

import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { valeursDe, type EtatFormulaire } from "@/lib/formulaire";

/** Nom du champ « Motif de la modification » dans les formulaires du bureau. */
export const CHAMP_MOTIF = "motifModification";

const schemaMotif = z
  .string({ error: "Indiquez le motif de la modification." })
  .trim()
  .min(5, "Indiquez le motif de la modification (quelques mots).")
  .max(500, "500 caractères maximum.");

type Contexte = {
  personneId: string;
  /** La personne connectée modifie-t-elle sa propre fiche ? */
  estProprietaire: boolean;
  auteur: { id: string; prenom: string; nom: string };
};

/** Faut-il un motif ? Oui quand le bureau modifie la fiche d'un membre qui a un compte. */
export async function motifNecessaire({ personneId, estProprietaire }: Pick<Contexte, "personneId" | "estProprietaire">) {
  if (estProprietaire) return false;
  return (await prisma.user.count({ where: { personneId } })) > 0;
}

/**
 * Lit et vérifie le motif d'un formulaire. Renvoie soit le motif (ou null s'il n'en faut pas), soit
 * l'état d'erreur à renvoyer au formulaire.
 */
export async function lireMotif(contexte: Contexte, formData: FormData): Promise<{ motif: string | null } | { erreur: EtatFormulaire }> {
  if (!(await motifNecessaire(contexte))) return { motif: null };
  const resultat = schemaMotif.safeParse(formData.get(CHAMP_MOTIF) ?? undefined);
  if (resultat.success) return { motif: resultat.data };
  return {
    erreur: {
      erreur: "Certains champs sont à corriger.",
      erreurs: { [CHAMP_MOTIF]: resultat.error.issues[0].message },
      valeurs: valeursDe(formData),
    },
  };
}

/** Enregistre la note (à appeler après la modification, quand un motif a été demandé). */
export async function noterModification(contexte: Contexte, objet: string, motif: string | null) {
  if (!motif) return;
  await prisma.noteModification.create({
    data: {
      personneId: contexte.personneId,
      auteurId: contexte.auteur.id,
      auteurNom: `${contexte.auteur.prenom} ${contexte.auteur.nom}`.trim(),
      objet: objet.slice(0, 200),
      motif,
    },
  });
}

/**
 * Pour les suppressions (bouton sans formulaire) : le motif est demandé dans une petite fenêtre
 * du navigateur ; sans motif valable, rien n'est supprimé.
 */
export async function motifSuppression(contexte: Contexte, formData: FormData) {
  if (!(await motifNecessaire(contexte))) return { ok: true as const, motif: null };
  const resultat = schemaMotif.safeParse(formData.get(CHAMP_MOTIF) ?? undefined);
  return resultat.success ? { ok: true as const, motif: resultat.data } : { ok: false as const, motif: null };
}
