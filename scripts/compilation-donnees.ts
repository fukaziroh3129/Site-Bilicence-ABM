// Compilation des trois fichiers de Guillaume (annuaire privé, poursuites d'études, destinations
// Erasmus) en une liste de personnes uniques. Aucune écriture en base : utilisé par
// `import-donnees-reelles.ts`. Les fichiers contiennent des données personnelles : ils restent hors
// du dépôt, et rien de ce qu'ils contiennent ne doit être copié dans le code.

import ExcelJS from "exceljs";
import { lirePoursuite, type Ligne } from "./lecture-poursuite";

export type SejourErasmus = { lieu: string; pays: string; semestre: number | null; promoEntree: number | null };

export type PersonneCompilee = {
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  promoEntree: number;
  /** Vrai si ni la poursuite ni Erasmus ne donnent la promotion : elle est alors estimée (voir `estimerPromo`). */
  promoEstimee: boolean;
  /** « (césure) » écrit dans le nom du fichier de poursuite */
  cesure: boolean;
  ville: string | null;
  situation: string | null;
  formation: Ligne["formation"];
  sejours: SejourErasmus[];
  sources: ("annuaire" | "poursuite" | "erasmus")[];
  anneeNaissance: number | null;
  /** Date d'entrée dans l'association (annuaire), AAAA-MM */
  entreeAssociation: string | null;
  aVerifier: string[];
};

export const sansAccent = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const jetons = (t: string) => sansAccent(t).split(/[\s\-'’.]+/).filter(Boolean).sort();
export const chiffres = (t: string | null) => {
  const d = (t ?? "").replace(/\D/g, "");
  if (d.length < 9) return null;
  if (d.startsWith("0033") && d.length === 13) return "0" + d.slice(4);
  if (d.startsWith("33") && d.length === 11) return "0" + d.slice(2);
  return d;
};
export const formaterTelephone = (t: string | null) => {
  const d = chiffres(t);
  return d && /^0\d{9}$/.test(d) ? d.replace(/(\d{2})(?=\d)/g, "$1 ") : (t ?? "").trim() || null;
};
const joli = (t: string) => t.replace(/\s+/g, " ").trim();

/** « Albane (césure) Chuecos-Font » → nom propre + indicateur de césure (les parenthèses du fichier sont des notes). */
function nettoyerNom(t: string) {
  const note = t.match(/\(([^)]*)\)/)?.[1] ?? "";
  return { texte: joli(t.replace(/\([^)]*\)/g, " ")), cesure: /c[ée]sure/i.test(note) };
}

const ANNEE_COURANTE = new Date().getFullYear();
const PREMIERE_PROMO = 2021;

/**
 * Promotion d'une personne que ni la poursuite ni Erasmus ne mentionnent (annuaire seul).
 * Estimation : les adhérents entrés à la rentrée 2024 (nés en 2006 ou après) sont de la promotion 2024,
 * ceux entrés à la rentrée 2025 ou après de la promotion 2025 ; sinon année de naissance + 18 ans.
 * Vérifiée sur les personnes dont la promotion est connue : juste dans environ 8 cas sur 10, d'où le
 * signalement « promotion estimée » dans le rapport.
 */
export function estimerPromo(anneeNaissance: number | null, entree: string | null) {
  const naissance = anneeNaissance && anneeNaissance >= 1995 && anneeNaissance <= 2010 ? anneeNaissance : null;
  let promo: number;
  if (entree && entree >= "2025-09" && (!naissance || naissance >= 2006)) promo = 2025;
  else if (entree && entree >= "2024-09" && entree <= "2024-10" && (!naissance || naissance >= 2006)) promo = 2024;
  else if (naissance) promo = naissance + 18;
  else promo = Number(entree?.slice(0, 4)) || ANNEE_COURANTE;
  return Math.min(Math.max(promo, PREMIERE_PROMO), ANNEE_COURANTE);
}

