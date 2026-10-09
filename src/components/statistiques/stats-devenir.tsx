"use client";

// Outil statistique « Que deviennent-ils ? » : deux podiums (top 3 des grands domaines d'études, top 3 des
// établissements), en proportions uniquement, jamais de nom. Réutilisable :
//  - sur /promotions (mode « filtre ») : un clic sur une ligne filtre le carrousel juste au-dessus ;
//  - ailleurs, par ex. la page Formation (mode « lien ») : un clic ouvre /promotions déjà filtré.

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Compteur } from "@/components/anime";
import type { LigneStat, StatistiquesDevenir } from "@/lib/statistiques";

/** Événement écouté par le carrousel de /promotions. */
export const EVENEMENT_FILTRE = "abm:filtrer-parcours";
export type DetailFiltre = { type: "domaine" | "famille" | "etablissement"; cle: string; libelle: string };

const EASE = [0.16, 1, 0.3, 1] as const;
const pourcent = (p: number) => Math.round(p * 100);

/** Pourcentages des parties d'une barre empilée, arrondis pour que leur somme égale le total affiché. */
function pourcentsSegments(ligne: LigneStat) {
  const segments = ligne.segments ?? [];
  const arrondis = segments.map((s) => pourcent(s.part));
  if (arrondis.length) arrondis[arrondis.length - 1] = pourcent(ligne.part) - arrondis.slice(0, -1).reduce((a, b) => a + b, 0);
  return arrondis;
}

/** Pastille de rang : 1, 2, 3, du plus foncé au plus clair. */
const MEDAILLES = [
  "bg-[image:var(--degrade-bouton)] text-white shadow-abm-card",
  "bg-bordeaux-400 text-white",
  "bg-bordeaux-200 text-bordeaux-800",
];

function Ligne({
  ligne,
  rang,
  max,
  type,
  mode,
}: {
  ligne: LigneStat;
  rang: number;
  max: number;
  type: DetailFiltre["type"];
  mode: "filtre" | "lien";
}) {
  const largeur = (part: number) => `${(part / max) * 100}%`;
  const pctSegments = pourcentsSegments(ligne);
  const contenu = (
    <>
      <span aria-hidden className={`flex size-9 shrink-0 items-center justify-center rounded-full font-impact text-lg ${MEDAILLES[rang]}`}>
        {rang + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-display text-lg font-bold leading-snug text-bordeaux-700">{ligne.libelle}</span>
            {ligne.type && (
              <span className="rounded-abm-pill border border-bordeaux-700/25 px-2 py-px text-[11px] font-semibold uppercase tracking-[0.08em] text-bordeaux-600">
                {ligne.type}
              </span>
            )}
          </span>
          <span className="font-impact text-3xl leading-none text-ink">
            <Compteur valeur={pourcent(ligne.part)} />
            <span className="text-xl">&nbsp;%</span>
          </span>
        </span>

        {/* Barre (empilée pour les IEP), qui se remplit à l'apparition */}
        <span aria-hidden className="mt-3 block h-3 overflow-hidden rounded-abm-pill bg-bordeaux-100">
          <motion.span
            className="flex h-full origin-left"
            style={{ width: largeur(ligne.part) }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.1, delay: 0.15 + rang * 0.12, ease: EASE }}
          >
            {ligne.segments ? (
              ligne.segments.map((s, i) => (
                <span
                  key={s.libelle}
                  className={i === 0 ? "h-full bg-[image:var(--degrade-bouton)]" : "rayures-iep h-full"}
                  style={{ width: `${(s.part / ligne.part) * 100}%` }}
                />
              ))
            ) : (
              <span className="h-full w-full bg-[image:var(--degrade-bouton)] transition-opacity group-hover:opacity-85" />
            )}
          </motion.span>
        </span>

        {ligne.segments && (
          <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
            {ligne.segments.map((s, i) => (
              <span key={s.libelle} className="inline-flex items-center gap-2">
                <i aria-hidden className={`inline-block size-3 rounded-[2px] ${i === 0 ? "bg-[image:var(--degrade-bouton)]" : "rayures-iep"}`} />
                <span>
                  <b className="font-semibold text-ink">{s.libelle}</b> {pctSegments[i]}&nbsp;%
                </span>
              </span>
            ))}
          </span>
        )}

        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-bordeaux-600 opacity-70 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Voir ces parcours <ArrowRight size={13} className="fleche" aria-hidden />
        </span>
      </span>
    </>
  );

  const classe =
    "group flex w-full items-start gap-4 rounded-abm-md px-3 py-4 text-left transition-colors hover:bg-bordeaux-100/50 focus-visible:bg-bordeaux-100/50";
  const description = `${rang + 1}. ${ligne.libelle} : ${pourcent(ligne.part)} %${
    ligne.segments ? ` (${ligne.segments.map((s, i) => `${s.libelle} ${pctSegments[i]} %`).join(", ")})` : ""
  }. Voir ces parcours.`;

  if (mode === "lien") {
    return (
      <Link href={`/promotions?${type}=${encodeURIComponent(ligne.cle)}#parcours`} className={classe} aria-label={description}>
        {contenu}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={classe}
      aria-label={description}
      onClick={() =>
        window.dispatchEvent(new CustomEvent<DetailFiltre>(EVENEMENT_FILTRE, { detail: { type, cle: ligne.cle, libelle: ligne.libelle } }))
      }
    >
      {contenu}
    </button>
  );
}

function Podium({
  titre,
  sousTitre,
  lignes,
  type,
  mode,
}: {
  titre: string;
  sousTitre: string;
  lignes: LigneStat[];
  type: DetailFiltre["type"];
  mode: "filtre" | "lien";
}) {
  const max = Math.max(...lignes.map((l) => l.part), 0.0001);
  return (
    <section className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-7">
      <h3 className="font-display text-2xl font-bold text-bordeaux-700">{titre}</h3>
      <p className="mt-1 text-sm text-ink-soft">{sousTitre}</p>
      {lignes.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Pas encore assez de fiches renseignées.</p>
      ) : (
        <ol className="mt-4 space-y-1">
          {lignes.map((l, i) => (
            <li key={l.cle}>
              <Ligne ligne={l} rang={i} max={max} type={type} mode={mode} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function StatsDevenir({ stats, mode = "filtre" }: { stats: StatistiquesDevenir; mode?: "filtre" | "lien" }) {
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Podium
          titre="Ce qu’ils ont étudié"
          sousTitre="Part des anciens ayant renseigné une poursuite d’études, par grand domaine d’études (une personne peut en avoir plusieurs)."
          lignes={stats.familles}
          type="famille"
          mode={mode}
        />
        <Podium
          titre="Où ils poursuivent leurs études"
          sousTitre="Part des anciens ayant renseigné une poursuite d’études, par établissement."
          lignes={stats.etablissements}
          type="etablissement"
          mode={mode}
        />
      </div>
      <p className="mt-4 text-xs text-ink-soft">
        Calculé automatiquement à partir des fiches des anciens, sans aucun nom. Cliquez sur une ligne pour voir les
        parcours correspondants.
      </p>
    </div>
  );
}
