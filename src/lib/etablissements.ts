// Établissements de poursuite d'études (masters, écoles, IEP) : type, regroupement des variantes
// d'écriture, clés de filtre. Sert aux statistiques « Que deviennent-ils ? » et au filtre du carrousel.
//
// Depuis le patch ADM-03, les formations sont reliées à la liste commune (table Etablissement, gérée
// dans /admin/etablissements) : le type vient alors de la base (`decrireEtablissement`). La
// reconnaissance à partir du nom (`reconnaitreEtablissement`) sert à deviner le type et le nom
// officiel d'un établissement ajouté par un membre, et aux rares formations encore sans lien.
// Fichier sans dépendance serveur (utilisable dans le navigateur) ; outils de base dans
// src/lib/liste-etablissements.ts.

import { normaliser } from "@/lib/format";

export type TypeEtablissement = "IEP" | "UNIVERSITE" | "ECOLE" | "AUTRE";

export const LIBELLES_TYPE_ETABLISSEMENT: Record<TypeEtablissement, string> = {
  IEP: "IEP",
  UNIVERSITE: "Université",
  ECOLE: "École",
  AUTRE: "Autre",
};

/** Clé commune à tous les IEP (barre « IEP » des statistiques, filtre du carrousel). */
export const CLE_IEP = "iep";
export const CLE_SCIENCES_PO_PARIS = "sciences-po-paris";

/** Variantes d'écriture fréquentes ramenées à un seul établissement. */
const ALIAS: { motif: RegExp; nom: string; type: TypeEtablissement }[] = [
  { motif: /pantheon.?sorbonne|paris 1\b|paris i\b/, nom: "Université Paris 1 Panthéon-Sorbonne", type: "UNIVERSITE" },
  { motif: /assas/, nom: "Université Paris-Panthéon-Assas", type: "UNIVERSITE" },
  { motif: /dauphine/, nom: "Université Paris Dauphine-PSL", type: "UNIVERSITE" },
  { motif: /sorbonne nouvelle|paris 3\b/, nom: "Université Sorbonne Nouvelle", type: "UNIVERSITE" },
  { motif: /sorbonne (paris )?nord/, nom: "Université Sorbonne Paris Nord", type: "UNIVERSITE" },
  { motif: /london school of economics|\blse\b/, nom: "London School of Economics", type: "UNIVERSITE" },
  { motif: /lyon (lumiere )?2|lumiere lyon 2/, nom: "Université Lumière Lyon 2", type: "UNIVERSITE" },
  { motif: /ehesp|hautes etudes en sante publique/, nom: "École des hautes études en santé publique", type: "ECOLE" },
];

export type Etablissement = {
  /** Clé de regroupement (deux écritures du même établissement ont la même clé). */
  cle: string;
  nom: string;
  type: TypeEtablissement;
  /** Pour les IEP : Sciences Po Paris ou un autre IEP. */
  sciencesPoParis?: boolean;
};

/** Reconnaît un établissement à partir du nom saisi. */
export function reconnaitreEtablissement(saisie: string): Etablissement {
  const n = normaliser(saisie).replace(/[’'`-]/g, " ").replace(/\s+/g, " ");

  // IEP : « Sciences Po » seul désigne Sciences Po Paris ; « Sciences Po Lyon », « IEP de Lyon »… les autres.
  const iep = /sciences ?po\b|\biep\b|institut d ?etudes politiques/.test(n);
  if (iep) {
    const paris = /paris/.test(n) || /^sciences ?po( \(.*\))?$/.test(n);
    return paris
      ? { cle: CLE_SCIENCES_PO_PARIS, nom: "Sciences Po Paris", type: "IEP", sciencesPoParis: true }
      : { cle: `iep-${n.replace(/[^a-z0-9]+/g, "-")}`, nom: saisie.trim(), type: "IEP", sciencesPoParis: false };
  }

  const alias = ALIAS.find((a) => a.motif.test(n));
  if (alias) return { cle: cleDe(alias.nom), nom: alias.nom, type: alias.type };

  // Sans alias : on retire les précisions entre parenthèses (« Université de Montpellier (Erasmus…) »).
  const nom = saisie.replace(/\s*\(.*?\)\s*/g, " ").trim() || saisie.trim();
  const cle = cleDe(nom);
  const type: TypeEtablissement = /^(ecole|ecole |institut|iae|ipag|amse)|\bschool\b|\becole\b|\bhec\b|\bessec\b|\bens\b/.test(normaliser(nom))
    ? "ECOLE"
    : /universit|faculte|\bcollege\b/.test(normaliser(nom))
      ? "UNIVERSITE"
      : "AUTRE";
  return { cle, nom, type };
}

/** Clé de regroupement tirée d'un nom (« Université de Vienne » → « universite-de-vienne »). */
function cleDe(nom: string) {
  return normaliser(nom).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Une formation telle que lue en base : le nom saisi, et l'établissement de la liste commune s'il est relié. */
export type FormationEtablissement = {
  etablissement: string;
  etablissementRef?: { nom: string; type: TypeEtablissement } | null;
};

/** Décrit l'établissement d'une formation : d'après la liste commune si elle y est reliée, sinon d'après le nom. */
export function decrireEtablissement(f: FormationEtablissement): Etablissement {
  if (!f.etablissementRef) return reconnaitreEtablissement(f.etablissement);
  const { nom, type } = f.etablissementRef;
  if (type === "IEP") {
    const devine = reconnaitreEtablissement(nom);
    if (devine.type === "IEP" && devine.sciencesPoParis) return devine;
    return { cle: devine.type === "IEP" ? devine.cle : `iep-${cleDe(nom)}`, nom, type, sciencesPoParis: false };
  }
  return { cle: cleDe(nom), nom, type };
}

/** Clés de filtre d'une personne : chaque établissement, plus « iep » si elle est passée par un IEP. */
export function clesEtablissements(formations: FormationEtablissement[]) {
  const cles = new Set<string>();
  for (const f of formations) {
    const r = decrireEtablissement(f);
    cles.add(r.cle);
    if (r.type === "IEP") cles.add(CLE_IEP);
  }
  return [...cles];
}