function texteCellule(c: ExcelJS.Cell) {
  const v = c.value;
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && "richText" in v) return v.richText.map((r) => r.text).join("").replace(/\s+/g, " ").trim();
  if (typeof v === "object" && "text" in v) return String(v.text).replace(/\s+/g, " ").trim();
  if (typeof v === "object" && "result" in v) return String(v.result ?? "").replace(/\s+/g, " ").trim();
  return String(v).replace(/\s+/g, " ").trim();
}

type LigneAnnuaire = { prenom: string; nom: string; email: string | null; telephone: string | null; anneeNaissance: number | null; entree: string | null };

async function lireAnnuaire(chemin: string): Promise<LigneAnnuaire[]> {
  const classeur = new ExcelJS.Workbook();
  await classeur.xlsx.readFile(chemin);
  const feuille = classeur.worksheets[0];
  // L'en-tête (Prénom, Nom, …) n'est pas sur la première ligne : on la cherche.
  let entete = 0;
  feuille.eachRow((row, n) => {
    if (!entete && sansAccent(texteCellule(row.getCell(1))) === "prenom" && sansAccent(texteCellule(row.getCell(2))) === "nom") entete = n;
  });
  if (!entete) throw new Error("Annuaire : ligne d'en-tête (Prénom, Nom…) introuvable.");
  const colonne = (debut: string) => {
    let n = 0;
    feuille.getRow(entete).eachCell((c, i) => {
      if (sansAccent(texteCellule(c)).startsWith(debut)) n = i;
    });
    return n;
  };
  const cEmail = colonne("email");
  const cTel = colonne("telephone");
  const cNaissance = colonne("date de naissance");
  const cEntree = colonne("date d'entree");
  if (!cEmail) throw new Error("Annuaire : colonne « Email » introuvable.");
  const lignes: LigneAnnuaire[] = [];
  for (let r = entete + 1; r <= feuille.rowCount; r++) {
    const row = feuille.getRow(r);
    const prenom = joli(texteCellule(row.getCell(1)));
    const nom = joli(texteCellule(row.getCell(2)));
    if (!prenom && !nom) continue;
    const naissance = cNaissance ? new Date(texteCellule(row.getCell(cNaissance))) : null;
    lignes.push({
      prenom,
      nom,
      email: texteCellule(row.getCell(cEmail)).toLowerCase() || null,
      telephone: cTel ? texteCellule(row.getCell(cTel)) || null : null,
      entree: cEntree ? texteCellule(row.getCell(cEntree)).slice(0, 7) || null : null,
      anneeNaissance: naissance && !Number.isNaN(naissance.getTime()) ? naissance.getUTCFullYear() : null,
    });
  }
  return lignes;
}

type LigneErasmus = { nomBrut: string; telephone: string | null; promoEntree: number | null; lieu: string; pays: string; semestre: number | null };

async function lireErasmus(chemin: string): Promise<LigneErasmus[]> {
  const classeur = new ExcelJS.Workbook();
  await classeur.xlsx.readFile(chemin);
  const feuille = classeur.worksheets.find((f) => sansAccent(f.name).includes("liste")) ?? classeur.worksheets[1];
  const lignes: LigneErasmus[] = [];
  for (let r = 2; r <= feuille.rowCount; r++) {
    const row = feuille.getRow(r);
    const nomBrut = joli(texteCellule(row.getCell(1)));
    if (!nomBrut) continue;
    const promo = texteCellule(row.getCell(3)).match(/(20\d\d)/)?.[1];
    const semestre = Number(texteCellule(row.getCell(6)));
    lignes.push({
      nomBrut,
      telephone: texteCellule(row.getCell(2)) || null,
      promoEntree: promo ? Number(promo) : null,
      lieu: texteCellule(row.getCell(4)),
      pays: texteCellule(row.getCell(5)),
      semestre: semestre === 1 || semestre === 2 ? semestre : null,
    });
  }
  return lignes;
}

// ─── Fusion ───────────────────────────────────────────────────────────────────

