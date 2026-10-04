// Statistiques anonymes « Que deviennent-ils ? » : top 3 des domaines et des établissements,
// calculés à chaque visite à partir de TOUTES les fiches (toujours à jour). On ne renvoie que des
// proportions et des libellés : jamais de nom ni de donnée permettant de retrouver une personne.

import "server-only";
import { prisma } from "@/lib/db";
import { dictionnaireDomaines } from "@/lib/domaines";
import { FICHE_VISIBLE } from "@/lib/visibilite";
import { CLE_IEP, LIBELLES_TYPE_ETABLISSEMENT, decrireEtablissement, type TypeEtablissement } from "@/lib/etablissements";

export type LigneStat = {
  /** Code du domaine ou clé de l'établissement (sert au filtre du carrousel). */
  cle: string;
  libelle: string;
  /** Part des personnes concernées, de 0 à 1. */
  part: number;
  type?: string; // « IEP », « Université », « École »…
  /** Barre empilée (IEP) : Sciences Po Paris d'un côté, les autres IEP de l'autre. */
  segments?: { libelle: string; part: number }[];
};

export type StatistiquesDevenir = {
  domaines: LigneStat[];
  etablissements: LigneStat[];
};

const TOP = 3;

export async function statistiquesDevenir(): Promise<StatistiquesDevenir> {
  const [personnes, dico] = await Promise.all([
    prisma.personne.findMany({ where: FICHE_VISIBLE, select: { secteurs: true, formations: { select: { etablissement: true, etablissementRef: { select: { nom: true, type: true } } } } } }),
    dictionnaireDomaines(),
  ]);

  // ─── Domaines : part des personnes ayant renseigné au moins un domaine ───
  const valides = new Set(dico.domaines.map((d) => d.code));
  const avecDomaine = personnes.filter((p) => p.secteurs.some((c) => valides.has(c)));
  const parDomaine = new Map<string, number>();
  for (const p of avecDomaine) for (const c of new Set(p.secteurs)) if (valides.has(c)) parDomaine.set(c, (parDomaine.get(c) ?? 0) + 1);
  const domaines = [...parDomaine]
    .sort((a, b) => b[1] - a[1] || dico.libelle(a[0]).localeCompare(dico.libelle(b[0]), "fr"))
    .slice(0, TOP)
    .map(([code, n]) => ({ cle: code, libelle: dico.libelle(code), part: n / avecDomaine.length }));

  // ─── Établissements : part des personnes ayant au moins une poursuite d'études ───
  // Tous les IEP forment une seule ligne, divisée entre Sciences Po Paris et les autres IEP.
  const avecFormation = personnes.filter((p) => p.formations.length > 0);
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
  const base = avecFormation.length || 1;
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

  return { domaines, etablissements };
}
