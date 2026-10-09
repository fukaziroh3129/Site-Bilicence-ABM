"use server";

// Gestion des domaines par le bureau : ajout, renommage, contrôle des domaines ajoutés par les
// membres (utilisables tout de suite, patch ADM-03), fusion de deux domaines (doublons) et suppression.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { GROUPES_DOMAINES } from "@/lib/domaines";
import { slugifier } from "@/lib/format";
import { champ, valider } from "@/lib/formulaire";
import { exigerBureau } from "@/lib/session";

function rafraichir() {
  revalidatePath("/", "layout");
}

const schemaLibelles = z.object({
  libelle: champ.texte(80),
  court: champ.texte(28),
  groupe: champ.choixFacultatif(GROUPES_DOMAINES),
});

/** Ajoute un domaine (déjà contrôlé, puisqu'il vient du bureau). */
export async function creerDomaine(formData: FormData) {
  await exigerBureau();
  const resultat = valider(schemaLibelles, formData);
  if (!resultat.ok) return;
  const { libelle, court, groupe } = resultat.donnees;

  const base = slugifier(libelle) || "domaine";
  let code = base;
  for (let i = 2; await prisma.domaine.findUnique({ where: { code } }); i++) code = `${base}-${i}`;
  await prisma.domaine.create({ data: { code, libelle, court, groupe } });
  rafraichir();
}

/** Renomme un domaine et le marque comme contrôlé. */
export async function enregistrerDomaine(formData: FormData) {
  await exigerBureau();
  const resultat = valider(schemaLibelles.extend({ id: z.string().min(1) }), formData);
  if (!resultat.ok) return;
  const { id, libelle, court, groupe } = resultat.donnees;
  await prisma.domaine.update({ where: { id }, data: { libelle, court, groupe, aControler: false } });
  rafraichir();
}

/** Fusionne un domaine dans un autre : les fiches et expériences passent sur le domaine cible. */
export async function fusionnerDomaine(formData: FormData) {
  await exigerBureau();
  const id = String(formData.get("id"));
  const cible = String(formData.get("cible"));
  const source = await prisma.domaine.findUniqueOrThrow({ where: { id } });
  const destination = await prisma.domaine.findUniqueOrThrow({ where: { code: cible } });
  if (source.id === destination.id) return;
  const [a, b] = [source.code, destination.code];

  await prisma.$transaction([
    // Fiches ayant déjà les deux domaines : on retire simplement l'ancien.
    prisma.$executeRaw`UPDATE "Personne" SET "secteurs" = array_remove("secteurs", ${a}) WHERE ${a} = ANY("secteurs") AND ${b} = ANY("secteurs")`,
    prisma.$executeRaw`UPDATE "Personne" SET "secteurs" = array_replace("secteurs", ${a}, ${b}) WHERE ${a} = ANY("secteurs")`,
    prisma.$executeRaw`UPDATE "Experience" SET "secteurs" = array_remove("secteurs", ${a}) WHERE ${a} = ANY("secteurs") AND ${b} = ANY("secteurs")`,
    prisma.$executeRaw`UPDATE "Experience" SET "secteurs" = array_replace("secteurs", ${a}, ${b}) WHERE ${a} = ANY("secteurs")`,
    prisma.domaine.delete({ where: { id: source.id } }),
  ]);
  rafraichir();
}

/** Supprime un domaine et le retire de toutes les fiches et expériences. */
export async function supprimerDomaine(formData: FormData) {
  await exigerBureau();
  const domaine = await prisma.domaine.findUniqueOrThrow({ where: { id: String(formData.get("id")) } });
  const code = domaine.code;
  await prisma.$transaction([
    prisma.$executeRaw`UPDATE "Personne" SET "secteurs" = array_remove("secteurs", ${code}) WHERE ${code} = ANY("secteurs")`,
    prisma.$executeRaw`UPDATE "Experience" SET "secteurs" = array_remove("secteurs", ${code}) WHERE ${code} = ANY("secteurs")`,
    prisma.domaine.delete({ where: { id: domaine.id } }),
  ]);
  rafraichir();
}
