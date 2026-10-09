// Mentions de master : reconnaissance de la mention à partir de l'intitulé saisi par un membre
// (« M2 RI », « Master relations internationnales »… → « Relations internationales »), et repérage
// de la bi-licence saisie par erreur comme formation.
//
// Fichier sans dépendance serveur : utilisé par les actions, les scripts (import, détection en lot)
// et le formulaire de formation dans le navigateur (mention proposée pendant la saisie).
// Outils qui lisent la base : src/lib/liste-mentions.ts.
//
// Méthode, dans l'ordre :
//  1. nettoyage : accents, majuscules, ponctuation, mots de diplôme (« Master », « M2 », « mention »…) ;
//  2. correspondance exacte avec le nom d'une mention ou l'une de ses variantes ;
//  3. correspondance par mots : l'expression d'une mention (ou variante) figure telle quelle dans
//     l'intitulé, sinon tous ses mots y figurent ; la plus précise (le plus de mots) l'emporte ;
//  4. correspondance approchée, mot à mot, pour les fautes de frappe (« internationnales ») ;
//  5. les mêmes étapes sur le parcours si l'intitulé seul ne donne rien ;
//  6. sinon : pas de mention, la formation apparaît dans « À classer » (/admin/mentions).

import { normaliser } from "@/lib/format";

/** Mots sans valeur pour reconnaître une mention (diplôme, articles, mots de liaison). */
const MOTS_IGNORES = new Set([
  "master", "masters", "m1", "m2", "msc", "ma", "mention", "parcours", "diplome", "grade", "specialite", "option",
  "de", "du", "des", "la", "le", "les", "en", "et", "d", "l", "a", "au", "aux", "un", "une",
  "in", "of", "the", "for", "and",
]);

