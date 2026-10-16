// Fiches visibles des membres et du public : fiches sans compte (importées, saisies par le bureau)
// ou rattachées à un compte validé. Une fiche commencée par un compte EN ATTENTE (ou refusé) reste
// cachée — annuaire, stages, Erasmus, statistiques, page publique — tant que le bureau ne l'a pas validé.
// Les pré-comptes (INVITE, patch ADM-04) restent visibles : la personne a déjà accepté de figurer dans
// la base d'origine et peut modifier ou supprimer ses informations une fois son compte activé.
import type { Prisma } from "@/generated/prisma/client";

export const FICHE_VISIBLE = {
  OR: [{ compte: { is: null } }, { compte: { is: { statut: { in: ["ACTIF", "INVITE"] } } } }],
} satisfies Prisma.PersonneWhereInput;

// Cartes de la page publique « Que sont-ils devenus ? » : l'accord de la personne suffit pour
// apparaître (le bureau contrôle ensuite, /admin/devenir), sauf si le bureau a retiré la carte.
export const FICHE_PUBLIQUE = {
  consentementPublic: true,
  publicRetireLe: null,
  ...FICHE_VISIBLE,
} satisfies Prisma.PersonneWhereInput;
