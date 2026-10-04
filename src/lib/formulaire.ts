// Outils de validation des formulaires, côté serveur (avec la bibliothèque zod).
import { z } from "zod";

/** Ce que renvoie une action de formulaire : erreurs à afficher, message de succès… */
export type EtatFormulaire = {
  erreur?: string;
  erreurs?: Record<string, string>;
  succes?: string;
  /** Valeurs saisies, pour ne pas les perdre quand le formulaire contient une erreur. */
  valeurs?: Record<string, string | string[]>;
} | null;

/** Lit toutes les valeurs d'un formulaire ; un champ présent plusieurs fois devient une liste. */
export function valeursDe(formData: FormData) {
  const valeurs: Record<string, string | string[]> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (cle.startsWith("$ACTION") || typeof valeur !== "string") continue;
    const existante = valeurs[cle];
    if (existante === undefined) valeurs[cle] = valeur;
    else valeurs[cle] = Array.isArray(existante) ? [...existante, valeur] : [existante, valeur];
  }
  return valeurs;
}

/**
 * Valide un formulaire avec un schéma zod. Renvoie soit les données propres,
 * soit un état d'erreur prêt à être renvoyé par l'action.
 */
export function valider<T extends z.ZodType>(schema: T, formData: FormData) {
  const valeurs = valeursDe(formData);
  const resultat = schema.safeParse(valeurs);
  if (resultat.success) return { ok: true as const, donnees: resultat.data as z.output<T> };

  const erreurs: Record<string, string> = {};
  for (const probleme of resultat.error.issues) {
    const champ = String(probleme.path[0] ?? "");
    erreurs[champ] ??= probleme.message;
  }
  return {
    ok: false as const,
    etat: { erreur: "Certains champs sont à corriger.", erreurs, valeurs } satisfies EtatFormulaire,
  };
}

// ─── Types de champs réutilisables ─────────────────────────────────────────────

export const champ = {
  texte: (max = 200) =>
    z.string({ error: "Champ obligatoire." }).trim().min(1, "Champ obligatoire.").max(max, `${max} caractères maximum.`),

  texteFacultatif: (max = 200) =>
    z
      .string()
      .trim()
      .max(max, `${max} caractères maximum.`)
      .optional()
      .transform((v) => (v ? v : null)),

  email: () => z.string({ error: "Champ obligatoire." }).trim().toLowerCase().email("Adresse e-mail invalide."),

  emailFacultatif: () =>
    z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .refine((v) => !v || z.email().safeParse(v).success, "Adresse e-mail invalide.")
      .transform((v) => (v ? v : null)),

  lienFacultatif: () =>
    z
      .string()
      .trim()
      .max(500)
      .optional()
      .refine((v) => !v || /^https?:\/\/\S+$/.test(v), "L’adresse doit commencer par https://")
      .transform((v) => (v ? v : null)),

  entier: (min: number, max: number) =>
    z
      .string({ error: "Champ obligatoire." })
      .trim()
      .regex(/^\d+$/, "Nombre attendu.")
      .transform(Number)
      .refine((n) => n >= min && n <= max, `Valeur entre ${min} et ${max} attendue.`),

  entierFacultatif: (min: number, max: number) =>
    z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), `Valeur entre ${min} et ${max} attendue.`)
      .transform((v) => (v ? Number(v) : null)),

  /** Case à cocher : cochée = true. */
  case: () => z.string().optional().transform((v) => v === "on"),

  /** Plusieurs cases cochées portant le même nom → liste de valeurs autorisées. */
  liste: (autorisees: readonly string[]) =>
    z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]))
      .refine((l) => l.every((x) => autorisees.includes(x)), "Valeur non autorisée."),

  /** Champ <input type="month"> (« 2025-06 ») → date du 1er du mois. */
  moisFacultatif: () =>
    z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}$/.test(v), "Mois invalide.")
      .transform((v) => (v ? new Date(`${v}-01T12:00:00Z`) : null)),

  /** Champ <input type="date"> → date à midi (heure de Paris), ou null. */
  dateFacultative: () =>
    z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Date invalide.")
      .transform((v) => (v ? dateDeParis(`${v}T12:00`) : null)),

  /** Champ <input type="datetime-local"> (heure de Paris) → date. */
  dateHeure: () =>
    z
      .string({ error: "Champ obligatoire." })
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date et heure attendues.")
      .transform((v) => dateDeParis(v)),

  dateHeureFacultative: () =>
    z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Date et heure invalides.")
      .transform((v) => (v ? dateDeParis(v) : null)),

  /** Valeur choisie dans une liste fermée (menu déroulant). */
  choix: <const T extends readonly [string, ...string[]]>(valeurs: T) =>
    z.enum(valeurs, { error: "Choix obligatoire." }),

  choixFacultatif: <const T extends readonly [string, ...string[]]>(valeurs: T) =>
    z
      .union([z.enum(valeurs), z.literal("")])
      .optional()
      .transform((v) => (v ? v : null)),
};

// ─── Dates en heure de Paris ───────────────────────────────────────────────────
// Les champs date/heure du navigateur n'ont pas de fuseau horaire : on les interprète
// en heure de Paris, quel que soit le fuseau du serveur.

function decalageParis(date: Date) {
  const morceaux = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const v = (t: string) => Number(morceaux.find((m) => m.type === t)?.value);
  const commeUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  return commeUtc - Math.floor(date.getTime() / 60000) * 60000;
}

/** « 2026-12-12T18:30 » (heure de Paris) → Date. */
export function dateDeParis(valeur: string) {
  const [jour, horaire] = valeur.split("T");
  const [a, m, j] = jour.split("-").map(Number);
  const [h, min] = horaire.split(":").map(Number);
  const approx = new Date(Date.UTC(a, m - 1, j, h, min));
  return new Date(approx.getTime() - decalageParis(approx));
}

/** Date → « 2026-12-12T18:30 » en heure de Paris (pour pré-remplir un champ). */
export function versChampDateHeure(date: Date | null | undefined) {
  if (!date) return "";
  const locale = new Date(date.getTime() + decalageParis(date));
  return locale.toISOString().slice(0, 16);
}

/** Date → « 2026-12-12 » en heure de Paris. */
export function versChampDate(date: Date | null | undefined) {
  return versChampDateHeure(date).slice(0, 10);
}

/** Date → « 2025-06 ». */
export function versChampMois(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 7) : "";
}
