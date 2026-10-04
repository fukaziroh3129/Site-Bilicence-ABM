// Contenu de la page « La formation » : matières, chiffres d'admission, sources.
// Tout vient de sources officielles (voir SOURCES) ; à mettre à jour chaque année.
//  - Matières, crédits et heures : plaquette 2024-2025 de la Faculté d'Économie (maquette complète).
//    La discipline de chaque matière suit la faculté qui l'enseigne (catalogue des formations de l'UM) ;
//    l'anglais, l'informatique, le projet personnel et la préparation au grand oral sont « communs ».
//  - Admission : données ouvertes Parcoursup (sessions 2021 à 2025).

export type Discipline = "ECO" | "SCPO" | "COMMUN";

export const LIBELLES_DISCIPLINE: Record<Discipline, string> = {
  ECO: "Économie",
  SCPO: "Science politique",
  COMMUN: "Commun aux deux",
};

/** Faculté qui assure l'enseignement (affichée dans la mini-fiche). */
export const FACULTE: Record<Discipline, string> = {
  ECO: "Faculté d’Économie (site Richter)",
  SCPO: "Faculté de Droit et de Science politique",
  COMMUN: "Enseignement commun",
};

export type Matiere = {
  id: string;
  nom: string;
  discipline: Discipline;
  semestre: 1 | 2 | 3 | 4 | 5 | 6;
  ects: number;
  cm?: number; // heures de cours magistral
  td?: number; // heures de travaux dirigés
  /** Descriptif du contenu : non publié par l'université pour l'instant (à compléter). */
  contenu?: string;
};

const m = (
  semestre: Matiere["semestre"],
  discipline: Discipline,
  nom: string,
  ects: number,
  cm?: number,
  td?: number,
): Matiere => ({ id: `s${semestre}-${nom}`, nom, discipline, semestre, ects, cm, td });

export const MATIERES: Matiere[] = [
  // Semestre 1
  m(1, "SCPO", "Introduction à la science politique 1", 4, 33, 15),
  m(1, "SCPO", "Vie politique française 1", 4, 33, 15),
  m(1, "SCPO", "Histoire des sciences sociales", 3, 33),
  m(1, "SCPO", "Relations internationales", 3, 33),
  m(1, "ECO", "Principes d’économie", 4, 30),
  m(1, "ECO", "Histoire des faits économiques", 4, 30, 15),
  m(1, "ECO", "Mathématiques pour économistes 1", 3, 30, 30),
  m(1, "ECO", "Économie d’entreprise", 3, 30, 15),
  m(1, "COMMUN", "Anglais 1", 2, undefined, 15),
  // Semestre 2
  m(2, "SCPO", "Introduction à la science politique 2", 4, 33, 15),
  m(2, "SCPO", "Vie politique sous la Ve République", 4, 33),
  m(2, "SCPO", "Droit constitutionnel de la Ve République", 3, 33),
  m(2, "SCPO", "Institutions administratives", 3, 22),
  m(2, "ECO", "Microéconomie 1", 4, 30, 15),
  m(2, "ECO", "Macroéconomie 1", 4, 30, 15),
  m(2, "ECO", "Statistiques 1", 3, 30, 15),
  m(2, "ECO", "Problèmes économiques contemporains", 3, 30),
  m(2, "COMMUN", "Anglais 2", 2, undefined, 15),
  // Semestre 3
  m(3, "SCPO", "Communication politique", 3, 33),
  m(3, "SCPO", "Mobilisations et mouvements sociaux", 4, 33, 15),
  m(3, "SCPO", "Culture générale 1 : grands problèmes politiques et sociaux", 3, 33),
  m(3, "SCPO", "Sociologie historique de l’État", 4, 33),
  m(3, "ECO", "Microéconomie 2", 4, 30, 15),
  m(3, "ECO", "Macroéconomie 2", 3, 30, 15),
  m(3, "ECO", "Statistiques 2", 3, 30, 15),
  m(3, "ECO", "Institutions et développement", 2, 20),
  m(3, "COMMUN", "Anglais 3", 2, undefined, 15),
  m(3, "COMMUN", "Informatique", 2, undefined, 15),
  // Semestre 4
  m(4, "SCPO", "Culture générale 2 : conférences d’actualité", 3, 33),
  m(4, "SCPO", "Systèmes politiques occidentaux 1", 4, 33, 15),
  m(4, "SCPO", "Théorie politique", 2, 22),
  m(4, "SCPO", "Grands classiques de la sociologie 1", 4, 33, 15),
  m(4, "ECO", "Microéconomie 3", 4, 30, 15),
  m(4, "ECO", "Macroéconomie 3", 4, 30, 15),
  m(4, "ECO", "Mathématiques et statistiques pour économistes", 4, 30, 15),
  m(4, "ECO", "Démographie économique", 3, 20),
  m(4, "COMMUN", "Anglais 4", 2, undefined, 15),
  // Semestre 5
  m(5, "SCPO", "Initiation aux politiques publiques", 4, 33, 15),
  m(5, "SCPO", "Régimes dictatoriaux", 3, 33),
  m(5, "SCPO", "Grands enjeux internationaux", 4, 33),
  m(5, "SCPO", "Science politique de l’Europe", 3, 33),
  m(5, "ECO", "Organisation industrielle", 4, 30, 15),
  m(5, "ECO", "Histoire de la pensée économique", 3, 30),
  m(5, "ECO", "Économie des médias", 2, 20),
  m(5, "ECO", "Option au choix : problèmes économiques contemporains approfondis ou économétrie", 3, 20),
  m(5, "COMMUN", "Anglais 5", 2, 10, 10),
  m(5, "COMMUN", "Préparation au grand oral 1", 2, undefined, 20),
  // Semestre 6
  m(6, "SCPO", "Culture générale 3 : enjeux politiques contemporains", 2, 22),
  m(6, "SCPO", "Systèmes politiques occidentaux 2", 4, 33, 15),
  m(6, "SCPO", "Grands classiques de la sociologie 2", 3, 33),
  m(6, "ECO", "Épistémologie des sciences sociales", 2, 22),
  m(6, "ECO", "Politique économique et sociale", 4, 30, 15),
  m(6, "ECO", "Analyse financière", 2, 20, 15),
  m(6, "ECO", "Base de données", 2, 20, 15),
  m(6, "ECO", "Économie internationale", 3, 30),
  m(6, "COMMUN", "Anglais 6", 2, 10, 10),
  m(6, "COMMUN", "Préparation au grand oral 2", 4, undefined, 20),
  m(6, "COMMUN", "Projet personnel de l’étudiant", 2, 10, 10),
];

