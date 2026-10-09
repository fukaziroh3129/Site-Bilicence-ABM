"use client";

// « Les établissements » : double anneau (intérieur = type d'établissement, extérieur = chaque
// établissement de ce type) et, à côté, la liste en barres. Un clic sur un type filtre la liste ; un
// clic sur un établissement ouvre la liste des personnes qui y ont étudié.

import { useState } from "react";
import { COULEURS_TYPES, LIBELLES_TYPES, ORDRE_TYPES, compterPersonnes, personnes, type Ouvrir, type PersonneStat, type TypeStat } from "./outils";

const C = 170; // centre du dessin (viewBox 340 × 340)

/** Secteur d'anneau entre deux angles (en radians, 0 = en haut, sens des aiguilles d'une montre). */
function arc(r0: number, r1: number, a0: number, a1: number) {
  if (a1 - a0 >= 2 * Math.PI - 1e-6) a1 = a0 + 2 * Math.PI - 1e-4; // anneau complet : un tracé ne peut pas boucler sur lui-même
  const pt = (r: number, a: number) => [C + r * Math.sin(a), C - r * Math.cos(a)].map((v) => v.toFixed(2)).join(",");
  const grand = a1 - a0 > Math.PI ? 1 : 0;
  return `M${pt(r1, a0)} A${r1},${r1} 0 ${grand} 1 ${pt(r1, a1)} L${pt(r0, a1)} A${r0},${r0} 0 ${grand} 0 ${pt(r0, a0)} Z`;
}

type Etab = { cle: string; nom: string; type: TypeStat; personnes: PersonneStat[] };

