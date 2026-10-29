// Simulateur de moyenne de l'espace membres : la maquette des notes de la bi-licence et ses calculs.
// Source : modalités de contrôle des connaissances (MCC) 2025-2026 de l'Université de Montpellier, L1, L2 et L3
// « Économie - Science politique » (version non définitive du 9 septembre 2025). À mettre à jour chaque année.
//  - Coefficient d'une UE = ses crédits (ECTS) ; 30 par semestre. Les sous-éléments (CM, TD…) gardent les
//    coefficients du MCC, qui pondèrent la note de l'UE.
//  - Semestres compensables entre eux (« Compensable : Oui ») ; aucune note éliminatoire.
//  - Options facultatives : « jusqu'à 3 points bonus sur les 300 points du semestre » (10 pour l'engagement
//    étudiant), ajoutés au total des points (300 = 10 de moyenne × 30 crédits). L'étudiant saisit ses points.
//  - Composante d'une UE : faculté qui la porte d'après son code (DA… = Droit et Science politique, EAL… =
//    Économie). « Épistémologie des sciences sociales » (DA6EPISO) suit donc la science politique, alors que la
//    plaquette (src/lib/formation.ts) la range en économie. Anglais, informatique, préparation au Grand Oral et
//    projet personnel sont communs (hors des moyennes par composante).
//  - Non simulés : seconde chance, détail des notes de contrôle continu, éléments non évalués (remise à niveau
//    en mathématiques, intelligence artificielle, transition écologique).
// Sans dépendance serveur : utilisé par la page (serveur) et par le simulateur (navigateur).

import type { Discipline } from "@/lib/formation";

export type ElementMcc = { id: string; nom: string; coef: number; modalite: string };

export type UeMcc = {
  /** Code du MCC (sert de clé de saisie quand l'UE n'a pas de sous-éléments). */
  id: string;
  nom: string;
  coef: number;
  discipline: Discipline;
  /** Modalité d'une UE notée d'un seul bloc. */
  modalite?: string;
  elements?: ElementMcc[];
};

export type BonusMcc = { id: string; nom: string; max: number };

export type ChoixMcc = { id: string; libelle: string; options: UeMcc[] };

export type SemestreMcc = { numero: number; ues: UeMcc[]; choix?: ChoixMcc; bonus: BonusMcc[] };

export type CodeAnnee = "L1" | "L2" | "L3";

export type AnneeMcc = { code: CodeAnnee; semestres: [SemestreMcc, SemestreMcc] };

/** Crédits d'un semestre et points à atteindre pour le valider (10 × 30). */
export const CREDITS_SEMESTRE = 30;
export const NOTE_VALIDATION = 10;

// Libellés courts des modalités d'évaluation.
const ECRIT = (duree: string) => `Écrit ${duree}`;
const ORAL = "Écrit ou oral 1 h";
const CC = "Contrôle continu";
const QCM = (duree: string) => `QCM ${duree}`;

const ue = (id: string, nom: string, coef: number, discipline: Discipline, modalite: string): UeMcc => ({ id, nom, coef, discipline, modalite });
const ueDetaillee = (id: string, nom: string, coef: number, discipline: Discipline, elements: [string, string, number, string][]): UeMcc => ({
  id,
  nom,
  coef,
  discipline,
  elements: elements.map(([idElement, nomElement, coefElement, modalite]) => ({ id: idElement, nom: nomElement, coef: coefElement, modalite })),
});
const bonus = (id: string, nom: string, max = 3): BonusMcc => ({ id, nom, max });

// CM noté par un écrit, TD en contrôle continu : le cas le plus courant.
const cmTd = (cm: string, coefCm: number, epreuve: string, td: string, coefTd: number): [string, string, number, string][] => [
  [cm, "CM", coefCm, epreuve],
  [td, "TD", coefTd, CC],
];

