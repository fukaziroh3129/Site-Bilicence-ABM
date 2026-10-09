"use server";

// Fonctions du bureau et pôles : étiquettes créées par le bureau et attribuées aux personnes (page Bureau).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { CLES_PICTOGRAMMES } from "@/lib/fonctions-bureau";
import { champ, valider, type EtatFormulaire } from "@/lib/formulaire";
import { exigerBureau } from "@/lib/session";

function rafraichirTout() {
  revalidatePath("/", "layout");
}

const schemaFonction = z.object({
  id: z.string().optional(),
  nom: champ.texte(80),
  niveau: champ.choix(["BUREAU", "POLE"]),
  icone: champ.choixFacultatif(CLES_PICTOGRAMMES),
  description: champ.texteFacultatif(300),
});

export async function enregistrerFonction(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const resultat = valider(schemaFonction, formData);
  if (!resultat.ok) return resultat.etat;
  const { id, ...d } = resultat.donnees;

  // Le pictogramme et la description ne servent qu'aux pôles.
  const donnees = { ...d, icone: d.niveau === "POLE" ? d.icone : null, description: d.niveau === "POLE" ? d.description : null };

  if (id) {
    const avant = await prisma.fonction.findUniqueOrThrow({ where: { id } });
    // Changer de niveau : l'étiquette passe en fin de son nouveau niveau.
    const ordre = avant.niveau === d.niveau ? avant.ordre : await rangSuivant(d.niveau);
    await prisma.fonction.update({ where: { id }, data: { ...donnees, ordre } });
  } else {
    await prisma.fonction.create({ data: { ...donnees, ordre: await rangSuivant(d.niveau) } });
  }

  rafraichirTout();
  redirect("/admin/bureau?vue=etiquettes");
}

async function rangSuivant(niveau: "BUREAU" | "POLE") {
  const derniere = await prisma.fonction.aggregate({ where: { niveau }, _max: { ordre: true } });
  return (derniere._max.ordre ?? 0) + 1;
}

/** Monte ou descend une étiquette d'un cran dans son niveau (échange son rang avec sa voisine). */
export async function deplacerFonction(formData: FormData) {
  await exigerBureau();
  const id = String(formData.get("id"));
  const sens = formData.get("sens") === "haut" ? "haut" : "bas";

  const fonction = await prisma.fonction.findUniqueOrThrow({ where: { id } });
  const memeNiveau = await prisma.fonction.findMany({ where: { niveau: fonction.niveau }, orderBy: [{ ordre: "asc" }, { nom: "asc" }] });
  const position = memeNiveau.findIndex((f) => f.id === id);
  const voisine = memeNiveau[sens === "haut" ? position - 1 : position + 1];
  if (!voisine) return;

  // On renumérote tout le niveau (1, 2, 3…) : évite les rangs identiques qui empêcheraient l'échange.
  const nouvelOrdre = memeNiveau.map((f) => f.id);
  [nouvelOrdre[position], nouvelOrdre[position + (sens === "haut" ? -1 : 1)]] = [voisine.id, id];
  await prisma.$transaction(nouvelOrdre.map((fid, i) => prisma.fonction.update({ where: { id: fid }, data: { ordre: i + 1 } })));

  rafraichirTout();
}

/** Supprime l'étiquette : les personnes restent, elles n'ont simplement plus cette étiquette. */
export async function supprimerFonction(formData: FormData) {
  await exigerBureau();
  await prisma.fonction.delete({ where: { id: String(formData.get("id")) } });
  rafraichirTout();
}
