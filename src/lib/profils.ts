// Types de compte, choisis à l'adhésion (/adhesion) :
// - Alumni : étudiant ou ancien de la bi-licence. Il a une fiche (annuaire, « Que sont-ils devenus ? »).
// - Personnel : enseignant, responsable de la formation, direction, administration de l'université. Même accès
//   qu'un membre une fois validé par le bureau, mais JAMAIS de fiche : il n'apparaît ni dans l'annuaire ni sur le
//   site public.
// Fichier sans dépendance serveur : utilisable aussi dans les composants du navigateur.

export type Profil = "ALUMNI" | "PERSONNEL";

export const PROFILS = ["ALUMNI", "PERSONNEL"] as const;

export const LIBELLES_PROFIL: Record<Profil, string> = {
  ALUMNI: "Étudiant ou ancien de la bi-licence",
  PERSONNEL: "Personnel de l’université",
};

/** Fonctions proposées au personnel de l'université (le code est enregistré dans `User.fonction`). */
export const FONCTIONS_PERSONNEL = [
  { code: "ENSEIGNANT", libelle: "Enseignant ou enseignant-chercheur" },
  { code: "RESPONSABLE", libelle: "Responsable de la formation" },
  { code: "DIRECTION", libelle: "Direction de la faculté ou de l’université" },
  { code: "ADMINISTRATIF", libelle: "Personnel administratif" },
  { code: "AUTRE", libelle: "Autre personnel de l’université" },
] as const;

export const CODES_FONCTION = FONCTIONS_PERSONNEL.map((f) => f.code) as [string, ...string[]];

/** Libellé d'une fonction (« Responsable de la formation »), ou celui par défaut si le code est inconnu. */
export function libelleFonction(code: string | null | undefined) {
  return FONCTIONS_PERSONNEL.find((f) => f.code === code)?.libelle ?? "Personnel de l’université";
}

/** Le compte est-il celui d'un membre du personnel de l'université (donc sans fiche) ? */
export const estPersonnel = (compte: { profil?: string | null } | null | undefined) => compte?.profil === "PERSONNEL";
