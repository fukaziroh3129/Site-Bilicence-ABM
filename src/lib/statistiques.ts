// Statistiques anonymes « Que deviennent-ils ? » : top 3 des grands domaines d'études (familles de
// mentions de master, depuis le 8 octobre 2026 ; avant : domaines professionnels) et des établissements,
// calculés à chaque visite à partir de TOUTES les fiches (toujours à jour). On ne renvoie que des
// proportions et des libellés : jamais de nom ni de donnée permettant de retrouver une personne.

import "server-only";
import { prisma } from "@/lib/db";
import { FICHE_VISIBLE } from "@/lib/visibilite";
import { CLE_IEP, LIBELLES_TYPE_ETABLISSEMENT, decrireEtablissement, type TypeEtablissement } from "@/lib/etablissements";
import { estBiLicence } from "@/lib/mentions";

export type LigneStat = {
  /** Code du grand domaine d'études ou clé de l'établissement (sert au filtre du carrousel). */
  cle: string;
  libelle: string;
  /** Part des personnes concernées, de 0 à 1. */
  part: number;
  type?: string; // « IEP », « Université », « École »…
  /** Barre empilée (IEP) : Sciences Po Paris d'un côté, les autres IEP de l'autre. */
  segments?: { libelle: string; part: number }[];
};

export type StatistiquesDevenir = {
  familles: LigneStat[];
  etablissements: LigneStat[];
};

const TOP = 3;

export async function statistiquesDevenir(): Promise<StatistiquesDevenir> {
  const fiches = await prisma.personne.findMany({
    where: FICHE_VISIBLE,
    select: {
      formations: {
        select: {
          intitule: true,
          etablissement: true,
          etablissementRef: { select: { nom: true, type: true } },
          mention: { select: { famille: { select: { code: true, libelle: true } } } },
        },
      },
    },
  });
  // La bi-licence saisie par erreur comme formation n'est pas une poursuite d'études.
  const personnes = fiches.map((p) => ({ formations: p.formations.filter((f) => !estBiLicence(f.intitule, f.etablissement)) }));
  const avecFormation = personnes.filter((p) => p.formations.length > 0);
  const base = avecFormation.length || 1;

  // ─── Grands domaines d'études : part des personnes ayant une poursuite d'études ───
  const parFamille = new Map<string, { libelle: string; n: number }>();
  for (const p of avecFormation) {
    const vues = new Set<string>();
    for (const f of p.formations) {
      const famille = f.mention?.famille;
      if (!famille || vues.has(famille.code)) continue;
      vues.add(famille.code);
      const e = parFamille.get(famille.code) ?? { libelle: famille.libelle, n: 0 };
      e.n++;
      parFamille.set(famille.code, e);
    }
  }
  const familles = [...parFamille]
    .sort((a, b) => b[1].n - a[1].n || a[1].libelle.localeCompare(b[1].libelle, "fr"))
    .slice(0, TOP)
    .map(([code, f]) => ({ cle: code, libelle: f.libelle, part: f.n / base }));

  // ─── Établissements : part des personnes ayant au moins une poursuite d'études ───
  // Tous les IEP forment une seule ligne, divisée entre Sciences Po Paris et les autres IEP.
  const parEtab = new Map<string, { nom: string; type: TypeEtablissement; n: number }>();
  let iepParis = 0;
  let iepAutres = 0;
  for (const p of avecFormation) {
    const reconnus = p.formations.map((f) => decrireEtablissement(f));
    const ieps = reconnus.filter((r) => r.type === "IEP");
    // Une personne passée par Sciences Po Paris compte de ce côté, même si elle a fait un autre IEP.
    if (ieps.some((r) => r.sciencesPoParis)) iepParis++;
    else if (ieps.length) iepAutres++;
    const vus = new Set<string>();
    for (const r of reconnus) {
      if (r.type === "IEP" || vus.has(r.cle)) continue;
      vus.add(r.cle);
      const e = parEtab.get(r.cle) ?? { nom: r.nom, type: r.type, n: 0 };
      e.n++;
      parEtab.set(r.cle, e);
    }
  }
  const lignes: (LigneStat & { n: number })[] = [...parEtab].map(([cle, e]) => ({
    cle,
    libelle: e.nom,
    type: LIBELLES_TYPE_ETABLISSEMENT[e.type],
    part: e.n / base,
    n: e.n,
  }));
  if (iepParis + iepAutres > 0) {
    lignes.push({
      cle: CLE_IEP,
      libelle: "Instituts d’études politiques",
      type: LIBELLES_TYPE_ETABLISSEMENT.IEP,
      part: (iepParis + iepAutres) / base,
      n: iepParis + iepAutres,
      segments: [
        { libelle: "Sciences Po Paris", part: iepParis / base },
        { libelle: "Autres IEP", part: iepAutres / base },
      ],
    });
  }
  const etablissements = lignes
    .sort((a, b) => b.n - a.n || a.libelle.localeCompare(b.libelle, "fr"))
    .slice(0, TOP)
    .map(({ cle, libelle, type, part, segments }) => ({ cle, libelle, type, part, segments }));

  return { familles, etablissements };
}
