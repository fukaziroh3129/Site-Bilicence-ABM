// Taux de remplissage d'une fiche (« Ma fiche est complète à 60 % »), pour encourager les membres.
// Les étapes Études, Expériences et Erasmus comptent comme remplies quand la personne a indiqué
// qu'elle n'a rien à y mettre (« Je suis encore en bi-licence », « pas encore de stage », « pas
// d'Erasmus ») : une fiche peut ainsi être complète. L'accord pour la page publique ne compte pas :
// il doit rester un choix libre (RGPD).

/** Étapes de « Ma fiche », dans l'ordre du parcours. */
export const ETAPES_FICHE = [
  { cle: "identite", titre: "Vous", sousTitre: "Identité et contacts" },
  { cle: "aujourdhui", titre: "Aujourd’hui", sousTitre: "Situation et domaines" },
  { cle: "etudes", titre: "Études", sousTitre: "Après la bi-licence" },
  { cle: "experiences", titre: "Expériences", sousTitre: "Stages, emplois, associatif" },
  { cle: "erasmus", titre: "Erasmus", sousTitre: "Séjours à l’étranger" },
  { cle: "carte", titre: "Votre carte", sousTitre: "Présentation et conseil" },
] as const;

export type EtapeFiche = (typeof ETAPES_FICHE)[number]["cle"];

export function estEtapeFiche(valeur: unknown): valeur is EtapeFiche {
  return ETAPES_FICHE.some((e) => e.cle === valeur);
}

type FicheACompter = {
  statutActuel: string | null;
  situationActuelle: string | null;
  structureActuelle: string | null;
  ville: string | null;
  secteurs: string[];
  presentation: string | null;
  conseil: string | null;
  afficherEmail: boolean;
  afficherLinkedin: boolean;
  afficherTelephone: boolean;
  sansExperience: boolean;
  sansErasmus: boolean;
  nbFormations: number;
  nbExperiences: number;
  nbErasmus: number;
};

/** Compteurs à demander à Prisma (`include: { _count: { select: COMPTES_FICHE } }`). */
export const COMPTES_FICHE = { formations: true, experiences: true, erasmus: true } as const;

/** Raccourci pour une fiche lue avec `_count` (voir COMPTES_FICHE). */
export function completudeDe<T extends Omit<FicheACompter, "nbFormations" | "nbExperiences" | "nbErasmus">>(
  fiche: T & { _count: { formations: number; experiences: number; erasmus: number } },
) {
  return completude({ ...fiche, nbFormations: fiche._count.formations, nbExperiences: fiche._count.experiences, nbErasmus: fiche._count.erasmus });
}

/** La personne a indiqué qu'elle est encore en bi-licence (aucun master à renseigner pour l'instant). */
export const estEnBiLicence = (f: { statutActuel: string | null }) => f.statutActuel === "EN_LICENCE";

export function completude(f: FicheACompter) {
  const elements: { libelle: string; etape: EtapeFiche; fait: boolean; minutes: number }[] = [
    { libelle: "Un contact visible des membres", etape: "identite", fait: f.afficherEmail || f.afficherLinkedin || f.afficherTelephone, minutes: 1 },
    { libelle: "Votre ville", etape: "identite", fait: !!f.ville, minutes: 1 },
    { libelle: "Votre situation", etape: "aujourdhui", fait: !!f.statutActuel, minutes: 1 },
    { libelle: "Votre poste ou formation actuelle", etape: "aujourdhui", fait: !!(f.situationActuelle || f.structureActuelle), minutes: 1 },
    { libelle: "Vos domaines", etape: "aujourdhui", fait: f.secteurs.length > 0, minutes: 1 },
    { libelle: "Une formation après la licence", etape: "etudes", fait: f.nbFormations > 0 || estEnBiLicence(f), minutes: 2 },
    { libelle: "Une expérience (stage, emploi…)", etape: "experiences", fait: f.nbExperiences > 0 || f.sansExperience, minutes: 3 },
    { libelle: "Votre Erasmus (ou l’indiquer si vous n’êtes pas parti)", etape: "erasmus", fait: f.nbErasmus > 0 || f.sansErasmus, minutes: 1 },
    { libelle: "Votre présentation", etape: "carte", fait: !!f.presentation, minutes: 1 },
    { libelle: "Votre conseil aux étudiants", etape: "carte", fait: !!f.conseil, minutes: 1 },
  ];
  const faits = elements.filter((e) => e.fait).length;
  // L'identité (nom, prénom, promotion) est toujours remplie : elle compte comme un élément fait.
  const pourcentage = Math.round(((faits + 1) / (elements.length + 1)) * 100);
  const restants = elements.filter((e) => !e.fait);
  return {
    pourcentage,
    restants,
    minutesRestantes: restants.reduce((s, e) => s + e.minutes, 0),
    /** Étapes où il reste quelque chose à remplir. */
    etapesIncompletes: new Set(restants.map((e) => e.etape)),
  };
}

/** Petit message d'encouragement selon l'avancement. */
export function encouragement(pourcentage: number) {
  if (pourcentage >= 100) return "Votre fiche est complète. Merci, elle aidera les promotions suivantes !";
  if (pourcentage >= 75) return "Presque fini : encore quelques détails.";
  if (pourcentage >= 40) return "Bon début ! Vos études et vos expériences sont ce qui intéresse le plus les étudiants.";
  return "Quelques minutes suffisent pour aider les étudiants qui suivent votre chemin.";
}