export const MCC: AnneeMcc[] = [
  {
    code: "L1",
    semestres: [
      {
        numero: 1,
        ues: [
          ueDetaillee("DA1SSP", "Introduction à la science politique 1", 4, "SCPO", cmTd("DA1SSCCM", 3, ECRIT("3 h"), "DA1SSCTD", 1)),
          ueDetaillee("DA1SVIO", "Vie politique française 1", 4, "SCPO", cmTd("DA1SVICM", 3, ECRIT("3 h"), "DA1SVITD", 1)),
          ue("DA1SHSOC", "Histoire des sciences sociales", 3, "SCPO", ORAL),
          ue("DA1SREI", "Relations internationales", 3, "SCPO", ORAL),
          ue("EAL1SPPE", "Principes d’économie", 4, "ECO", ECRIT("1 h 30")),
          ueDetaillee("EAL1SPHF", "Histoire des faits économiques", 4, "ECO", cmTd("LVW2X1QI", 2, ECRIT("2 h"), "LVW2XGFW", 2)),
          ueDetaillee("EAL1SPMA", "Mathématiques pour économistes 1", 3, "ECO", cmTd("LVW33E3X", 1.5, ECRIT("1 h 30"), "LVW3DU62", 1.5)),
          ueDetaillee("EAL1SPEE", "Économie d’entreprise", 3, "ECO", cmTd("LVWCGJBJ", 2, ECRIT("1 h 30"), "LVWCGXXQ", 1)),
          ue("DA1SANG", "Anglais 1", 2, "COMMUN", CC),
        ],
        bonus: [bonus("EAL1SPSP", "Sport"), bonus("EAL1SPCV", "Certification Voltaire"), bonus("EAL1SPPX", "PIX"), bonus("EAL1SPPJ", "Projet étudiant")],
      },
      {
        numero: 2,
        ues: [
          ueDetaillee("DA2SSP", "Introduction à la science politique 2", 4, "SCPO", cmTd("DA2SSCCM", 3, ECRIT("3 h"), "DA2SSCTD", 1)),
          ue("DA2SVI", "Vie politique française 2 (depuis 1958)", 4, "SCPO", ORAL),
          ue("DA2SCOR", "Droit constitutionnel de la Ve République", 3, "SCPO", ORAL),
          ue("DA2SINA", "Institutions administratives", 3, "SCPO", ORAL),
          ueDetaillee("EAL2SPMI", "Microéconomie 1", 4, "ECO", cmTd("LVWEYIA8", 2, ECRIT("1 h 30"), "LVWEZ1P0", 2)),
          ueDetaillee("EAL2SPMC", "Macroéconomie 1", 4, "ECO", cmTd("LYPU3HEF", 2, ECRIT("1 h 30"), "LYPU3WMN", 2)),
          ueDetaillee("EAL2SPST", "Statistiques 1", 3, "ECO", cmTd("LYPTXW5F", 1.5, ECRIT("2 h"), "LYPTYCJY", 1.5)),
          ueDetaillee("EAL2SPPB", "Problèmes économiques contemporains", 3, "ECO", [
            ["EAL1PECO", "CM", 3, ECRIT("1 h 30")],
            ["EAl1BEMM", "Be my media", 1, "Questionnaire en ligne"],
          ]),
          ue("DA2SANG", "Anglais 2", 2, "COMMUN", CC),
        ],
        bonus: [
          bonus("EAL2ENGA", "Engagement étudiant", 10),
          bonus("EAL2SPCV", "Certification Voltaire"),
          bonus("EAL2SPSV", "Spectacle vivant"),
          bonus("EAL2SPPX", "PIX"),
          bonus("EAL2SPPJ", "Projet étudiant"),
          bonus("EAL2SPSP", "Sport"),
        ],
      },
    ],
  },
  {
    code: "L2",
    semestres: [
      {
        numero: 3,
        ues: [
          ue("DA3SCOM", "Communication politique", 3, "SCPO", ORAL),
          ueDetaillee("DA3SMSO", "Mobilisations et mouvements sociaux", 4, "SCPO", cmTd("DA3SMOCM", 3, ECRIT("3 h"), "DA3SMOTD", 1)),
          ue("DA3SGEN1", "Culture générale 1 : grands problèmes politiques et sociaux", 3, "SCPO", ORAL),
          ue("DA3SSOHI", "Sociologie historique de l’État", 4, "SCPO", ORAL),
          ueDetaillee("EAL3SPMI", "Microéconomie 2", 4, "ECO", cmTd("LYPV3QPZ", 2, ECRIT("1 h 30"), "LYPV47C2", 2)),
          ueDetaillee("EAL3SPMC", "Macroéconomie 2", 3, "ECO", cmTd("LYYEWPZ1", 2, QCM("1 h 30"), "LYYEX3LG", 1)),
          ueDetaillee("EAL3SPST", "Statistiques 2", 3, "ECO", cmTd("LYYF2SCF", 2, ECRIT("2 h"), "LYYF3730", 1)),
          ue("EAL3INDE", "Institutions du développement", 2, "ECO", CC),
          ue("EAL3SPAN", "Anglais", 2, "COMMUN", CC),
          ue("EAL3SPIN", "Informatique", 2, "COMMUN", CC),
        ],
        bonus: [bonus("EAL3SPPX", "PIX"), bonus("EAL3SPCV", "Certification Voltaire"), bonus("EAL3SPPJ", "Projet étudiant"), bonus("EAL3SPSP", "Sport")],
      },
      {
        numero: 4,
        ues: [
          ue("DA4SGEN2", "Culture générale 2 : conférences d’actualité", 3, "SCPO", ORAL),
          ueDetaillee("DA4SSPF", "Systèmes politiques occidentaux 1", 4, "SCPO", cmTd("DA4SSPCM", 3, ECRIT("3 h"), "DA4SSPTD", 1)),
          ue("DA4STHPO", "Théorie politique", 2, "SCPO", ORAL),
          ueDetaillee("DA4GCS1", "Grands classiques de la sociologie 1", 4, "SCPO", cmTd("DA4SGCCM", 3, ECRIT("3 h"), "DA4SGCTD", 1)),
          ueDetaillee("EAL4SPMI", "Microéconomie 3", 4, "ECO", cmTd("LYYHU36M", 2, ECRIT("1 h 30"), "LYYHUDEL", 2)),
          ueDetaillee("EAL4SPMC", "Macroéconomie 3", 4, "ECO", cmTd("LYYH5EW4", 3, ECRIT("1 h 30"), "LYYH5VDE", 1)),
          ueDetaillee("EAL4SPMA", "Mathématiques et statistiques pour économistes 2", 4, "ECO", cmTd("LYYHI0VC", 2, ECRIT("1 h 30"), "LYYHIG4R", 2)),
          ue("EAL4SPDE", "Démographie", 3, "ECO", ECRIT("1 h 30")),
          ue("EAL4SPAN", "Anglais", 2, "COMMUN", CC),
        ],
        bonus: [
          bonus("EAL4ENGA", "Engagement étudiant", 10),
          bonus("EAL4SPPX", "PIX"),
          bonus("EAL4SPCV", "Certification Voltaire"),
          bonus("EAL4SPPJ", "Projet étudiant"),
          bonus("EAL4SPSP", "Sport"),
          bonus("EAL4SPSV", "Spectacle vivant"),
        ],
      },
    ],
  },
  {
    code: "L3",
    semestres: [
      {
        numero: 5,
        ues: [
          ueDetaillee("DA5IPP", "Initiation aux politiques publiques", 4, "SCPO", cmTd("DA5SSICM", 3, ECRIT("3 h"), "DA5SSITD", 1)),
          ue("DA5RGMDI", "Régimes dictatoriaux", 3, "SCPO", ORAL),
          ue("DA5SGR", "Grands enjeux internationaux", 4, "SCPO", ORAL),
          ue("DA5SSPEU", "Science politique de l’Europe", 3, "SCPO", ORAL),
          ueDetaillee("EAL5SPOI", "Organisation industrielle", 4, "ECO", cmTd("LYYIXMUP", 2, ECRIT("2 h"), "LYYIXYM5", 2)),
          ue("EAL5SPHP", "Histoire de la pensée économique", 3, "ECO", ECRIT("2 h")),
          ue("EAL5SPEM", "Économie des médias", 2, "ECO", CC),
          ueDetaillee("EAL5SPAN", "Anglais", 2, "COMMUN", [
            ["LYYJ9T4K", "CM", 1, QCM("1 h")],
            ["LYYJAA1K", "TD", 1, CC],
          ]),
          ue("EAL5SPGO", "Préparation au Grand Oral 1", 2, "COMMUN", CC),
        ],
        choix: {
          id: "EASP3S5C",
          libelle: "Enseignement au choix",
          options: [
            ue("EAL5SPPE", "Problèmes économiques contemporains approfondis", 3, "ECO", "Écrit 1 h 30 et contrôle continu"),
            ue("EAL5SPEC", "Économétrie", 3, "ECO", ECRIT("2 h")),
          ],
        },
        bonus: [
          bonus("EAL5SPPX", "PIX"),
          bonus("EAL5SPCV", "Certification Voltaire"),
          bonus("EAL5SPPJ", "Projet étudiant"),
          bonus("EAL5SPTO", "TOEIC"),
          bonus("EAL5SPSP", "Sport"),
        ],
      },
      {
        numero: 6,
        ues: [
          ue("DA6SGEN3", "Culture générale 3 : enjeux politiques contemporains", 2, "SCPO", ORAL),
          ueDetaillee("DA6SYPOO", "Systèmes politiques occidentaux 2", 4, "SCPO", cmTd("DA6SSYCM", 3, ECRIT("3 h"), "DA6SSYTD", 1)),
          ue("DA6GCS2", "Grands classiques de la sociologie 2", 3, "SCPO", ORAL),
          ue("DA6EPISO", "Épistémologie des sciences sociales", 2, "SCPO", ORAL),
          ueDetaillee("EAL6SPPE", "Politique économique et sociale", 4, "ECO", cmTd("LYZNL6C5", 2, ECRIT("2 h"), "LYZNLIHP", 2)),
          ueDetaillee("EAL6SPAF", "Analyse financière", 2, "ECO", cmTd("LYZN97C7", 1, ECRIT("1 h 30"), "LYZN9KVJ", 1)),
          ueDetaillee("EAL6SPBD", "Base de données", 2, "ECO", cmTd("LYZNEA9X", 1, QCM("30 min"), "LYZNELVG", 1)),
          ue("EAL6SPEI", "Économie internationale", 3, "ECO", ECRIT("2 h")),
          ueDetaillee("EAL6SPAN", "Anglais", 2, "COMMUN", [
            ["LYZNQWHL", "CM", 1, QCM("1 h")],
            ["LYZNR8ZK", "TD", 1, CC],
          ]),
          ue("EAL6SPGO", "Préparation au Grand Oral 2", 4, "COMMUN", CC),
          ue("EAL6SPPP", "Projet personnel de l’étudiant", 2, "COMMUN", CC),
        ],
        bonus: [
          bonus("EAL6ENGA", "Engagement étudiant", 10),
          bonus("EAL6SPPX", "PIX"),
          bonus("EAL6SPCV", "Certification Voltaire"),
          bonus("EAL6SPPJ", "Projet étudiant"),
          bonus("EAL6SPSP", "Sport"),
          bonus("EAL6SPTO", "TOEIC"),
          bonus("EAL6SPSV", "Spectacle vivant"),
        ],
      },
    ],
  },
];

