// Petites fonctions d'affichage partagées : promotions, dates, recherche sans accents, libellés.

/** Première promotion de la bi-licence (promotion 2021-2024). */
export const PREMIERE_PROMO = 2021;
/** Durée de la licence, en années. */
const DUREE_LICENCE = 3;

/** « 2021-2024 » pour une entrée en 2021. */
export function libellePromo(promoEntree: number) {
  return `${promoEntree}-${promoEntree + DUREE_LICENCE}`;
}

/** Années d'entrée possibles, de la plus récente à la plus ancienne. */
export function listePromos() {
  const derniere = new Date().getFullYear();
  const promos: number[] = [];
  for (let annee = derniere; annee >= PREMIERE_PROMO; annee--) promos.push(annee);
  return promos;
}

/** Vrai si la promotion est encore en cours de licence. */
export function promoEnCours(promoEntree: number) {
  const maintenant = new Date();
  // La licence se termine en été de l'année de sortie.
  const fin = new Date(promoEntree + DUREE_LICENCE, 7, 1);
  return maintenant < fin;
}

const fuseau = "Europe/Paris";

/** « 12 déc. 2026 » */
export function dateCourte(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: fuseau }).format(date);
}

/** « samedi 12 décembre 2026 » */
export function dateLongue(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: fuseau }).format(date);
}

/** « 17h20 » */
export function heure(date: Date) {
  const morceaux = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: fuseau }).formatToParts(date);
  const h = morceaux.find((m) => m.type === "hour")?.value ?? "";
  const min = morceaux.find((m) => m.type === "minute")?.value ?? "";
  return `${h}h${min}`;
}

/** « aujourd’hui », « hier », « il y a 3 jours », puis la date courte au-delà d'un mois. */
export function ilYa(date: Date, maintenant = new Date()) {
  const jour = (d: Date) => new Intl.DateTimeFormat("fr-CA", { timeZone: fuseau }).format(d); // AAAA-MM-JJ
  const ecart = Math.round((Date.parse(jour(maintenant)) - Date.parse(jour(date))) / 86_400_000);
  if (ecart <= 0) return "aujourd’hui";
  if (ecart === 1) return "hier";
  if (ecart < 31) return `il y a ${ecart} jours`;
  return `le ${dateCourte(date)}`;
}

/** « juin 2025 » */
export function moisAnnee(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: fuseau }).format(date);
}

/** Période d'un stage ou d'un emploi : « juin 2025 — août 2025 ». */
export function periode(debut: Date | null, fin: Date | null) {
  if (debut && fin) return `${moisAnnee(debut)} — ${moisAnnee(fin)}`;
  if (debut) return `depuis ${moisAnnee(debut)}`;
  if (fin) return `jusqu’en ${moisAnnee(fin)}`;
  return null;
}

/** Texte en minuscules sans accents, pour une recherche tolérante (« Économie » = « economie »). */
export function normaliser(texte: string) {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Recherche « ouverte » : chaque mot de la requête doit apparaître quelque part dans les champs.
 * Ainsi « mairie paris » trouve « Mairie du 11e arrondissement de Paris ».
 */
export function correspond(requete: string, champs: (string | null | undefined)[]) {
  const mots = normaliser(requete).split(/\s+/).filter((m) => m.length > 1 && !MOTS_VIDES.has(m));
  if (mots.length === 0) return true;
  const texte = normaliser(champs.filter(Boolean).join(" "));
  return mots.every((mot) => texte.includes(mot));
}

const MOTS_VIDES = new Set(["de", "du", "des", "la", "le", "les", "en", "et", "au", "aux", "un", "une", "a"]);

/** Transforme un titre en adresse lisible : « Portrait d’Élise » → « portrait-d-elise ». */
export function slugifier(texte: string) {
  return normaliser(texte)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const LIBELLES_TYPE_EXPERIENCE = {
  STAGE: "Stage",
  ALTERNANCE: "Alternance",
  EMPLOI: "Emploi",
  ASSOCIATIF: "Associatif",
  VOLONTARIAT: "Volontariat",
  AUTRE: "Autre",
} as const;

/** Étiquette affichée en haut de la carte publique. */
export const LIBELLES_STATUT_ACTUEL = {
  EN_LICENCE: "En licence",
  EN_MASTER: "En master",
  EN_DOCTORAT: "En doctorat",
  EN_ALTERNANCE: "En alternance",
  EN_POSTE: "En poste",
  CESURE: "Année de césure",
  EN_RECHERCHE: "En recherche d’emploi",
} as const;

/** Une formation est « en cours » si elle n'est pas terminée (la fin d'une année d'études : juillet). */
export function formationEnCours(f: { anneeDebut: number | null; anneeFin: number | null }) {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  if (f.anneeFin === null) return f.anneeDebut !== null && f.anneeDebut <= annee;
  return f.anneeFin > annee || (f.anneeFin === annee && maintenant.getMonth() < 7);
}

/** Années d'une formation : « 2024–2026 », « depuis 2025 », « 2025 ». */
export function anneesFormation(f: { anneeDebut: number | null; anneeFin: number | null }) {
  if (f.anneeDebut && f.anneeFin) return f.anneeDebut === f.anneeFin ? String(f.anneeDebut) : `${f.anneeDebut}–${f.anneeFin}`;
  if (f.anneeDebut) return `depuis ${f.anneeDebut}`;
  if (f.anneeFin) return String(f.anneeFin);
  return null;
}

export const LIBELLES_NIVEAU = {
  LICENCE: "Licence",
  MASTER: "Master",
} as const;

export const LIBELLES_TYPE_OFFRE = {
  STAGE: "Stage",
  ALTERNANCE: "Alternance",
  EMPLOI: "Emploi",
} as const;

export const LIBELLES_CATEGORIE_ARTICLE = {
  PORTRAIT_ANCIEN: "Portrait d’ancien",
  PORTRAIT_ETUDIANT: "Portrait d’étudiant",
  VIE_LICENCE: "Vie de la licence",
  ASSOCIATION: "Vie de l’association",
} as const;
