// Enregistrement des fichiers téléversés : images (photos d'actualités, portraits du bureau)
// et rapports de stage en PDF.
// Elles sont rangées dans le dossier UPLOAD_DIR : en production, un volume persistant
// Coolify, sinon elles disparaîtraient à chaque redéploiement.
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const TYPES_AUTORISES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo

/** Préfixe d'adresse sous lequel les images sont servies (voir src/app/fichiers/[nom]/route.ts). */
const PREFIXE = "/fichiers/";

export function dossierFichiers() {
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

/** Nom de fichier valide (empêche de remonter dans l'arborescence du serveur). */
export function nomValide(nom: string) {
  return /^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(nom);
}

/** Vérifie la « signature » binaire du fichier : le type annoncé par le navigateur peut être falsifié. */
function signatureValide(octets: Uint8Array, type: string) {
  const debut = (...valeurs: number[]) => valeurs.every((v, i) => octets[i] === v);
  if (type === "image/jpeg") return debut(0xff, 0xd8, 0xff);
  if (type === "image/png") return debut(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (type === "image/webp") {
    const texte = (de: number, a: number) => String.fromCharCode(...octets.slice(de, a));
    return texte(0, 4) === "RIFF" && texte(8, 12) === "WEBP";
  }
  return false;
}

export async function verifierImage(fichier: File | null): Promise<string | null> {
  if (!fichier || fichier.size === 0) return null;
  if (!TYPES_AUTORISES[fichier.type]) return "Format accepté : JPEG, PNG ou WebP.";
  if (fichier.size > TAILLE_MAX) return "L’image dépasse 5 Mo.";
  const entete = new Uint8Array(await fichier.slice(0, 12).arrayBuffer());
  if (!signatureValide(entete, fichier.type)) return "Ce fichier n’est pas une image valide.";
  return null;
}

/** Enregistre l'image et renvoie son adresse (« /fichiers/xxxx.jpg »). */
export async function enregistrerImage(fichier: File) {
  const extension = TYPES_AUTORISES[fichier.type];
  const nom = `${randomUUID()}.${extension}`;
  await mkdir(dossierFichiers(), { recursive: true });
  await writeFile(path.join(dossierFichiers(), nom), Buffer.from(await fichier.arrayBuffer()));
  return `${PREFIXE}${nom}`;
}

/** Supprime une image précédemment enregistrée (sans erreur si elle n'existe plus). */
export async function supprimerImage(adresse: string | null | undefined) {
  if (!adresse?.startsWith(PREFIXE)) return;
  const nom = adresse.slice(PREFIXE.length);
  if (!nomValide(nom)) return;
  await unlink(path.join(dossierFichiers(), nom)).catch(() => {});
}

// ─── Rapports de stage (PDF) ───────────────────────────────────────────────────
// Rangés à part (UPLOAD_DIR/rapports) et JAMAIS servis par /fichiers : ils ne sont téléchargeables
// que par les membres validés, via src/app/espace/rapports/[id]/route.ts, qui vérifie les droits.

export const TAILLE_MAX_PDF = 10 * 1024 * 1024; // 10 Mo

function dossierRapports() {
  return path.join(dossierFichiers(), "rapports");
}

export function nomRapportValide(nom: string) {
  return /^[a-f0-9-]{36}\.pdf$/.test(nom);
}

export function cheminRapport(nom: string) {
  return path.join(dossierRapports(), nom);
}

export async function verifierPdf(fichier: File | null): Promise<string | null> {
  if (!fichier || fichier.size === 0) return null;
  if (fichier.type !== "application/pdf" && !fichier.name.toLowerCase().endsWith(".pdf")) return "Format accepté : PDF uniquement.";
  if (fichier.size > TAILLE_MAX_PDF) return "Le fichier dépasse 10 Mo.";
  // Un vrai PDF commence toujours par « %PDF- ».
  const entete = new Uint8Array(await fichier.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...entete) !== "%PDF-") return "Ce fichier n’est pas un PDF valide.";
  return null;
}

/** Enregistre le PDF et renvoie son nom de fichier. */
export async function enregistrerPdf(fichier: File) {
  const nom = `${randomUUID()}.pdf`;
  await mkdir(dossierRapports(), { recursive: true });
  await writeFile(cheminRapport(nom), Buffer.from(await fichier.arrayBuffer()));
  return nom;
}

/** Supprime un rapport (sans erreur s'il n'existe plus). */
export async function supprimerRapport(nom: string | null | undefined) {
  if (!nom || !nomRapportValide(nom)) return;
  await unlink(cheminRapport(nom)).catch(() => {});
}
