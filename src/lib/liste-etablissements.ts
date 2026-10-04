// Liste unifiée des établissements (table Etablissement, patch ADM-03) : universités d'Erasmus ET
// établissements de poursuite d'études (masters, écoles, IEP). Un membre peut ajouter un établissement
// absent de la liste : il est utilisable tout de suite, et marqué « à contrôler » pour le bureau, qui
// le corrige, le fusionne avec un doublon ou le supprime (/admin/etablissements, tableau de bord).

import "server-only";
import carte from "@/lib/carte-monde.json";
import { prisma } from "@/lib/db";
import { decrireEtablissement, reconnaitreEtablissement } from "@/lib/etablissements";
import { normaliser } from "@/lib/format";
import { nomPays } from "@/lib/pays";

/** Codes de tous les pays connus (« AT », « CA »…). */
export const CODES_PAYS = Object.keys(carte.noms);

/** Liste des pays pour un menu déroulant, triée par nom français. */
export function optionsPays() {
  return CODES_PAYS.map((code) => ({ valeur: code, libelle: nomPays(code) })).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
}

/** Retrouve le code d'un pays à partir de son code ou de son nom français (« Espagne » → « ES »), pour les imports. */
export function codePays(texte: string) {
  const t = texte.trim();
  if (CODES_PAYS.includes(t.toUpperCase())) return t.toUpperCase();
  const cle = normaliser(t);
  return CODES_PAYS.find((code) => normaliser(nomPays(code)) === cle) ?? null;
}

/** Libellé unique d'un établissement dans les listes du bureau : « Université de Vienne · Autriche ». */
export function libelleEtablissement(e: { nom: string; pays: string }) {
  return `${e.nom} · ${nomPays(e.pays)}`;
}

/** Établissements proposés dans le formulaire Erasmus (filtrés par pays dans le navigateur). */
export async function universitesPourFormulaire() {
  const etablissements = await prisma.etablissement.findMany({ orderBy: { nom: "asc" } });
  return etablissements.map((u) => ({
    id: u.id,
    pays: u.pays,
    libelle: `${u.nom}${u.ville ? ` (${u.ville})` : ""}`,
  }));
}

/** Noms proposés pendant la saisie d'une formation (suggestions, la saisie libre reste possible). */
export async function nomsEtablissements() {
  const etablissements = await prisma.etablissement.findMany({ select: { nom: true }, orderBy: { nom: "asc" } });
  return [...new Set(etablissements.map((e) => e.nom))];
}

type Ajout = {
  /** Compte qui ajoute l'établissement (affiché au bureau). */
  ajouteParId?: string | null;
  /** Ajout par un membre : à contrôler par le bureau. */
  aControler?: boolean;
};

/**
 * Établissement d'une formation à partir du nom saisi : réutilise celui de la liste qui porte le même
 * nom ou désigne le même établissement (« Sciences Po » = « Sciences Po Paris ») ; sinon l'ajoute, avec
 * le type et le nom officiel devinés. Renvoie son identifiant et son nom (recopié dans la formation).
 */
export async function trouverOuCreerEtablissement(saisie: string, { ajouteParId = null, aControler = true }: Ajout = {}) {
  const propre = saisie.trim().replace(/\s+/g, " ");
  const devine = reconnaitreEtablissement(propre);
  const existants = await prisma.etablissement.findMany({ select: { id: true, nom: true, type: true } });
  const existant =
    existants.find((e) => normaliser(e.nom) === normaliser(propre)) ??
    existants.find((e) => decrireEtablissement({ etablissement: e.nom, etablissementRef: e }).cle === devine.cle);
  if (existant) return { id: existant.id, nom: existant.nom };

  const cree = await prisma.etablissement.create({
    data: { nom: devine.nom, type: devine.type, pays: "FR", aControler, ajouteParId },
    select: { id: true, nom: true },
  });
  return cree;
}

/** Université d'Erasmus ajoutée par un membre : réutilise une université du même nom dans ce pays, sinon l'ajoute (à contrôler). */
export async function trouverOuAjouterUniversite(nom: string, ville: string | null, pays: string, { ajouteParId = null, aControler = true }: Ajout = {}) {
  const propre = nom.trim().replace(/\s+/g, " ");
  const existantes = await prisma.etablissement.findMany({ where: { pays } });
  const existante = existantes.find((u) => normaliser(u.nom) === normaliser(propre));
  if (existante) return existante.id;
  const creee = await prisma.etablissement.create({ data: { nom: propre, ville, pays, type: "UNIVERSITE", aControler, ajouteParId } });
  return creee.id;
}
