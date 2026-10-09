"use server";

// Gestion des mentions de master et des grands domaines d'études par le bureau (/admin/mentions) :
// ajouter, renommer, déplacer, fusionner, supprimer, classer les formations non reconnues. Chaque
// changement est repris aussitôt partout (statistiques, filtres, fiches), car tout est lu en base.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugifier } from "@/lib/format";
import { champ, valider, type EtatFormulaire } from "@/lib/formulaire";
import { journaliser } from "@/lib/journal";
import { redetecterMentions } from "@/lib/liste-mentions";
import { cleTexte } from "@/lib/mentions";
import { exigerBureau } from "@/lib/session";

function rafraichir() {
  revalidatePath("/", "layout");
}

/** Variantes saisies une par ligne, sans doublon ni répétition du nom de la mention. */
function lignesVariantes(texte: string | null, libelle: string, existantes: string[] = []) {
  const vues = new Set([cleTexte(libelle)]);
  const resultat: string[] = [];
  for (const v of [...existantes, ...(texte ?? "").split(/\r?\n/)]) {
    const propre = v.trim().replace(/\s+/g, " ");
    const cle = cleTexte(propre);
    if (!propre || !cle || vues.has(cle)) continue;
    vues.add(cle);
    resultat.push(propre);
  }
  return resultat;
}

async function codeLibre(table: "famille" | "mention", libelle: string) {
  const base = slugifier(libelle) || table;
  const existe = (code: string) =>
    table === "famille" ? prisma.familleMention.findUnique({ where: { code } }) : prisma.mention.findUnique({ where: { code } });
  let code = base;
  for (let i = 2; await existe(code); i++) code = `${base}-${i}`;
  return code;
}

const erreurChamp = (nom: string, message: string, formData: FormData): EtatFormulaire => ({
  erreur: "Certains champs sont à corriger.",
  erreurs: { [nom]: message },
  valeurs: Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)])),
});

async function familleExiste(libelle: string, sauf?: string) {
  const familles = await prisma.familleMention.findMany({ select: { id: true, libelle: true } });
  return familles.find((f) => f.id !== sauf && cleTexte(f.libelle) === cleTexte(libelle)) ?? null;
}

async function mentionExiste(libelle: string, sauf?: string) {
  const mentions = await prisma.mention.findMany({ select: { id: true, libelle: true } });
  return mentions.find((m) => m.id !== sauf && cleTexte(m.libelle) === cleTexte(libelle)) ?? null;
}

// ─── Grands domaines d'études ──────────────────────────────────────────────────

export async function creerFamille(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const r = valider(z.object({ libelle: champ.texte(80) }), formData);
  if (!r.ok) return r.etat;
  const { libelle } = r.donnees;
  const doublon = await familleExiste(libelle);
  if (doublon) return erreurChamp("libelle", `« ${doublon.libelle} » existe déjà.`, formData);
  const dernier = await prisma.familleMention.aggregate({ _max: { ordre: true } });
  await prisma.familleMention.create({ data: { libelle, code: await codeLibre("famille", libelle), ordre: (dernier._max.ordre ?? 0) + 1 } });
  rafraichir();
  return { succes: `Grand domaine « ${libelle} » ajouté. Ajoutez-y des mentions, ou déplacez-en depuis un autre grand domaine.` };
}

export async function renommerFamille(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const r = valider(z.object({ id: z.string().min(1), libelle: champ.texte(80) }), formData);
  if (!r.ok) return r.etat;
  const { id, libelle } = r.donnees;
  const doublon = await familleExiste(libelle, id);
  if (doublon) return erreurChamp("libelle", `« ${doublon.libelle} » existe déjà : pour réunir les deux, utilisez plutôt « Fusionner ».`, formData);
  await prisma.familleMention.update({ where: { id }, data: { libelle } });
  rafraichir();
  return { succes: `Grand domaine renommé : « ${libelle} ».` };
}