type Brouillon = {
  annuaire?: LigneAnnuaire;
  poursuite?: Ligne;
  erasmus: LigneErasmus[];
};

type Entree = { jetons: string[]; tels: Set<string>; emails: Set<string>; b: Brouillon };

/** Deux jeux de jetons désignent la même personne si l'un est inclus dans l'autre (au moins 2 jetons). */
const memePersonne = (a: string[], b: string[]) => {
  const [petit, grand] = a.length <= b.length ? [a, b] : [b, a];
  return petit.length >= 2 && petit.every((j) => grand.includes(j));
};

export type Compilation = {
  personnes: PersonneCompilee[];
  /** Rapprochements incertains ou conflits, pour relecture humaine. */
  alertes: string[];
};

export async function compiler(fichiers: { annuaire: string; poursuite: string; erasmus: string }): Promise<Compilation> {
  const [annuaire, poursuite, erasmus] = await Promise.all([lireAnnuaire(fichiers.annuaire), lirePoursuite(fichiers.poursuite), lireErasmus(fichiers.erasmus)]);
  const alertes: string[] = [];
  const entrees: Entree[] = [];
  const cesures = new Set<Ligne>();

  const trouver = (jet: string[], tels: (string | null)[], emails: (string | null)[]) =>
    entrees.find((x) => tels.some((t) => t && x.tels.has(t)) || emails.some((e) => e && x.emails.has(e)) || memePersonne(x.jetons, jet));

  const nouvelle = (jet: string[], tels: (string | null)[], emails: (string | null)[]): Entree => ({
    jetons: jet,
    tels: new Set(tels.filter(Boolean) as string[]),
    emails: new Set(emails.filter(Boolean) as string[]),
    b: { erasmus: [] },
  });
  const completer = (x: Entree, jet: string[], tels: (string | null)[], emails: (string | null)[]) => {
    tels.forEach((t) => t && x.tels.add(t));
    emails.forEach((e) => e && x.emails.add(e));
    if (jet.length > x.jetons.length) x.jetons = jet;
  };

  for (const a of annuaire) {
    const jet = jetons(`${a.prenom} ${a.nom}`);
    const tels = [chiffres(a.telephone)];
    const existant = trouver(jet, tels, [a.email]);
    if (existant?.b.annuaire) {
      alertes.push(`Annuaire : « ${a.prenom} ${a.nom} » semble apparaître deux fois (même nom, e-mail ou téléphone) : seule la première ligne est gardée.`);
      continue;
    }
    const x = nouvelle(jet, tels, [a.email]);
    x.b.annuaire = a;
    entrees.push(x);
  }

  for (const brut of poursuite) {
    const prenomPropre = nettoyerNom(brut.prenom);
    const nomPropre = nettoyerNom(brut.nom);
    const p: Ligne = { ...brut, prenom: prenomPropre.texte, nom: nomPropre.texte };
    if (prenomPropre.cesure || nomPropre.cesure) cesures.add(p);
    const jet = jetons(`${p.prenom} ${p.nom}`);
    const tels = [chiffres(p.telephone)];
    const existant = trouver(jet, tels, [p.email]);
    if (existant?.b.poursuite) {
      alertes.push(
        `Poursuite : « ${p.prenom} ${p.nom} » (${p.promoEntree}) ressemble à « ${existant.b.poursuite.prenom} ${existant.b.poursuite.nom} » (${existant.b.poursuite.promoEntree}) : deux personnes conservées, à vérifier.`,
      );
      const x = nouvelle(jet, tels, [p.email]);
      x.b.poursuite = p;
      entrees.push(x);
    } else if (existant) {
      existant.b.poursuite = p;
      completer(existant, jet, tels, [p.email]);
    } else {
      const x = nouvelle(jet, tels, [p.email]);
      x.b.poursuite = p;
      entrees.push(x);
    }
  }

  for (const e of erasmus) {
    const jet = jetons(e.nomBrut);
    const tels = [chiffres(e.telephone)];
    const existant = trouver(jet, tels, []);
    if (existant) {
      existant.b.erasmus.push(e);
      completer(existant, jet, tels, []);
    } else {
      const x = nouvelle(jet, tels, []);
      x.b.erasmus.push(e);
      entrees.push(x);
    }
  }

  const personnes: PersonneCompilee[] = entrees.map(({ b }) => {
    const aVerifier: string[] = [];
    const sources: PersonneCompilee["sources"] = [];
    if (b.annuaire) sources.push("annuaire");
    if (b.poursuite) sources.push("poursuite");
    if (b.erasmus.length) sources.push("erasmus");

    // Nom : l'annuaire sépare correctement prénom et nom ; sinon la poursuite ; sinon Erasmus (« Nom Prénom », ambigu).
    let prenom: string;
    let nom: string;
    if (b.annuaire) ({ prenom, nom } = b.annuaire);
    else if (b.poursuite) ({ prenom, nom } = b.poursuite);
    else {
      const mots = b.erasmus[0].nomBrut.split(" ");
      nom = mots[0];
      prenom = mots.slice(1).join(" ");
      aVerifier.push("nom lu dans le fichier Erasmus (« Nom Prénom ») : vérifier la séparation prénom / nom");
    }

    const email = b.annuaire?.email ?? b.poursuite?.email ?? null;
    if (b.annuaire?.email && b.poursuite?.email && b.annuaire.email !== b.poursuite.email) {
      aVerifier.push("deux adresses e-mail différentes (annuaire et poursuite) : celle de l'annuaire est retenue");
    }
    const telephone = formaterTelephone(b.annuaire?.telephone ?? b.poursuite?.telephone ?? b.erasmus[0]?.telephone ?? null);

    const promoErasmus = b.erasmus.find((e) => e.promoEntree)?.promoEntree ?? null;
    if (b.poursuite && promoErasmus && b.poursuite.promoEntree !== promoErasmus) {
      aVerifier.push(`promotion différente : ${b.poursuite.promoEntree} (poursuite) et ${promoErasmus} (Erasmus) : celle de la poursuite est retenue`);
    }
    if (b.poursuite) aVerifier.push(...b.poursuite.aVerifier);
    const cesure = !!b.poursuite && cesures.has(b.poursuite);
    if (cesure) aVerifier.push("« césure » était écrit dans le nom : retiré du nom, situation « en césure » ajoutée");

    let promoEntree = b.poursuite?.promoEntree ?? promoErasmus;
    const promoEstimee = promoEntree === null || promoEntree === undefined;
    if (promoEstimee) {
      promoEntree = estimerPromo(b.annuaire?.anneeNaissance ?? null, b.annuaire?.entree ?? null);
      aVerifier.push(`promotion estimée à ${promoEntree} (ni la poursuite ni Erasmus ne la donnent) : à confirmer par la personne`);
    }

    // Séjours identiques en double dans le fichier Erasmus : un seul est gardé.
    const sejours = b.erasmus
      .map((e) => ({ lieu: e.lieu, pays: e.pays, semestre: e.semestre, promoEntree: e.promoEntree }))
      .filter((e, i, tous) => tous.findIndex((o) => JSON.stringify(o) === JSON.stringify(e)) === i);
    if (sejours.length < b.erasmus.length) aVerifier.push("séjour Erasmus en double dans le fichier : un seul conservé");

    return {
      prenom: joli(prenom),
      nom: joli(nom),
      email,
      telephone,
      promoEntree: promoEntree as number,
      promoEstimee,
      cesure,
      ville: b.poursuite?.ville ?? null,
      situation: b.poursuite?.situation ?? null,
      formation: b.poursuite?.formation ?? null,
      sejours,
      sources,
      anneeNaissance: b.annuaire?.anneeNaissance ?? null,
      entreeAssociation: b.annuaire?.entree ?? null,
      aVerifier,
    };
  });

  return { personnes, alertes };
}
