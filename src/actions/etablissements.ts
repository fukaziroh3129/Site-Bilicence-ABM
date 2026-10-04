"use server";

// Gestion de la liste unifiée des établissements par le bureau (patch ADM-03) : ajout, correction,
// contrôle des établissements ajoutés par les membres, fusion des doublons, suppression, import CSV.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { colonnes, lireCsv, texteDuFichier } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { reconnaitreEtablissement } from "@/lib/etablissements";
import { normaliser } from "@/lib/format";
import { champ, valider, type EtatFormulaire } from "@/lib/formulaire";
import { CODES_PAYS, codePays, libelleEtablissement } from "@/lib/liste-etablissements";
import { exigerBureau } from "@/lib/session";

const TYPES = ["IEP", "UNIVERSITE", "ECOLE", "AUTRE"] as const;

function rafraichir() {
  revalidatePath("/", "layout");
}

const schemaEtablissement = z.object({
  nom: champ.texte(160),
  ville: champ.texteFacultatif(80),
  // Saisi par son nom (« Canada ») grâce à la liste de suggestions, ou par son code (« CA »).
  pays: champ
    .texte(60)
    .transform((v) => codePays(v))
    .refine((v): v is string => v !== null && CODES_PAYS.includes(v), "Pays inconnu."),
  type: champ.choix(TYPES),
});

export async function creerEtablissement(formData: FormData) {
  await exigerBureau();
  const resultat = valider(schemaEtablissement, formData);
  if (!resultat.ok) return;
  await prisma.etablissement.create({ data: resultat.donnees });
  rafraichir();
}

/**
 * Corrige un établissement (et le marque comme contrôlé). Le nouveau nom est recopié dans les
 * formations qui y sont reliées.
 */
export async function enregistrerEtablissement(formData: FormData) {
  await exigerBureau();
  const resultat = valider(schemaEtablissement.extend({ id: z.string().min(1) }), formData);
  if (!resultat.ok) return;
  const { id, ...d } = resultat.donnees;
  await prisma.$transaction([
    prisma.etablissement.update({ where: { id }, data: { ...d, aControler: false } }),
    prisma.formation.updateMany({ where: { etablissementId: id }, data: { etablissement: d.nom } }),
  ]);
  rafraichir();
}

/**
 * Fusionne un établissement (doublon, ex. « IEP de Paris » et « Sciences Po Paris ») dans un autre :
 * les séjours Erasmus et les formations sont rattachés au second, puis le doublon est supprimé.
 */
export async function fusionnerEtablissement(formData: FormData) {
  await exigerBureau();
  const id = String(formData.get("id"));
  // La cible est choisie dans la liste de suggestions, par son libellé « Nom · Pays ».
  const libelle = String(formData.get("cible") ?? "").trim();
  const tous = await prisma.etablissement.findMany();
  const cible = tous.find((e) => e.id !== id && libelleEtablissement(e) === libelle);
  if (!cible) return;
  await prisma.$transaction([
    prisma.erasmus.updateMany({ where: { universiteId: id }, data: { universiteId: cible.id } }),
    prisma.formation.updateMany({ where: { etablissementId: id }, data: { etablissementId: cible.id, etablissement: cible.nom } }),
    prisma.etablissement.delete({ where: { id } }),
  ]);
  rafraichir();
}

/** Supprime un établissement qui n'est utilisé par aucune fiche (sinon, il faut le fusionner). */
export async function supprimerEtablissement(formData: FormData) {
  await exigerBureau();
  const id = String(formData.get("id"));
  const [sejours, formations] = await Promise.all([
    prisma.erasmus.count({ where: { universiteId: id } }),
    prisma.formation.count({ where: { etablissementId: id } }),
  ]);
  if (sejours + formations > 0) return;
  await prisma.etablissement.delete({ where: { id } });
  rafraichir();
}

/** Tous les établissements à contrôler deviennent « contrôlés » (après vérification de la liste). */
export async function toutMarquerControle() {
  await exigerBureau();
  await prisma.etablissement.updateMany({ where: { aControler: true }, data: { aControler: false } });
  rafraichir();
}

const TYPES_IMPORT: Record<string, (typeof TYPES)[number]> = {
  iep: "IEP",
  "institut d etudes politiques": "IEP",
  universite: "UNIVERSITE",
  "master universitaire": "UNIVERSITE",
  ecole: "ECOLE",
  autre: "AUTRE",
};

/**
 * Importe une liste d'établissements (fichier CSV : nom ; ville ; pays ; type). Les établissements
 * déjà présents (même nom dans le même pays) sont ignorés : l'import peut être relancé.
 */
export async function importerEtablissements(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const fichier = await texteDuFichier(formData.get("fichier"));
  if ("erreur" in fichier) return { erreur: fichier.erreur };

  const [entete, ...lignes] = lireCsv(fichier.texte);
  if (!entete || lignes.length === 0) return { erreur: "Le fichier est vide." };
  if (lignes.length > 3000) return { erreur: "3 000 lignes au maximum par fichier." };
  const col = colonnes(entete, {
    nom: ["nom", "etablissement", "universite", "nom de l etablissement", "nom de l universite"],
    ville: ["ville"],
    pays: ["pays", "code pays"],
    type: ["type", "type d etablissement"],
  });
  if (col.nom < 0) return { erreur: "Colonne « nom » introuvable : la première ligne doit contenir les titres (nom ; ville ; pays ; type)." };

  const existants = await prisma.etablissement.findMany({ select: { nom: true, pays: true } });
  const deja = new Set(existants.map((e) => `${e.pays}|${normaliser(e.nom)}`));
  const problemes: string[] = [];
  const aCreer: { nom: string; ville: string | null; pays: string; type: (typeof TYPES)[number] }[] = [];

  lignes.forEach((l, i) => {
    const numero = i + 2;
    const nom = (l[col.nom] ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
    if (!nom) return;
    const paysSaisi = col.pays >= 0 ? (l[col.pays] ?? "") : "";
    const pays = paysSaisi ? codePays(paysSaisi) : "FR";
    if (!pays) {
      problemes.push(`Ligne ${numero} : pays « ${paysSaisi} » non reconnu (code à deux lettres ou nom français).`);
      return;
    }
    const typeSaisi = col.type >= 0 ? normaliser(l[col.type] ?? "").replace(/[^a-z ]+/g, " ").trim() : "";
    const type = TYPES_IMPORT[typeSaisi] ?? reconnaitreEtablissement(nom).type;
    const cle = `${pays}|${normaliser(nom)}`;
    if (deja.has(cle)) return;
    deja.add(cle);
    aCreer.push({ nom, ville: col.ville >= 0 ? (l[col.ville] || "").slice(0, 80) || null : null, pays, type });
  });

  if (aCreer.length) await prisma.etablissement.createMany({ data: aCreer });
  rafraichir();
  const resume = `${aCreer.length} établissement(s) ajouté(s), ${lignes.length - aCreer.length - problemes.length} déjà présent(s) ou vide(s).`;
  return problemes.length
    ? { erreur: `${resume} ${problemes.length} ligne(s) non importée(s) :`, erreurs: Object.fromEntries(problemes.slice(0, 20).map((p, i) => [`ligne-${i}`, p])) }
    : { succes: resume };
}
