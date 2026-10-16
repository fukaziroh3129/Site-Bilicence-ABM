"use server";

// Contrôle a posteriori des cartes de la page publique « Que sont-ils devenus ? » (/admin/devenir).
// La carte est publiée dès que la personne a donné son accord ; le bureau la valide ensuite, ou la retire
// avec un motif (transmis à la personne dans « Ma fiche ») et la rétablit si besoin.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { valider, type EtatFormulaire } from "@/lib/formulaire";
import { journaliser } from "@/lib/journal";
import { exigerBureau } from "@/lib/session";

function rafraichir(personneId?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/espace", "layout");
  revalidatePath("/promotions");
  revalidatePath("/");
  if (personneId) revalidatePath(`/admin/personnes/${personneId}`);
}

/** Prévient la personne (note visible dans « Ma fiche ») quand elle a un compte. */
async function prevenir(auteur: { id: string; prenom: string; nom: string }, personneId: string, objet: string, motif: string) {
  if ((await prisma.user.count({ where: { personneId } })) === 0) return;
  await prisma.noteModification.create({
    data: { personneId, auteurId: auteur.id, auteurNom: `${auteur.prenom} ${auteur.nom}`.trim(), objet, motif },
  });
}

/** Marque une ou plusieurs cartes comme contrôlées (« Tout est en ordre »). */
export async function validerCartes(formData: FormData) {
  const { user } = await exigerBureau();
  const resultat = valider(
    z.object({
      ids: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
    }),
    formData,
  );
  if (!resultat.ok || resultat.donnees.ids.length === 0) return;
  const { ids } = resultat.donnees;

  await prisma.personne.updateMany({
    where: { id: { in: ids }, consentementPublic: true, publicRetireLe: null },
    data: { publicControleLe: new Date() },
  });
  journaliser(user, `cartes publiques validées (${ids.length})`);
  rafraichir();
}

/** Retire une carte de la page publique, avec un motif obligatoire. */
export async function retirerCarte(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { user } = await exigerBureau();
  const resultat = valider(
    z.object({
      id: z.string().min(1),
      motif: z
        .string({ error: "Indiquez le motif du retrait." })
        .trim()
        .min(5, "Indiquez le motif du retrait (quelques mots).")
        .max(300, "300 caractères maximum."),
    }),
    formData,
  );
  if (!resultat.ok) return resultat.etat;
  const { id, motif } = resultat.donnees;

  const modifiees = await prisma.personne.updateMany({
    where: { id, publicRetireLe: null },
    data: { publicRetireLe: new Date(), publicRetireMotif: motif, publicControleLe: null },
  });
  if (modifiees.count === 0) return { erreur: "Cette carte n’est plus publiée." };

  await prevenir(user, id, "Carte « Que sont-ils devenus ? » retirée de la page publique", motif);
  journaliser(user, "carte publique retirée", id);
  rafraichir(id);
  return { succes: "Carte retirée de la page publique." };
}

/** Rétablit une carte retirée : elle réapparaît (si la personne est toujours d'accord) et compte comme contrôlée. */
export async function retablirCarte(formData: FormData) {
  const { user } = await exigerBureau();
  const resultat = valider(z.object({ id: z.string().min(1) }), formData);
  if (!resultat.ok) return;
  const { id } = resultat.donnees;

  const modifiees = await prisma.personne.updateMany({
    where: { id, publicRetireLe: { not: null } },
    data: { publicRetireLe: null, publicRetireMotif: null, publicControleLe: new Date() },
  });
  if (modifiees.count === 0) return;

  await prevenir(user, id, "Carte « Que sont-ils devenus ? » rétablie", "Le bureau a rétabli votre carte sur la page publique.");
  journaliser(user, "carte publique rétablie", id);
  rafraichir(id);
}
