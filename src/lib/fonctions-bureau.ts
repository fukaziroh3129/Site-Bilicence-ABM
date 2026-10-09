// Fonctions du bureau et pôles : étiquettes créées dans l'administration (table `Fonction`) et attribuées
// aux personnes du bureau. Ce fichier ne dépend ni de Lucide ni de Prisma : il sert au serveur et au navigateur.
// Le pictogramme de chaque clé est choisi dans src/components/bureau/frise-bureau.tsx.

export const PICTOGRAMMES = [
  { cle: "groupe", libelle: "Groupe de personnes" },
  { cle: "megaphone", libelle: "Mégaphone (communication)" },
  { cle: "fete", libelle: "Fête (événementiel)" },
  { cle: "culture", libelle: "Masques (culture)" },
  { cle: "entraide", libelle: "Livre (entraide)" },
  { cle: "sport", libelle: "Trophée (sport)" },
  { cle: "technique", libelle: "Clé (technique)" },
] as const;

export const CLES_PICTOGRAMMES = PICTOGRAMMES.map((p) => p.cle) as [string, ...string[]];

export const NIVEAUX = [
  { valeur: "BUREAU", libelle: "Fonction du bureau (présidence, trésorerie…)" },
  { valeur: "POLE", libelle: "Pôle" },
] as const;

type Classable = { niveau: "BUREAU" | "POLE"; ordre: number; nom: string };

/** Tri d'affichage : le bureau d'abord, puis les pôles ; dans chaque niveau, par rang puis par nom. */
export function trierFonctions<T extends Classable>(fonctions: readonly T[]): T[] {
  return [...fonctions].sort(
    (a, b) =>
      (a.niveau === b.niveau ? 0 : a.niveau === "BUREAU" ? -1 : 1) || a.ordre - b.ordre || a.nom.localeCompare(b.nom, "fr"),
  );
}