/** Saisies de l'étudiant : texte tapé par clé (code d'élément, d'UE ou d'option facultative). */
export type Saisies = Record<string, string | undefined>;
/** Option retenue pour chaque enseignement au choix (code du choix → code de l'UE). */
export type Choix = Record<string, string | undefined>;

/** Note sur 20 tapée par l'étudiant (« 12,5 » accepté) ; null si vide ou invalide. */
export function lireNote(texte: string | undefined): number | null {
  const propre = (texte ?? "").trim().replace(",", ".");
  if (propre === "" || !/^\d+(\.\d+)?$/.test(propre)) return null;
  const note = Number(propre);
  return note <= 20 ? note : null;
}

/** Vrai quand le champ contient quelque chose qui n'est pas une note de 0 à 20. */
export function noteInvalide(texte: string | undefined): boolean {
  return (texte ?? "").trim() !== "" && lireNote(texte) === null;
}

/** Points bonus d'une option, ramenés entre 0 et son plafond. */
export function lirePoints(texte: string | undefined, max: number): number {
  const points = lireNote(texte);
  return points === null ? 0 : Math.min(points, max);
}

/** UE comptées dans le semestre : les UE fixes et l'option retenue (la première par défaut). */
export function uesDuSemestre(semestre: SemestreMcc, choix: Choix = {}): UeMcc[] {
  if (!semestre.choix) return semestre.ues;
  const { id, options } = semestre.choix;
  return [...semestre.ues, options.find((o) => o.id === choix[id]) ?? options[0]];
}