/** Mots significatifs d'un texte, sans accents ni ponctuation (les précisions entre parenthèses sont retirées). */
export function motsSignificatifs(texte: string) {
  return normaliser(texte)
    .replace(/\(.*?\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((m) => m && !MOTS_IGNORES.has(m));
}

/** Clé de comparaison d'un nom (« Économie appliquée » → « economie appliquee »). */
export const cleTexte = (texte: string) => motsSignificatifs(texte).join(" ");

/** La bi-licence elle-même (déjà affichée automatiquement sur chaque fiche, à ne pas saisir comme formation). */
export function estBiLicence(intitule: string, etablissement?: string | null) {
  const t = normaliser(intitule);
  if (/\bbi ?-?licence\b|\bbilicence\b|\bdouble licence\b/.test(t)) return true;
  // « Licence Économie – Science politique (Montpellier) »
  const licenceEcoPo = /\blicence\b/.test(t) && /\beco/.test(t) && /\b(science|sc)s? ?po/.test(t);
  return licenceEcoPo && (!etablissement || /montpellier/.test(normaliser(etablissement)));
}

/** Ce qu'il faut savoir d'une mention pour la reconnaître. */
export type MentionDetectable = { id: string; libelle: string; variantes: string[] };

export type MethodeDetection = "exacte" | "mots" | "approchee";
export type ResultatDetection = { mentionId: string; methode: MethodeDetection } | null;

/** Ressemblance entre deux mots (coefficient de Dice sur les groupes de trois lettres), de 0 à 1. */
function ressemblance(a: string, b: string) {
  if (a === b) return 1;
  const trigrammes = (m: string) => {
    const s = ` ${m} `;
    const r: string[] = [];
    for (let i = 0; i < s.length - 2; i++) r.push(s.slice(i, i + 3));
    return r;
  };
  const ta = trigrammes(a);
  const tb = trigrammes(b);
  const restants = new Map<string, number>();
  for (const t of ta) restants.set(t, (restants.get(t) ?? 0) + 1);
  let communs = 0;
  for (const t of tb) {
    const n = restants.get(t);
    if (n) {
      communs++;
      restants.set(t, n - 1);
    }
  }
  return (2 * communs) / (ta.length + tb.length);
}

const SEUIL_RESSEMBLANCE = 0.7;

type Candidat = { mentionId: string; mots: string[]; cle: string };

function candidatsDe(mentions: MentionDetectable[]): Candidat[] {
  return mentions
    .flatMap((m) => [m.libelle, ...m.variantes].map((e) => ({ mentionId: m.id, mots: motsSignificatifs(e) })))
    .filter((c) => c.mots.length > 0)
    .map((c) => ({ ...c, cle: c.mots.join(" ") }));
}

function reconnaitre(texte: string, candidats: Candidat[]): ResultatDetection {
  const mots = motsSignificatifs(texte);
  if (mots.length === 0) return null;
  const cle = mots.join(" ");
  const plusPrecis = (a: Candidat, b: Candidat) => b.mots.length - a.mots.length;

  const exacte = candidats.find((c) => c.cle === cle);
  if (exacte) return { mentionId: exacte.mentionId, methode: "exacte" };

  // D'abord une expression entière (« public policy » d'un seul tenant), puis des mots épars.
  const expression = candidats.filter((c) => ` ${cle} `.includes(` ${c.cle} `)).sort(plusPrecis)[0];
  if (expression) return { mentionId: expression.mentionId, methode: "mots" };
  const parMots = candidats.filter((c) => c.mots.every((m) => mots.includes(m))).sort(plusPrecis)[0];
  if (parMots) return { mentionId: parMots.mentionId, methode: "mots" };

  // Mots très courts (« ri », « ess ») : seulement en correspondance exacte, sinon trop de faux positifs.
  const approchee = candidats
    .filter((c) => c.mots.every((m) => m.length > 3 && mots.some((x) => ressemblance(m, x) >= SEUIL_RESSEMBLANCE)))
    .sort(plusPrecis)[0];
  if (approchee) return { mentionId: approchee.mentionId, methode: "approchee" };
  return null;
}

/**
 * Mention reconnue pour une formation, ou null. L'intitulé est essayé d'abord (sans ce qui suit un
 * tiret, souvent le parcours : « Master RI – Sécurité »), puis l'intitulé entier, puis le parcours.
 */
export function detecterMention(intitule: string, parcours: string | null | undefined, mentions: MentionDetectable[]): ResultatDetection {
  if (estBiLicence(intitule)) return null;
  const candidats = candidatsDe(mentions);
  const [principal] = intitule.split(/\s[–—-]\s/);
  return (
    reconnaitre(principal, candidats) ??
    (principal !== intitule ? reconnaitre(intitule, candidats) : null) ??
    (parcours ? reconnaitre(parcours, candidats) : null)
  );
}

export const LIBELLES_METHODE: Record<MethodeDetection, string> = {
  exacte: "Exacte",
  mots: "Par mots-clés",
  approchee: "Approchée (faute de frappe)",
};

/**
 * Couleurs des grands domaines d'études dans les graphiques : uniquement la gamme bordeaux de la
 * charte, du plus foncé au plus clair, dans l'ordre des grands domaines. L'identité passe aussi par
 * les libellés (jamais par la couleur seule).
 */
const TONS_FAMILLES = [
  { fond: "#5C1A1E", texte: "#FFFFFF" },
  { fond: "#74282C", texte: "#FFFFFF" },
  { fond: "#8E3A3E", texte: "#FFFFFF" },
  { fond: "#B85C5F", texte: "#FFFFFF" },
  { fond: "#D08D8F", texte: "#2B0D0F" },
  { fond: "#E6BDBE", texte: "#2B0D0F" },
  { fond: "#F2D9D9", texte: "#2B0D0F" },
  { fond: "#431316", texte: "#FFFFFF" },
  { fond: "#EDE3D3", texte: "#2B0D0F" },
];

export function couleurFamille(rang: number) {
  return TONS_FAMILLES[Math.min(Math.max(rang, 0), TONS_FAMILLES.length - 1)];
}