/** Déplace toutes les mentions d'un grand domaine dans un autre, puis le supprime. */
export async function fusionnerFamille(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { user } = await exigerBureau();
  const r = valider(z.object({ id: z.string().min(1), cibleId: champ.texte(40) }), formData);
  if (!r.ok) return r.etat;
  const { id, cibleId } = r.donnees;
  if (id === cibleId) return erreurChamp("cibleId", "Choisissez un autre grand domaine.", formData);
  const [source, cible] = await Promise.all([
    prisma.familleMention.findUniqueOrThrow({ where: { id }, select: { libelle: true } }),
    prisma.familleMention.findUnique({ where: { id: cibleId }, select: { libelle: true } }),
  ]);
  if (!cible) return erreurChamp("cibleId", "Ce grand domaine n’existe plus.", formData);
  await prisma.$transaction([
    prisma.mention.updateMany({ where: { familleId: id }, data: { familleId: cibleId } }),
    prisma.familleMention.delete({ where: { id } }),
  ]);
  journaliser(user, `fusion du grand domaine d'études « ${source.libelle} » dans « ${cible.libelle} »`);
  rafraichir();
  return { succes: `« ${source.libelle} » a été fusionné dans « ${cible.libelle} ».` };
}

export async function supprimerFamille(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { user } = await exigerBureau();
  const id = String(formData.get("id") ?? "");
  const famille = await prisma.familleMention.findUnique({ where: { id }, include: { _count: { select: { mentions: true } } } });
  if (!famille) return { erreur: "Ce grand domaine n’existe plus." };
  if (famille._count.mentions > 0) return { erreur: "Ce grand domaine contient encore des mentions : déplacez-les ou fusionnez-le." };
  await prisma.familleMention.delete({ where: { id } });
  journaliser(user, `suppression du grand domaine d'études « ${famille.libelle} »`);
  rafraichir();
  return { succes: `Grand domaine « ${famille.libelle} » supprimé.` };
}

// ─── Mentions ──────────────────────────────────────────────────────────────────

const schemaMention = z.object({
  libelle: champ.texte(120),
  familleId: champ.texte(40),
  variantes: champ.texteFacultatif(3000),
});

export async function creerMention(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const r = valider(schemaMention, formData);
  if (!r.ok) return r.etat;
  const { libelle, familleId, variantes } = r.donnees;
  const doublon = await mentionExiste(libelle);
  if (doublon) return erreurChamp("libelle", `La mention « ${doublon.libelle} » existe déjà.`, formData);
  const famille = await prisma.familleMention.findUnique({ where: { id: familleId }, select: { libelle: true } });
  if (!famille) return erreurChamp("familleId", "Choisissez un grand domaine d’études.", formData);
  await prisma.mention.create({
    data: { libelle, familleId, code: await codeLibre("mention", libelle), variantes: lignesVariantes(variantes, libelle) },
  });
  const reconnues = await redetecterMentions({ toutes: true });
  rafraichir();
  return { succes: `Mention « ${libelle} » ajoutée dans « ${famille.libelle} ».${reconnues ? ` ${reconnues} formation(s) reclassée(s) automatiquement.` : ""}` };
}

/** Nom, grand domaine et variantes d'une mention. L'ancien nom reste reconnu (ajouté aux variantes). */
export async function modifierMention(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const r = valider(schemaMention.extend({ id: z.string().min(1) }), formData);
  if (!r.ok) return r.etat;
  const { id, libelle, familleId, variantes } = r.donnees;
  const doublon = await mentionExiste(libelle, id);
  if (doublon) return erreurChamp("libelle", `La mention « ${doublon.libelle} » existe déjà : pour réunir les deux, utilisez plutôt « Fusionner ».`, formData);
  const [avant, famille] = await Promise.all([
    prisma.mention.findUniqueOrThrow({ where: { id }, select: { libelle: true } }),
    prisma.familleMention.findUnique({ where: { id: familleId }, select: { id: true } }),
  ]);
  if (!famille) return erreurChamp("familleId", "Choisissez un grand domaine d’études.", formData);
  const liste = lignesVariantes(variantes, libelle);
  const anciennes = cleTexte(avant.libelle) !== cleTexte(libelle) ? lignesVariantes(avant.libelle, libelle, liste) : liste;
  await prisma.mention.update({ where: { id }, data: { libelle, familleId, variantes: anciennes } });
  const reconnues = await redetecterMentions({ toutes: true });
  rafraichir();
  return { succes: `Mention « ${libelle} » enregistrée.${reconnues ? ` ${reconnues} formation(s) reclassée(s) automatiquement.` : ""}` };
}

