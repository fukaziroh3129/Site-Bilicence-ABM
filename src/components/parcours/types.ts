// Données d'une carte de la page publique « Que sont-ils devenus ? ».
// Uniquement des informations couvertes par l'accord public : jamais de coordonnées,
// de retour d'expérience détaillé ni de contact de tuteur.

export type EtapeCarte = {
  titre: string;
  detail: string | null; // parcours du master, s'il est renseigné
  lieu: string;
  annees: string | null;
  enCours: boolean;
  base?: boolean; // la bi-licence, première étape de tous les parcours
};

export type ExperienceCarte = {
  type: string;
  poste: string | null;
  organisation: string;
  resume: string | null;
};

export type ErasmusCarte = {
  universite: string;
  pays: string;
  details: string | null; // « Licence · 2023 · Un semestre »
  descriptif: string | null;
};

export type CarteParcours = {
  id: string;
  prenom: string;
  nom: string;
  promo: string;
  statut: { code: string; libelle: string } | null;
  ville: string | null;
  presentation: string | null;
  aujourdhui: { titre: string; structure: string | null } | null;
  etapes: EtapeCarte[];
  domaines: string[]; // codes
  etablissements: string[]; // clés des établissements de poursuite d'études (filtre des statistiques)
  erasmus: ErasmusCarte[]; // toujours affichés en premier parmi les expériences
  experiences: ExperienceCarte[];
  conseil: string | null;
};

export type DomaineFiltre = {
  code: string;
  libelle: string;
  court: string;
  nombre: number;
};
