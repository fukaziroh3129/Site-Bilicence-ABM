// Noms des pays en français à partir de leur code à deux lettres (« AT » → « Autriche »).
// Utilisable côté serveur comme dans le navigateur (fonction intégrée Intl, rien à charger).

const noms = new Intl.DisplayNames(["fr"], { type: "region" });

export function nomPays(code: string) {
  try {
    return noms.of(code) ?? code;
  } catch {
    return code;
  }
}

export const LIBELLES_DUREE_ERASMUS = {
  SEMESTRE: "Un semestre",
  ANNEE: "Une année",
} as const;
