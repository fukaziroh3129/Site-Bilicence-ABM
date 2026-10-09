// Mentions de master et grands domaines d'études en base (tables Mention et FamilleMention), gérés
// par le bureau dans /admin/mentions. La reconnaissance elle-même est dans src/lib/mentions.ts.

import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { detecterMention, estBiLicence, type MentionDetectable } from "@/lib/mentions";

/** Grands domaines d'études avec leurs mentions, dans l'ordre d'affichage (chargés une fois par requête). */
export const chargerFamilles = cache(() =>
  prisma.familleMention.findMany({
    orderBy: [{ ordre: "asc" }, { libelle: "asc" }],
    include: { mentions: { orderBy: { libelle: "asc" } } },
  }),
);

/** Toutes les mentions (pour la détection et les menus). */
export const chargerMentions = cache(() => prisma.mention.findMany({ orderBy: { libelle: "asc" } }));

/** Menu « Mention de master » du formulaire de formation, groupé par grand domaine d'études. */
export async function groupesMentions() {
  const familles = await chargerFamilles();
  return familles
    .filter((f) => f.mentions.length > 0)
    .map((f) => ({ libelle: f.libelle, mentions: f.mentions.map((m) => ({ id: m.id, libelle: m.libelle, variantes: m.variantes })) }));
}

/** Mention reconnue pour un intitulé (et son parcours), d'après la liste actuelle. */
export async function mentionReconnue(intitule: string, parcours: string | null) {
  const mentions: MentionDetectable[] = await chargerMentions();
  return detecterMention(intitule, parcours, mentions)?.mentionId ?? null;
}

/**
 * Relance la reconnaissance sur les formations dont la mention est automatique (jamais sur un choix
 * fait à la main). `toutes` : aussi celles qui ont déjà une mention (après un changement de variantes) ;
 * sinon seulement celles qui n'en ont pas. Renvoie le nombre de formations modifiées.
 */
export async function redetecterMentions({ toutes = false } = {}) {
  const [mentions, formations] = await Promise.all([
    prisma.mention.findMany({ select: { id: true, libelle: true, variantes: true } }),
    prisma.formation.findMany({
      where: { mentionAuto: true, ...(toutes ? {} : { mentionId: null }) },
      select: { id: true, intitule: true, parcours: true, etablissement: true, mentionId: true },
    }),
  ]);
  let modifiees = 0;
  for (const f of formations) {
    if (estBiLicence(f.intitule, f.etablissement)) continue;
    const mentionId = detecterMention(f.intitule, f.parcours, mentions)?.mentionId ?? null;
    if (mentionId === f.mentionId) continue;
    await prisma.formation.update({ where: { id: f.id }, data: { mentionId } });
    modifiees++;
  }
  return modifiees;
}

/** Formations à traiter par le bureau : sans mention reconnue, ou mention choisie par un membre. */
export const FORMATION_A_CLASSER = { OR: [{ mentionId: null }, { mentionAControler: true }] } satisfies Prisma.FormationWhereInput;
