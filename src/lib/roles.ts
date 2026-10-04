// Rôles du bureau (patch ADM-01). Du moins au plus élevé :
// - Animateur : valide les comptes, gère le contenu (actualités, événements, offres, bureau),
//   les domaines et les établissements ; consulte les fiches.
// - Administrateur : tout ce que fait l'animateur, plus les fiches (modification avec motif) et les
//   comptes (nommer ou retirer des animateurs, liens de mot de passe, suppressions, pré-comptes).
// - Propriétaire : le président, une seule personne ; nomme et retire les administrateurs. Le titre
//   se transfère, il n'est jamais supprimé (le site a toujours un responsable).
// Fichier sans dépendance serveur : utilisable aussi dans les composants du navigateur.

export type Role = "MEMBRE" | "ANIMATEUR" | "ADMIN" | "PROPRIETAIRE";

const RANG: Record<Role, number> = { MEMBRE: 0, ANIMATEUR: 1, ADMIN: 2, PROPRIETAIRE: 3 };

export const LIBELLES_ROLE: Record<Role, string> = {
  MEMBRE: "Membre",
  ANIMATEUR: "Animateur",
  ADMIN: "Administrateur",
  PROPRIETAIRE: "Propriétaire",
};

/** Le rôle atteint-il le niveau demandé ? (un administrateur a aussi les droits d'animateur…) */
export function aLeRole(role: string | null | undefined, minimum: Role) {
  return RANG[(role ?? "MEMBRE") as Role] >= RANG[minimum];
}

/** Accès à la console d'administration (/admin). */
export const estDuBureau = (role: string | null | undefined) => aLeRole(role, "ANIMATEUR");

/** Modifier toutes les fiches, gérer les comptes. */
export const estAdministrateur = (role: string | null | undefined) => aLeRole(role, "ADMIN");

type Compte = { id: string; role: string };

/**
 * Peut-on donner ce rôle à ce compte ?
 * - le titre de propriétaire ne se donne pas ici (transfert) et le propriétaire ne change pas de rôle ;
 * - chacun peut se rétrograder lui-même ;
 * - le propriétaire nomme et retire animateurs et administrateurs ;
 * - un administrateur nomme et retire les animateurs (pas les autres administrateurs).
 */
export function peutChangerRole(acteur: Compte, cible: Compte, nouveau: Role) {
  if (nouveau === "PROPRIETAIRE" || cible.role === "PROPRIETAIRE" || nouveau === cible.role) return false;
  if (acteur.id === cible.id) return RANG[nouveau] < RANG[cible.role as Role];
  if (acteur.role === "PROPRIETAIRE") return true;
  if (acteur.role === "ADMIN") return RANG[cible.role as Role] <= RANG.ANIMATEUR && RANG[nouveau] <= RANG.ANIMATEUR;
  return false;
}

/**
 * Peut-on agir sur ce compte (supprimer, envoyer un lien de mot de passe, pré-compte) ?
 * Le propriétaire sur tous les autres comptes ; un administrateur sur les membres et les animateurs.
 */
export function peutGererCompte(acteur: Compte, cible: Compte) {
  if (acteur.id === cible.id || cible.role === "PROPRIETAIRE") return false;
  if (acteur.role === "PROPRIETAIRE") return true;
  return acteur.role === "ADMIN" && RANG[cible.role as Role] <= RANG.ANIMATEUR;
}

export const LIBELLES_STATUT_COMPTE: Record<"INVITE" | "EN_ATTENTE" | "ACTIF" | "REFUSE", string> = {
  INVITE: "Pré-compte",
  EN_ATTENTE: "En attente",
  ACTIF: "Actif",
  REFUSE: "Refusé",
};
