// Lecture des fichiers CSV importés dans l'administration (pré-comptes, établissements).
// Un fichier Excel s'enregistre en CSV par « Fichier → Enregistrer sous → CSV UTF-8 ». Séparateur
// « ; » (Excel en français), « , » ou tabulation, détecté automatiquement ; guillemets gérés.

import { normaliser } from "@/lib/format";

/** Taille maximale d'un fichier importé (largement assez pour quelques milliers de lignes). */
export const TAILLE_MAX_CSV = 2 * 1024 * 1024;

/** Découpe un texte CSV en lignes de cellules (lignes vides ignorées). */
export function lireCsv(texte: string): string[][] {
  const contenu = texte.replace(/^﻿/, "");
  const premiere = contenu.split(/\r?\n/, 1)[0] ?? "";
  const separateur = [";", ",", "\t"].map((s) => [s, premiere.split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0];

  const lignes: string[][] = [];
  let ligne: string[] = [];
  let cellule = "";
  let entreGuillemets = false;
  for (let i = 0; i < contenu.length; i++) {
    const c = contenu[i];
    if (entreGuillemets) {
      if (c === '"' && contenu[i + 1] === '"') {
        cellule += '"';
        i++;
      } else if (c === '"') entreGuillemets = false;
      else cellule += c;
    } else if (c === '"') entreGuillemets = true;
    else if (c === separateur) {
      ligne.push(cellule.trim());
      cellule = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && contenu[i + 1] === "\n") i++;
      ligne.push(cellule.trim());
      if (ligne.some((x) => x)) lignes.push(ligne);
      ligne = [];
      cellule = "";
    } else cellule += c;
  }
  ligne.push(cellule.trim());
  if (ligne.some((x) => x)) lignes.push(ligne);
  return lignes;
}

/**
 * Repère les colonnes d'après la ligne d'en-tête : pour chaque champ, la première colonne dont le
 * titre correspond à l'un des noms acceptés (majuscules et accents ignorés). -1 si absente.
 */
export function colonnes<T extends string>(entete: string[], noms: Record<T, string[]>) {
  const titres = entete.map((t) => normaliser(t).replace(/[^a-z0-9]+/g, " ").trim());
  return Object.fromEntries(
    Object.entries<string[]>(noms).map(([champ, acceptes]) => [champ, titres.findIndex((t) => acceptes.includes(t))]),
  ) as Record<T, number>;
}

/** Lit le fichier envoyé par un formulaire. Renvoie le texte, ou un message d'erreur. */
export async function texteDuFichier(fichier: FormDataEntryValue | null): Promise<{ texte: string } | { erreur: string }> {
  if (!(fichier instanceof File) || fichier.size === 0) return { erreur: "Choisissez un fichier CSV." };
  if (fichier.size > TAILLE_MAX_CSV) return { erreur: "Fichier trop lourd (2 Mo maximum)." };
  if (!/\.(csv|txt)$/i.test(fichier.name)) return { erreur: "Le fichier doit être au format CSV (dans Excel : Enregistrer sous → CSV UTF-8)." };
  const octets = Buffer.from(await fichier.arrayBuffer());
  // CSV « UTF-8 » d'Excel, sinon ancien format Windows (accents en Windows-1252).
  const utf8 = octets.toString("utf8");
  return { texte: utf8.includes("�") ? new TextDecoder("windows-1252").decode(octets) : utf8 };
}
