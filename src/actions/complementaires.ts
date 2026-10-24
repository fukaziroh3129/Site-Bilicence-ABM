"use server";

// Administration des formations complémentaires (/admin/formations-complementaires) :
// - « À reclasser » : DU, certifications, MOOC… saisis comme des masters. Les ranger modifie la fiche
//   de la personne : réservé aux administrateurs, avec une note transmise à la personne (ADM-02).
// - « Regroupements » : renommer une formation ou réunir deux écritures d'une même formation (bureau).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TYPES_COMPLEMENTAIRES, adresseFormation } from "@/lib/complementaires";
import { prisma } from "@/lib/db";
import { rangerEnComplementaire, repererComplementaires } from "@/lib/detection-complementaires";
import { champ, valider } from "@/lib/formulaire";
import { motifNecessaire, noterModification } from "@/lib/notes";
import { exigerAdmin, exigerBureau } from "@/lib/session";

const MOTIF_RANGEMENT = "Ce n’est pas un master : elle apparaît désormais dans vos formations complémentaires (étape « Études »), où vous pouvez ajouter votre avis.";

function rafraichir() {
  revalidatePath("/admin", "layout");
  revalidatePath("/espace", "layout");
  revalidatePath("/promotions");
}

const schemaRanger = z.object({ id: z.string().min(1), type: champ.choix(TYPES_COMPLEMENTAIRES) });

/** Range une formation « master » dans les formations complémentaires de la personne. */
export async function rangerFormation(formData: FormData) {
  const { user } = await exigerAdmin();
  const resultat = valider(schemaRanger, formData);
  if (!resultat.ok) return;
  const formation = await rangerEnComplementaire(prisma, resultat.donnees.id, resultat.donnees.type);
  if (formation) await noterRangement(user, formation);
  rafraichir();
}

/** Range d'un coup toutes les formations repérées, chacune avec le type proposé. */
export async function toutRanger() {
  const { user } = await exigerAdmin();
  const formations = await prisma.formation.findMany({
    where: { complementaireSuggere: { not: null }, complementaireEcarte: false },
    select: { id: true, complementaireSuggere: true },
  });
  for (const f of formations) {
    const rangee = await rangerEnComplementaire(prisma, f.id, f.complementaireSuggere!);
    if (rangee) await noterRangement(user, rangee);
  }
  rafraichir();
}

/** Le bureau confirme que c'est bien un master : la formation n'est plus proposée. */
export async function garderCommeMaster(formData: FormData) {
  await exigerAdmin();
  await prisma.formation.updateMany({
    where: { id: String(formData.get("id")) },
    data: { complementaireEcarte: true, complementaireSuggere: null },
  });
  rafraichir();
}

/** Relit toutes les formations « master » et met à jour la liste « À reclasser ». */
export async function relancerDetection() {
  await exigerBureau();
  await repererComplementaires(prisma);
  rafraichir();
}

async function noterRangement(auteur: { id: string; prenom: string; nom: string; personneId?: string | null }, formation: { personneId: string; intitule: string }) {
  const contexte = { personneId: formation.personneId, estProprietaire: auteur.personneId === formation.personneId, auteur };
  if (await motifNecessaire(contexte)) await noterModification(contexte, `Formation rangée : ${formation.intitule}`, MOTIF_RANGEMENT);
}

// ─── Regroupements ─────────────────────────────────────────────────────────────

/** Formations complémentaires d'un groupe (même titre aux accents, majuscules et ponctuation près). */
async function idsDuGroupe(cle: string) {
  const toutes = await prisma.formationComplementaire.findMany({ select: { id: true, titre: true } });
  return toutes.filter((f) => adresseFormation(f.titre) === cle).map((f) => f.id);
}

const schemaRenommer = z.object({ cle: z.string().min(1), titre: champ.texte(160) });

/** Donne le même titre à toutes les écritures d'une formation. */
export async function renommerFormationComplementaire(formData: FormData) {
  await exigerBureau();
  const resultat = valider(schemaRenommer, formData);
  if (!resultat.ok) return;
  const ids = await idsDuGroupe(resultat.donnees.cle);
  await prisma.formationComplementaire.updateMany({ where: { id: { in: ids } }, data: { titre: resultat.donnees.titre } });
  rafraichir();
}

const schemaFusion = z.object({ cle: z.string().min(1), cible: champ.texte(160) });

/** Réunit une formation dans une autre (« Projet Voltaire » → « Certificat Voltaire ») : elle en prend le titre et le type. */
export async function fusionnerFormationsComplementaires(formData: FormData) {
  await exigerBureau();
  const resultat = valider(schemaFusion, formData);
  if (!resultat.ok) return;
  const { cle, cible } = resultat.donnees;
  const cleCible = adresseFormation(cible);
  if (cleCible === cle) return;
  const modele = await prisma.formationComplementaire.findFirst({
    where: { id: { in: await idsDuGroupe(cleCible) } },
    select: { titre: true, type: true },
  });
  if (!modele) return; // la cible doit être une formation existante (choisie dans la liste)
  const ids = await idsDuGroupe(cle);
  await prisma.formationComplementaire.updateMany({ where: { id: { in: ids } }, data: { titre: modele.titre, type: modele.type } });
  rafraichir();
}