/** Options facultatives proposées chaque semestre (sans crédits). */
export const OPTIONS_FACULTATIVES = [
  "Remise à niveau en mathématiques",
  "Sport",
  "Projet étudiant",
  "Engagement étudiant",
  "Certification Voltaire",
  "PIX",
  "Préparation au TOEIC",
  "Découverte du spectacle vivant",
];

/** Chiffres Parcoursup de la bi-licence (vœux en phase principale, admis = ayant accepté). */
export const PARCOURSUP = {
  sessions: [
    { annee: 2021, places: 30, voeux: 1699, propositions: 174, admis: 29, tauxAcces: null as number | null },
    { annee: 2022, places: 30, voeux: 1677, propositions: 179, admis: 30, tauxAcces: 17 },
    { annee: 2023, places: 30, voeux: 1907, propositions: 217, admis: 34, tauxAcces: 17 },
    { annee: 2024, places: 30, voeux: 2193, propositions: 187, admis: 33, tauxAcces: 13 },
    { annee: 2025, places: 30, voeux: 2212, propositions: 200, admis: 36, tauxAcces: 14 },
  ],
  /** Profil des néo-bacheliers admis lors de la dernière session (en %). */
  profil2025: { mentionTresBien: 72, boursiers: 34, memeAcademie: 44 },
  fiche: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=45377&typeBac=0&originePc=0",
};

export const RESPONSABLES = [
  { nom: "Thomas Cortade", fonction: "Responsable pédagogique de la bi-licence" },
  { nom: "Éric Savarese", fonction: "Responsable pédagogique de la bi-licence" },
];

export const SOURCES = [
  {
    libelle: "Fiche de la licence Économie, Science politique (catalogue des formations de l’UM, mise à jour du 19 février 2026)",
    url: "https://formations-en.umontpellier.fr/plugins/odf-web/um1/_content/program-bi-licence-mention-science-politique-et-economie/LICENCE%20%C3%89CONOMIE,%20SCIENCE%20POLITIQUE.pdf",
  },
  {
    libelle: "Plaquette de la bi-licence 2024-2025 (Faculté d’Économie)",
    url: "https://economie.edu.umontpellier.fr/files/2024/09/2024-2025_Bi-licence.pdf",
  },
  {
    libelle: "Parcoursup : vœux de poursuite d’études et réponses des établissements (données ouvertes, sessions 2021 à 2025)",
    url: "https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-parcoursup/",
  },
];