export type ResultatUe = {
  /** Moyenne des éléments saisis, ou null. */
  note: number | null;
  /** Part du coefficient de l'UE couverte par les notes saisies (= coef quand tout est saisi). */
  coefSaisi: number;
  complete: boolean;
};

/** Note d'une UE : moyenne de ses éléments saisis, pondérée par leurs coefficients. */
export function noteUe(u: UeMcc, saisies: Saisies): ResultatUe {
  const elements = u.elements ?? [{ id: u.id, coef: 1 }];
  const total = elements.reduce((s, e) => s + e.coef, 0);
  let points = 0;
  let coefs = 0;
  for (const e of elements) {
    const note = lireNote(saisies[e.id]);
    if (note === null) continue;
    points += note * e.coef;
    coefs += e.coef;
  }
  return { note: coefs ? points / coefs : null, coefSaisi: (u.coef * coefs) / total, complete: coefs === total };
}

/** Points et coefficients accumulés (pour un semestre, une composante ou une année). */
export type Cumul = { points: number; coefs: number };

export type ResultatSemestre = {
  ues: Record<string, ResultatUe>;
  /** Σ note d'UE × coefficient saisi, sans les bonus. */
  points: number;
  coefs: number;
  bonus: number;
  moyenne: number | null;
  composantes: Record<"ECO" | "SCPO", Cumul>;
};

