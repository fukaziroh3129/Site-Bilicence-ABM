// Règles d'accès aux fiches : chacun modifie la sienne, les administrateurs modifient toutes les fiches
// (avec un motif, patch ADM-02 : voir src/lib/notes.ts).
import "server-only";
import { notFound } from "next/navigation";
import type { EtapeFiche } from "@/lib/completude";
import { prisma } from "@/lib/db";
import { estAdministrateur } from "@/lib/roles";
import { exigerCompte } from "@/lib/session";

/**
 * Vérifie que la personne connectée peut modifier cette fiche ; sinon page introuvable.
 * Le propriétaire peut le faire même si son compte attend encore la validation du bureau.
 */
export async function exigerDroitSurFiche(personneId: string) {
  const session = await exigerCompte();
  const estAdmin = estAdministrateur(session.user.role) && session.user.statut === "ACTIF";
  const estProprietaire = session.user.personneId === personneId;
  if (!estAdmin && !estProprietaire) notFound();

  const existe = await prisma.personne.findUnique({ where: { id: personneId }, select: { id: true } });
  if (!existe) notFound();

  return { session, estProprietaire };
}

/** Page vers laquelle revenir après avoir modifié une fiche. */
export function pageDeFiche(personneId: string, estProprietaire: boolean, etape?: EtapeFiche) {
  if (!estProprietaire) return `/admin/personnes/${personneId}`;
  return etape ? `/espace/ma-fiche?etape=${etape}` : "/espace/ma-fiche";
}
