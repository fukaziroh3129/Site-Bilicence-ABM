// Formations complémentaires (table FormationComplementaire) : DU, licence suivie en parallèle,
// certification, MOOC, autre. Libellés, regroupement des titres identiques et détection de celles qui
// ont été saisies comme des masters (table Formation). Sans dépendance serveur : aussi utilisé dans le navigateur.

import { normaliser } from "@/lib/format";

export const TYPES_COMPLEMENTAIRES = ["DU", "LICENCE", "CERTIFICATION", "MOOC", "AUTRE"] as const;
export type TypeComplementaire = (typeof TYPES_COMPLEMENTAIRES)[number];

export const LIBELLES_COMPLEMENTAIRE: Record<TypeComplementaire, { un: string; plusieurs: string; exemples: string }> = {
  DU: { un: "Diplôme universitaire", plusieurs: "Diplômes universitaires", exemples: "DU, DIU, certificat d’université" },
  LICENCE: { un: "Licence en parallèle", plusieurs: "Licences en parallèle", exemples: "Double cursus, autre licence" },
  CERTIFICATION: { un: "Certification", plusieurs: "Certifications", exemples: "TOEIC, TOEFL, Voltaire, PIX…" },
  MOOC: { un: "MOOC", plusieurs: "MOOC", exemples: "FUN MOOC, Coursera, edX…" },
  AUTRE: { un: "Autre", plusieurs: "Autres", exemples: "BAFA, formation courte, école d’été…" },
};

/** Types dont l'établissement vient de la liste commune (universités, écoles) plutôt que d'un organisme libre. */
export const TYPES_AVEC_ETABLISSEMENT: readonly TypeComplementaire[] = ["DU", "LICENCE"];

/**
 * Clé de regroupement : deux titres qui ne diffèrent que par les accents, les majuscules, la ponctuation
 * ou « & » / « et » désignent la même formation (« TOEIC Listening & Reading » = « Toeic listening and reading »).
 */
export function cleFormation(titre: string) {
  return normaliser(titre)
    .replace(/&/g, " et ")
    .replace(/\band\b/g, "et")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Clé utilisable dans une adresse : « toeic-listening-et-reading ». */
export function adresseFormation(titre: string) {
  return cleFormation(titre).replace(/ /g, "-");
}

export type GroupeFormations<T> = { cle: string; titre: string; type: TypeComplementaire; elements: T[] };

/**
 * Regroupe les formations de même titre (cleFormation). Le titre et le type affichés sont les plus
 * fréquents du groupe (à égalité, le premier rencontré).
 */
export function regrouperFormations<T extends { titre: string; type: TypeComplementaire }>(liste: T[]): GroupeFormations<T>[] {
  const groupes = new Map<string, T[]>();
  for (const f of liste) {
    const cle = adresseFormation(f.titre);
    groupes.set(cle, [...(groupes.get(cle) ?? []), f]);
  }
  const plusFrequent = <V,>(valeurs: V[]) => {
    const n = new Map<V, number>();
    for (const v of valeurs) n.set(v, (n.get(v) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1])[0][0];
  };
  return [...groupes].map(([cle, elements]) => ({
    cle,
    titre: plusFrequent(elements.map((e) => e.titre.trim())),
    type: plusFrequent(elements.map((e) => e.type)),
    elements,
  }));
}

/** Années à afficher : une seule pour une certification ou un MOOC (« 2023 »), sinon « 2022–2023 », « depuis 2024 ». */
export function anneesComplementaire(f: { type: TypeComplementaire; anneeDebut: number | null; anneeFin: number | null }) {
  if (f.type === "CERTIFICATION" || f.type === "MOOC") return f.anneeDebut ? String(f.anneeDebut) : null;
  if (f.anneeDebut && f.anneeFin) return f.anneeDebut === f.anneeFin ? String(f.anneeDebut) : `${f.anneeDebut}–${f.anneeFin}`;
  if (f.anneeDebut) return `depuis ${f.anneeDebut}`;
  return f.anneeFin ? String(f.anneeFin) : null;
}

/** Suivie pendant la bi-licence ? (commencée avant la fin de la licence) */
export function pendantBiLicence(f: { anneeDebut: number | null }, promoEntree: number) {
  return f.anneeDebut !== null && f.anneeDebut < promoEntree + 3;
}

// ─── Détection parmi les formations saisies comme des masters ──────────────────

const MASTER = /^(master|masters|m1|m2|msc|mba|ma|magistere|doctorat|these)\b/;
const CERTIFICATION =
  /\b(toeic|toefl|ielts|cambridge|linguaskill|bulats|voltaire|pix|cles|dele|delf|dalf|tcf|tef|goethe|hsk|jlpt|cils|celi|siele)\b/;
const MOOC = /\b(mooc|fun|coursera|edx|openclassrooms|udemy|futurelearn)\b/;
const DU = /^(du|diu|d u)\b|\bdiplome (inter )?universitaire\b|\bcertificat (d )?universit/;
const LICENCE = /^(licence|double licence|l1|l2|l3)\b/;

export type Detection = { type: TypeComplementaire; raison: string };

/**
 * Une formation enregistrée comme « master » ressemble-t-elle à une formation complémentaire ?
 * Renvoie le type proposé et la raison (affichée au bureau), ou null.
 */
export function detecterComplementaire(
  f: { intitule: string; parcours?: string | null; etablissement?: string | null; anneeDebut: number | null; anneeFin: number | null },
  promoEntree: number,
): Detection | null {
  const texte = cleFormation(`${f.intitule} ${f.parcours ?? ""}`);
  const intitule = cleFormation(f.intitule);
  const organisme = cleFormation(f.etablissement ?? "");
  if (MASTER.test(intitule)) return null;

  const certification = texte.match(CERTIFICATION) ?? organisme.match(/\b(ets|british council|cambridge|voltaire|pix)\b/);
  if (certification) return { type: "CERTIFICATION", raison: `Mot-clé « ${certification[1].toUpperCase()} »` };
  const mooc = texte.match(MOOC) ?? organisme.match(MOOC);
  if (mooc) return { type: "MOOC", raison: `Mot-clé « ${mooc[1] === "fun" ? "FUN" : mooc[1].toUpperCase()} »` };
  if (DU.test(intitule)) return { type: "DU", raison: "Intitulé en « DU », « DIU », « diplôme universitaire »…" };
  if (LICENCE.test(intitule)) {
    // Une licence commencée avant la fin de la bi-licence est suivie en parallèle (sans années : probable).
    const finBiLicence = promoEntree + 3;
    if (f.anneeDebut === null || f.anneeDebut < finBiLicence) {
      return { type: "LICENCE", raison: f.anneeDebut === null ? "Licence (sans années)" : "Licence pendant les années de bi-licence" };
    }
  }
  return null;
}

/** Score repris d'un intitulé de certification, ex. « TOEIC 920 » → « 920 », « IELTS 7.5 », « DELF B2 » (pas les années). */
export function resultatDansIntitule(intitule: string) {
  const morceaux = intitule.match(/\b(\d{1,4}(?:[.,]\d)?|[ABC][12])\b/g) ?? [];
  return morceaux.find((m) => !/^(19|20)\d\d$/.test(m)) ?? null;
}