export function AnneauEtablissements({
  liste,
  ouvrir,
  survol,
  mentions,
}: {
  liste: PersonneStat[];
  ouvrir: Ouvrir;
  survol: (contenu: React.ReactNode) => Record<string, unknown>;
  mentions: Record<string, { libelle: string }>;
}) {
  const [type, setType] = useState<TypeStat | "">("");
  const [tout, setTout] = useState(false);

  // Une personne compte une fois par établissement (même si elle y a suivi deux formations).
  const etabs = new Map<string, Etab>();
  for (const p of liste)
    for (const f of p.formations) {
      const e = etabs.get(f.cleEtablissement) ?? { cle: f.cleEtablissement, nom: f.etablissement, type: f.type, personnes: [] };
      if (!e.personnes.includes(p)) e.personnes.push(p);
      etabs.set(f.cleEtablissement, e);
    }
  const parType = ORDRE_TYPES.map((t) => {
    const liste = [...etabs.values()].filter((e) => e.type === t).sort((a, b) => b.personnes.length - a.personnes.length || a.nom.localeCompare(b.nom, "fr"));
    return { t, etabs: liste, n: liste.reduce((s, e) => s + e.personnes.length, 0) };
  }).filter((x) => x.n > 0);
  const total = parType.reduce((s, x) => s + x.n, 0);
  const choisi = type && parType.some((x) => x.t === type) ? type : "";

  if (total === 0) return <p className="text-sm text-ink-soft">Aucune poursuite d’études renseignée pour cette sélection.</p>;

  const filtrer = (t: TypeStat) => {
    setType(choisi === t ? "" : t);
    setTout(false);
  };
  const ouvrirEtab = (e: Etab) =>
    ouvrir({
      surtitre: `Établissement · ${LIBELLES_TYPES[e.type].un}`,
      titre: e.nom,
      personnes: e.personnes,
      formation: (p) => p.formations.find((f) => f.cleEtablissement === e.cle),
      filtre: {
        libelle: "Filtrer par mention",
        valeurs: (p) => p.formations.filter((f) => f.cleEtablissement === e.cle && f.mentionId).map((f) => f.mentionId!),
        options: compterPersonnes(e.personnes, (p) => p.formations.filter((f) => f.cleEtablissement === e.cle).map((f) => f.mentionId)),
        nom: (id) => mentions[id]?.libelle ?? "Mention à classer",
      },
    });
  const resumeMentions = (e: Etab) =>
    compterPersonnes(e.personnes, (p) => p.formations.filter((f) => f.cleEtablissement === e.cle).map((f) => f.mentionId))
      .slice(0, 3)
      .map(([id]) => mentions[id]?.libelle)
      .filter(Boolean)
      .join(" · ");

  // Tracé des deux anneaux
  const secteurs: React.ReactNode[] = [];
  let a = 0;
  for (const T of parType) {
    const a1 = a + (T.n / total) * 2 * Math.PI;
    const terne = choisi && choisi !== T.t ? "opacity-25" : "";
    secteurs.push(
      <path
        key={T.t}
        d={arc(72, 112, a, a1)}
        fill={COULEURS_TYPES[T.t].fond}
        stroke="#fff"
        strokeWidth={1.5}
        tabIndex={0}
        role="button"
        aria-label={`${LIBELLES_TYPES[T.t].plusieurs} : ${T.n} — filtrer la liste`}
        className={`cursor-pointer transition-opacity hover:opacity-80 focus-visible:opacity-80 ${terne}`}
        onClick={() => filtrer(T.t)}
        onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), filtrer(T.t))}
        {...survol(
          <>
            <b className="block text-sm">{LIBELLES_TYPES[T.t].plusieurs}</b>
            {T.n} · {Math.round((T.n / total) * 100)} %<br />
            <span className="text-bordeaux-200">Cliquer pour filtrer la liste</span>
          </>,
        )}
      />,
    );
    let b = a;
    T.etabs.forEach((e, i) => {
      const b1 = b + (e.personnes.length / total) * 2 * Math.PI;
      secteurs.push(
        <path
          key={e.cle}
          d={arc(116, 164, b, b1)}
          fill={COULEURS_TYPES[T.t].fond}
          fillOpacity={i % 2 ? 0.72 : 0.94}
          stroke="#fff"
          strokeWidth={1.5}
          tabIndex={0}
          role="button"
          aria-label={`${e.nom} : ${personnes(e.personnes.length)}`}
          className={`cursor-pointer transition-opacity hover:opacity-80 focus-visible:opacity-80 ${terne}`}
          onClick={() => ouvrirEtab(e)}
          onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), ouvrirEtab(e))}
          {...survol(
            <>
              <b className="block text-sm">{e.nom}</b>
              {LIBELLES_TYPES[e.type].un} · {personnes(e.personnes.length)}
              {resumeMentions(e) && (
                <>
                  <br />
                  <span className="text-bordeaux-200">{resumeMentions(e)}</span>
                </>
              )}
            </>,
          )}
        />,
      );
      b = b1;
    });
    a = a1;
  }

  const selection = choisi ? parType.find((x) => x.t === choisi)! : null;
  const lignes = selection ? selection.etabs : parType.flatMap((x) => x.etabs).sort((p, q) => q.personnes.length - p.personnes.length || p.nom.localeCompare(q.nom, "fr"));
  const max = Math.max(1, ...lignes.map((e) => e.personnes.length));
  const visibles = tout ? lignes : lignes.slice(0, 10);

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
      <div>
        <svg viewBox="0 0 340 340" className="mx-auto block w-full max-w-[340px]" role="group" aria-label="Formations par type d’établissement puis par établissement">
          {secteurs}
          <text x={C} y={C + 6} textAnchor="middle" className="fill-ink font-impact text-[40px]">
            {selection ? selection.n : total}
          </text>
          <text x={C} y={C + 30} textAnchor="middle" className="fill-ink-soft text-[12px] font-semibold uppercase tracking-[0.08em]">
            {selection ? LIBELLES_TYPES[selection.t].plusieurs : "formations"}
          </text>
        </svg>
        <div role="group" aria-label="Filtrer par type d’établissement" className="mt-4 grid grid-cols-2 gap-1.5">
          {parType.map((T) => (
            <button
              key={T.t}
              type="button"
              aria-pressed={choisi === T.t}
              onClick={() => filtrer(T.t)}
              className="flex min-h-10 items-center gap-2 rounded-abm-sm border border-bordeaux-700/20 bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-bordeaux-100 aria-pressed:border-bordeaux-700 aria-pressed:bg-bordeaux-100 aria-pressed:shadow-[inset_0_0_0_1px_var(--color-bordeaux-700)]"
            >
              <span aria-hidden className="size-3 shrink-0 rounded-[3px] ring-1 ring-bordeaux-700/25" style={{ background: COULEURS_TYPES[T.t].fond }} />
              {LIBELLES_TYPES[T.t].plusieurs}
              <b className="ml-auto tabular-nums">{T.n}</b>
            </button>
          ))}
        </div>
        {choisi && (
          <p className="mt-3 text-center">
            <button type="button" onClick={() => setType("")} className="text-sm font-semibold text-bordeaux-700 underline underline-offset-4">
              Afficher tous les types
            </button>
          </p>
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-bordeaux-700">{selection ? LIBELLES_TYPES[selection.t].plusieurs : "Tous les établissements"}</h3>
          <span className="text-sm text-ink-soft">
            {lignes.length} établissement{lignes.length > 1 ? "s" : ""}
          </span>
        </div>
        <ul className="space-y-0.5">
          {visibles.map((e) => (
            <li key={e.cle}>
              <button
                type="button"
                onClick={() => ouvrirEtab(e)}
                aria-label={`${e.nom} (${LIBELLES_TYPES[e.type].un}) : ${personnes(e.personnes.length)}`}
                className="grid w-full grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-1 rounded-abm-sm px-2 py-2 text-left transition-colors hover:bg-bordeaux-100/70 focus-visible:bg-bordeaux-100/70 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_2.5rem]"
                {...survol(
                  <>
                    <b className="block text-sm">{e.nom}</b>
                    {personnes(e.personnes.length)}
                    {resumeMentions(e) && (
                      <>
                        <br />
                        <span className="text-bordeaux-200">{resumeMentions(e)}</span>
                      </>
                    )}
                  </>,
                )}
              >
                <span className="min-w-0 text-sm leading-tight">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-[2px] ring-1 ring-bordeaux-700/25" style={{ background: COULEURS_TYPES[e.type].fond }} />
                    <span className="truncate">{e.nom}</span>
                  </span>
                  <span className="block pl-4 text-xs text-ink-soft">{LIBELLES_TYPES[e.type].un}</span>
                </span>
                <span aria-hidden className="col-span-2 h-3 sm:col-span-1">
                  <span
                    className="block h-full min-w-[3px] rounded-r-[4px]"
                    style={{
                      width: `${(e.personnes.length / max) * 100}%`,
                      background: COULEURS_TYPES[e.type].fond,
                      boxShadow: COULEURS_TYPES[e.type].clair ? "inset 0 0 0 1px rgba(92,26,30,.3)" : undefined,
                    }}
                  />
                </span>
                <span className="row-start-1 text-right font-semibold tabular-nums sm:row-auto">{e.personnes.length}</span>
              </button>
            </li>
          ))}
        </ul>
        {lignes.length > 10 && (
          <button type="button" onClick={() => setTout(!tout)} className="mt-2 text-sm font-semibold text-bordeaux-700 underline underline-offset-4">
            {tout ? "Afficher moins" : `Voir les ${lignes.length - 10} autres établissements`}
          </button>
        )}
      </div>
    </div>
  );
}
