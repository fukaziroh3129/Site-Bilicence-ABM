// Taux de remplissage d'une fiche (« Ma fiche est complète à 60 % »), pour encourager les membres.
// L'Erasmus et l'accord pour la page publique ne comptent pas : tout le monde ne part pas à
// l'étranger, et l'accord doit rester un choix libre (RGPD).

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
  nbFormations: number;
  nbExperiences: number;
};

export function completude(f: FicheACompter) {
  const elements: { libelle: string; etape: EtapeFiche; fait: boolean; minutes: number }[] = [
    { libelle: "Un contact visible des membres", etape: "identite", fait: f.afficherEmail || f.afficherLinkedin || f.afficherTelephone, minutes: 1 },
    { libelle: "Votre ville", etape: "identite", fait: !!f.ville, minutes: 1 },
    { libelle: "Votre situation", etape: "aujourdhui", fait: !!f.statutActuel, minutes: 1 },
    { libelle: "Votre poste ou formation actuelle", etape: "aujourdhui", fait: !!(f.situationActuelle || f.structureActuelle), minutes: 1 },
    { libelle: "Vos domaines", etape: "aujourdhui", fait: f.secteurs.length > 0, minutes: 1 },
    { libelle: "Une formation après la licence", etape: "etudes", fait: f.nbFormations > 0, minutes: 2 },
    { libelle: "Une expérience (stage, emploi…)", etape: "experiences", fait: f.nbExperiences > 0, minutes: 3 },
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