export function calculerSemestre(semestre: SemestreMcc, saisies: Saisies, choix: Choix = {}): ResultatSemestre {
  const ues: Record<string, ResultatUe> = {};
  const composantes = { ECO: { points: 0, coefs: 0 }, SCPO: { points: 0, coefs: 0 } };
  let points = 0;
  let coefs = 0;
  for (const u of uesDuSemestre(semestre, choix)) {
    const r = noteUe(u, saisies);
    ues[u.id] = r;
    if (r.note === null) continue;
    points += r.note * r.coefSaisi;
    coefs += r.coefSaisi;
    if (u.discipline !== "COMMUN") {
      composantes[u.discipline].points += r.note * r.coefSaisi;
      composantes[u.discipline].coefs += r.coefSaisi;
    }
  }
  const bonus = semestre.bonus.reduce((s, b) => s + lirePoints(saisies[b.id], b.max), 0);
  return { ues, points, coefs, bonus, moyenne: coefs ? (points + bonus) / coefs : null, composantes };
}

export type Bilan = {
  /** Moyenne des notes saisies (bonus compris), ou null. */
  moyenne: number | null;
  /** Coefficients saisis sur le total (30 par semestre). */
  coefs: number;
  total: number;
  /** Moyenne à obtenir sur les coefficients restants pour atteindre 10 ; null quand tout est saisi. */
  necessaire: number | null;
};

/** Bilan d'un ou deux semestres (l'année : compensation entre les deux, 30 crédits chacun). */
export function bilan(resultats: ResultatSemestre[]): Bilan {
  const total = CREDITS_SEMESTRE * resultats.length;
  const points = resultats.reduce((s, r) => s + r.points + r.bonus, 0);
  const coefs = resultats.reduce((s, r) => s + r.coefs, 0);
  const reste = total - coefs;
  return {
    moyenne: coefs ? points / coefs : null,
    coefs,
    total,
    necessaire: reste > 1e-9 ? (NOTE_VALIDATION * total - points) / reste : null,
  };
}

/** Moyenne indicative d'une composante (économie ou science politique), sans UE communes ni bonus. */
export function moyenneComposante(resultats: ResultatSemestre[], discipline: "ECO" | "SCPO"): number | null {
  const points = resultats.reduce((s, r) => s + r.composantes[discipline].points, 0);
  const coefs = resultats.reduce((s, r) => s + r.composantes[discipline].coefs, 0);
  return coefs ? points / coefs : null;
}

/**
 * Année affichée à l'ouverture : celle que l'étudiant suit cette année universitaire (qui commence en
 * septembre), d'après sa promotion d'entrée (2021 = promotion 2021-2024). L1 sans promotion, ou hors de la licence.
 */
export function anneeParDefaut(promoEntree: number | null | undefined, maintenant = new Date()): CodeAnnee {
  if (!promoEntree) return "L1";
  const parties = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "numeric" }).formatToParts(maintenant);
  const annee = Number(parties.find((p) => p.type === "year")?.value);
  const mois = Number(parties.find((p) => p.type === "month")?.value);
  const debutAnneeUniversitaire = mois >= 9 ? annee : annee - 1;
  const niveau = debutAnneeUniversitaire - promoEntree + 1;
  return niveau === 2 ? "L2" : niveau === 3 ? "L3" : "L1";
}
