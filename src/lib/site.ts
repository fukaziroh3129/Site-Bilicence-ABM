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
    // Page HelloAsso de l'association (bouton « Toutes les boutiques sur HelloAsso » de la page Boutique).
    // L'adhésion, gratuite, ne passe pas par HelloAsso : c'est la création de compte sur /adhesion.
    helloAsso: "https://www.helloasso.com/associations/alumni-bilicence-montpellier-abm" as string | null,
    // Boutique de l'année intégrée dans la page Boutique. À CHANGER à chaque nouvelle boutique (une par année
    // universitaire) : dans HelloAsso, ouvrir la boutique → « Diffuser » → « Intégrer à mon site », et recopier
    // l'adresse (src) des deux widgets proposés, « widget » (boutique complète) et « widget-vignette » (aperçu).
    // null = pas de boutique en cours : la page affiche seulement le lien vers HelloAsso.
    boutique: {
      widget: "https://www.helloasso.com/associations/alumni-bilicence-montpellier-abm/boutiques/vente-de-goodies-bi-licence-2026-2027/widget",
      vignette: "https://www.helloasso.com/associations/alumni-bilicence-montpellier-abm/boutiques/vente-de-goodies-bi-licence-2026-2027/widget-vignette",
    } as { widget: string; vignette: string | null } | null,
    // Réseaux sociaux de l'association (accueil, pied de page, contact). Adresses sans paramètres de suivi.
    instagram: "https://www.instagram.com/alumni.bilicence" as string | null,
    linkedin: "https://fr.linkedin.com/company/bi-licence" as string | null,
    // Le Drive des cours n'est PAS ici (ce fichier est public) : variable d'environnement LIEN_DRIVE,
    // ajoutée au menu des seuls membres validés par src/app/espace/layout.tsx.
  },

  // Les fonctions du bureau et les pôles ne sont plus ici : le bureau les crée dans Administration → Bureau
  // (onglet « Fonctions et pôles », table Fonction).

  // Mandat du bureau affiché sur la page Bureau (ex. "2026-2027"), ou null.
  mandat: "2026-2027" as string | null,

  // Identité juridique (mentions légales, politique de confidentialité).
  // Laisser à null ce qui n'est pas encore connu : le site affiche alors « à compléter ».
  association: {
    forme: "Association loi 1901",
    siege: "Faculté d’Économie, Espace Richter, avenue Raymond Dugrand, CS 79606, 34960 Montpellier cedex 2" as string | null, // adresse du siège social (statuts)
    rna: "W343032338" as string | null, // numéro RNA (W…), sur le récépissé de déclaration en préfecture
    email: "secretaria@bilicence.fr" as string | null, // adresse de contact, aussi utilisée pour les demandes RGPD
    directeurPublication: "Guillaume Dedieu, président de l’association",
  },

  // Prestataires techniques (sous-traitants au sens du RGPD).
  hebergeur: {
    nom: "Hostinger International Ltd",
    adresse: "61 Lordou Vironos Street, 6023 Larnaca, Chypre",
    site: "https://www.hostinger.fr",
    // Pays du centre de données du VPS (visible dans le panneau Hostinger), ex. "France".
    localisationServeur: "France" as string | null,
  },
  emailing: {
    nom: "Brevo (Sendinblue SAS)",
    adresse: "106 boulevard Haussmann, 75008 Paris, France",
    site: "https://www.brevo.com",
  },
};

// Navigation de la partie publique.
// `court` : libellé affiché dans l'en-tête sur les écrans moyens (1 024 à 1 279 px), où la place manque.
export const navigation: { href: string; label: string; court?: string }[] = [
  { href: "/la-formation", label: "La formation", court: "Formation" },
  { href: "/actualites", label: "Actualités" },
  { href: "/promotions", label: "Les promotions", court: "Promotions" },
  { href: "/bureau", label: "Le bureau", court: "Bureau" },
  { href: "/boutique", label: "Boutique" },
  { href: "/adhesion", label: "Adhésion" },
];

// Dans l'en-tête, l'adhésion passe par le bouton « Espace membres / Adhérer » (src/components/bouton-membres.tsx).
export const navigationEntete = navigation.filter((item) => item.href !== "/adhesion");

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
  /** Lien vers un autre site : s'ouvre dans un nouvel onglet. */
  externe?: boolean;
};
export type EntreeMenu = LienMenu | { label: string; liens: LienMenu[] };

export const navigationMembres: EntreeMenu[] = [
  { href: "/espace", label: "Accueil", icone: "accueil" },
  {
    label: "Réseau",
    liens: [
      { href: "/espace/annuaire", label: "Annuaire", description: "Retrouver les anciens par domaine, promotion ou formation.", icone: "annuaire", restreint: true },
      { href: "/promotions", label: "Que sont-ils devenus ?", description: "Les parcours des anciens, carte par carte, et les statistiques.", icone: "parcours" },
      { href: "/espace/statistiques", label: "Statistiques", description: "Où mène la bi-licence : établissements, mentions, domaines.", icone: "statistiques", restreint: true },
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
      { href: "/admin/mentions", label: "Mentions", description: "Mentions de master et grands domaines d’études : classement, fusion.", icone: "mentions" },
    ],
  },
  { href: "/admin/offres", label: "Offres", icone: "offres" },
  { href: "/admin/actualites", label: "Publications", icone: "actualites" },
  { href: "/admin/reseaux", label: "Réseaux", icone: "reseaux" },
  { href: "/admin/bureau", label: "Bureau", icone: "bureau" },
];
