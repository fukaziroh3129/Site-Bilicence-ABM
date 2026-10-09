// Reconnaît la mention de master des formations déjà enregistrées (importées ou saisies avant la liste
// des mentions), avec la même méthode que le site (src/lib/mentions.ts). Ne touche jamais une mention
// choisie à la main. Affiche les intitulés non reconnus : le bureau les classe dans /admin/mentions,
// en ajoutant au besoin une variante pour que la détection les reconnaisse ensuite.
// Sans danger : peut être relancé autant de fois que nécessaire.
//
// Utilisation : npm run mentions:detecter                        → simulation (rien n'est écrit)
//               npm run mentions:detecter -- --confirmer
//               npm run mentions:detecter -- --toutes --confirmer   (refait aussi les formations déjà classées)

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { detecterMention, estBiLicence, type MethodeDetection } from "../src/lib/mentions";

/** Détecte les mentions ; renvoie les compteurs et les intitulés non reconnus. */
export async function detecterMentionsEnLot(prisma: PrismaClient, { confirmer = true, toutes = false } = {}) {
  const [mentions, formations] = await Promise.all([
    prisma.mention.findMany({ select: { id: true, libelle: true, variantes: true } }),
    prisma.formation.findMany({
      where: { mentionAuto: true, ...(toutes ? {} : { mentionId: null }) },
      select: { id: true, intitule: true, parcours: true, etablissement: true, mentionId: true },
    }),
  ]);
  const libelle = new Map(mentions.map((m) => [m.id, m.libelle]));
  const parMethode: Record<MethodeDetection, number> = { exacte: 0, mots: 0, approchee: 0 };
  const nonReconnus = new Map<string, number>();
  let modifiees = 0;

  for (const f of formations) {
    if (estBiLicence(f.intitule, f.etablissement)) continue; // voir npm run bilicence:nettoyer
    const r = detecterMention(f.intitule, f.parcours, mentions);
    if (r) {
      parMethode[r.methode]++;
      if (r.methode === "approchee") console.log(`  ~ « ${f.intitule} » → ${libelle.get(r.mentionId)}`);
    } else {
      nonReconnus.set(f.intitule, (nonReconnus.get(f.intitule) ?? 0) + 1);
    }
    const mentionId = r?.mentionId ?? null;
    if (mentionId !== f.mentionId) {
      modifiees++;
      if (confirmer) await prisma.formation.update({ where: { id: f.id }, data: { mentionId } });
    }
  }
  return { examinees: formations.length, modifiees, parMethode, nonReconnus };
}

// Lancé directement (et non importé par un autre script)
if (process.argv[1]?.includes("mentions-detecter")) {
  const confirmer = process.argv.includes("--confirmer");
  const toutes = process.argv.includes("--toutes");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  detecterMentionsEnLot(prisma, { confirmer, toutes })
    .then(({ examinees, modifiees, parMethode, nonReconnus }) => {
      const reconnues = parMethode.exacte + parMethode.mots + parMethode.approchee;
      console.log(`\n${examinees} formation(s) examinée(s) : ${reconnues} reconnue(s) (exacte ${parMethode.exacte}, mots-clés ${parMethode.mots}, approchée ${parMethode.approchee}).`);
      console.log(`${modifiees} formation(s) ${confirmer ? "mise(s) à jour" : "à mettre à jour"}.`);
      if (nonReconnus.size) {
        console.log(`\nNon reconnues (à classer dans /admin/mentions) :`);
        for (const [t, n] of [...nonReconnus].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${t}`);
      }
      if (!confirmer) console.log("\nSimulation : relancez avec --confirmer pour écrire dans la base.");
    })
    .finally(() => prisma.$disconnect());
}
