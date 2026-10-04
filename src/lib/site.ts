// Informations générales du site, centralisées ici pour être modifiées en un seul endroit.

export const site = {
  nom: "Alumni Bi-Licence Montpellier",
  sigle: "ABM",
  formation: "bi-licence Économie / Sciences politiques",
  universite: "Université de Montpellier",
  description:
    "Le réseau des étudiants et diplômés de la bi-licence Économie / Sciences politiques de l’Université de Montpellier.",

  // Liens externes : laisser à null tant que l'adresse n'est pas connue.
  // Le site affiche alors un emplacement « à compléter » au lieu d'un lien cassé.
  liens: {
    // Page HelloAsso de l'association (bouton « Adhérer sur HelloAsso »).
    helloAsso: null as string | null,
    // Formulaire HelloAsso intégré dans la page Adhésion (facultatif) : dans HelloAsso, ouvrir le
    // formulaire d'adhésion → « Diffuser » → « Intégrer à mon site » et copier l'adresse du widget,
    // de la forme https://www.helloasso.com/associations/<asso>/adhesions/<formulaire>/widget
    helloAssoWidget: null as string | null,
    instagram: null as string | null,
  },

  // Pôles de l'association, dans l'ordre de la page Bureau (frise). Le pictogramme de chaque pôle est
  // choisi dans src/components/bureau/frise-bureau.tsx. Liste à confirmer par le bureau
  // (cahier des charges : Sport, Événementiel, Entraide, Culture, Technique ; Communication ajouté).
  poles: [
    { code: "communication", nom: "Communication" },
    { code: "evenementiel", nom: "Événementiel" },
    { code: "culture", nom: "Culture" },
    { code: "entraide", nom: "Entraide" },
    { code: "sport", nom: "Sport" },
    { code: "technique", nom: "Technique" },
  ] as const,

  // Mandat du bureau affiché sur la page Bureau (ex. "2026-2027"), ou null.
  mandat: null as string | null,

  // Identité juridique (mentions légales, politique de confidentialité).
  // Laisser à null ce qui n'est pas encore connu : le site affiche alors « à compléter ».
  association: {
    forme: "Association loi 1901",
    siege: null as string | null, // adresse du siège social (statuts)
    rna: null as string | null, // numéro RNA (W…), sur le récépissé de déclaration en préfecture
    email: null as string | null, // adresse de contact, aussi utilisée pour les demandes RGPD
    directeurPublication: "Guillaume Dedieu, président de l’association",
  },

  // Prestataires techniques (sous-traitants au sens du RGPD).
  hebergeur: {
    nom: "Hostinger International Ltd",
    adresse: "61 Lordou Vironos Street, 6023 Larnaca, Chypre",
    site: "https://www.hostinger.fr",
    // Pays du centre de données du VPS (visible dans le panneau Hostinger), ex. "France".
    localisationServeur: null as string | null,
  },
  emailing: {
    nom: "Brevo (Sendinblue SAS)",
    adresse: "106 boulevard Haussmann, 75008 Paris, France",
    site: "https://www.brevo.com",
  },
};

// Navigation de la partie publique.
export const navigation = [
  { href: "/la-formation", label: "La formation" },
  { href: "/actualites", label: "Actualités" },
  { href: "/promotions", label: "Les promotions" },
  { href: "/bureau", label: "Le bureau" },
  { href: "/adhesion", label: "Adhésion" },
];

// Navigation de l'espace membres et de l'administration, regroupée en menus déroulants pour rester lisible.
// `restreint` : rubrique fermée aux comptes en attente de validation (ils ne peuvent que remplir
// leur fiche et gérer leur compte). Les pages publiques (/promotions, /erasmus) restent ouvertes.
// `admin` : réservé aux administrateurs et au propriétaire (les animateurs ne voient pas le lien).
// `icone` : nom d'un pictogramme, voir src/components/nav-deroulante.tsx.
export type LienMenu = {
  href: string;
  label: string;
  description?: string;
  icone?: string;
  restreint?: boolean;
  admin?: boolean;
};
export type EntreeMenu = LienMenu | { label: string; liens: LienMenu[] };

export const navigationMembres: EntreeMenu[] = [
  { href: "/espace", label: "Accueil", icone: "accueil" },
  {
    label: "Réseau",
    liens: [
      { href: "/espace/annuaire", label: "Annuaire", description: "Retrouver les anciens par domaine, promotion ou formation.", icone: "annuaire", restreint: true },
      { href: "/promotions", label: "Que sont-ils devenus ?", description: "Les parcours des anciens, carte par carte, et les statistiques.", icone: "parcours" },
    ],
  },
  {
    label: "Opportunités",
    liens: [
      { href: "/espace/stages", label: "Archive des stages", description: "Tous les stages des membres, avec leurs fiches détaillées.", icone: "stages", restreint: true },
      { href: "/espace/offres", label: "Offres", description: "Stages et emplois transmis par le réseau.", icone: "offres", restreint: true },
      { href: "/erasmus", label: "Erasmus", description: "Les séjours des anciens à l’étranger, par pays et par université.", icone: "erasmus" },
    ],
  },
  { href: "/espace/evenements", label: "Événements", icone: "evenements", restreint: true },
  {
    label: "Mon profil",
    liens: [
      { href: "/espace/ma-fiche", label: "Ma fiche", description: "Ma fiche dans l’annuaire : parcours, expériences, Erasmus.", icone: "fiche" },
      { href: "/espace/compte", label: "Mon compte", description: "Adresse e-mail, mot de passe et suppression du compte.", icone: "compte" },
    ],
  },
];

// Navigation de l'administration (rôles : src/lib/roles.ts).
export const navigationAdmin: EntreeMenu[] = [
  { href: "/admin", label: "Tableau de bord", icone: "tableau" },
  {
    label: "Membres",
    liens: [
      { href: "/admin/comptes", label: "Comptes", description: "Valider les inscriptions, gérer les rôles.", icone: "comptes" },
      { href: "/admin/invitations", label: "Pré-comptes", description: "Inviter des anciens dont la fiche existe déjà.", icone: "precomptes", admin: true },
      { href: "/admin/personnes", label: "Fiches", description: "Consulter et corriger les fiches des personnes.", icone: "fiche" },
    ],
  },
  {
    label: "Listes",
    liens: [
      { href: "/admin/domaines", label: "Domaines", description: "Domaines professionnels : contrôle, fusion, renommage.", icone: "domaines" },
      { href: "/admin/etablissements", label: "Établissements", description: "Universités, IEP et écoles : contrôle et fusion des doublons.", icone: "etablissements" },
    ],
  },
  { href: "/admin/offres", label: "Offres", icone: "offres" },
  { href: "/admin/evenements", label: "Événements", icone: "evenements" },
  { href: "/admin/actualites", label: "Actualités", icone: "actualites" },
  { href: "/admin/bureau", label: "Bureau", icone: "bureau" },
];