/** Rattache les formations d'une mention à une autre ; son nom et ses variantes deviennent des variantes de la cible. */
export async function fusionnerMention(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { user } = await exigerBureau();
  const r = valider(z.object({ id: z.string().min(1), cibleId: champ.texte(40) }), formData);
  if (!r.ok) return r.etat;
  const { id, cibleId } = r.donnees;
  if (id === cibleId) return erreurChamp("cibleId", "Choisissez une autre mention.", formData);
  const [source, cible] = await Promise.all([
    prisma.mention.findUniqueOrThrow({ where: { id } }),
    prisma.mention.findUnique({ where: { id: cibleId } }),
  ]);
  if (!cible) return erreurChamp("cibleId", "Cette mention n’existe plus.", formData);
  const variantes = lignesVariantes([source.libelle, ...source.variantes].join("\n"), cible.libelle, cible.variantes);
  await prisma.$transaction([
    prisma.formation.updateMany({ where: { mentionId: id }, data: { mentionId: cibleId } }),
    prisma.mention.update({ where: { id: cibleId }, data: { variantes } }),
    prisma.mention.delete({ where: { id } }),
  ]);
  journaliser(user, `fusion de la mention « ${source.libelle} » dans « ${cible.libelle} »`);
  rafraichir();
  return { succes: `« ${source.libelle} » a été fusionnée dans « ${cible.libelle} ».` };
}

export async function supprimerMention(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { user } = await exigerBureau();
  const id = String(formData.get("id") ?? "");
  const mention = await prisma.mention.findUnique({ where: { id }, include: { _count: { select: { formations: true } } } });
  if (!mention) return { erreur: "Cette mention n’existe plus." };
  if (mention._count.formations > 0) return { erreur: "Des formations utilisent encore cette mention : fusionnez-la plutôt." };
  await prisma.mention.delete({ where: { id } });
  journaliser(user, `suppression de la mention « ${mention.libelle} »`);
  rafraichir();
  return { succes: `Mention « ${mention.libelle} » supprimée.` };
}

// ─── Formations à classer ──────────────────────────────────────────────────────

/** Le bureau fixe la mention d'une formation (et peut retenir l'intitulé comme nouvelle variante). */
export async function classerFormation(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const r = valider(z.object({ formationId: z.string().min(1), mentionId: champ.texte(40), retenir: champ.case() }), formData);
  if (!r.ok) return { erreur: "Choisissez une mention." };
  const { formationId, mentionId, retenir } = r.donnees;
  const [formation, mention] = await Promise.all([
    prisma.formation.findUnique({ where: { id: formationId }, select: { intitule: true } }),
    prisma.mention.findUnique({ where: { id: mentionId } }),
  ]);
  if (!formation || !mention) return { erreur: "Cette formation ou cette mention n’existe plus." };
  await prisma.formation.update({ where: { id: formationId }, data: { mentionId, mentionAuto: false, mentionAControler: false } });
  let suite = "";
  if (retenir) {
    // On retient l'intitulé sans le mot du diplôme (« Master », « M2 »…) : la détection reconnaîtra cette écriture.
    const variante = formation.intitule.replace(/^\s*(master|msc|m1|m2|ma)\b[\s:–-]*/i, "").trim() || formation.intitule;
    await prisma.mention.update({ where: { id: mentionId }, data: { variantes: lignesVariantes(variante, mention.libelle, mention.variantes) } });
    const reconnues = await redetecterMentions();
    suite = ` « ${variante} » sera désormais reconnue automatiquement${reconnues ? ` (${reconnues} autre(s) formation(s) classée(s))` : ""}.`;
  }
  rafraichir();
  return { succes: `« ${formation.intitule} » classée dans « ${mention.libelle} ».${suite}` };
}

/** Relance la reconnaissance sur toutes les formations à mention automatique. */
export async function relancerDetection(): Promise<EtatFormulaire> {
  await exigerBureau();
  const n = await redetecterMentions({ toutes: true });
  rafraichir();
  return { succes: n ? `${n} formation(s) reclassée(s).` : "Aucun changement : toutes les formations automatiques sont à jour." };
}
