"use client";

// « Les mentions de master » : mosaïque (surface = nombre de personnes) regroupée par grand domaine
// d'études. Sur petit écran, les cases deviendraient illisibles : la mosaïque est remplacée par une
// liste groupée, avec les mêmes données et les mêmes clics.

import { compterPersonnes, personnes, useLargeur, type DonneesStatistiques, type Ouvrir, type PersonneStat } from "./outils";

type Element = { cle: string; v: number };
type Case<T> = T & { x: number; y: number; w: number; h: number };

/** Mosaïque « carrée » : découpe un rectangle en cases proportionnelles, les plus proches possible du carré. */
function squarifier<T extends Element>(elements: T[], x: number, y: number, w: number, h: number): Case<T>[] {
  const total = elements.reduce((s, e) => s + e.v, 0);
  if (!total || w <= 0 || h <= 0) return [];
  const k = (w * h) / total;
  const res: Case<T>[] = [];
  let reste = elements.map((e) => ({ e, a: e.v * k }));
  const pire = (rang: { a: number }[], cote: number) => {
    const s = rang.reduce((t, r) => t + r.a, 0);
    const mx = Math.max(...rang.map((r) => r.a));
    const mn = Math.min(...rang.map((r) => r.a));
    return Math.max((cote * cote * mx) / (s * s), (s * s) / (cote * cote * mn));
  };
  while (reste.length) {
    const cote = Math.min(w, h);
    const rang = [reste[0]];
    let i = 1;
    while (i < reste.length && pire([...rang, reste[i]], cote) <= pire(rang, cote)) rang.push(reste[i++]);
    const s = rang.reduce((t, r) => t + r.a, 0);
    if (w >= h) {
      const rw = s / h;
      let yy = y;
      for (const r of rang) {
        const rh = r.a / rw;
        res.push({ ...r.e, x, y: yy, w: rw, h: rh });
        yy += rh;
      }
      x += rw;
      w -= rw;
    } else {
      const rh = s / w;
      let xx = x;
      for (const r of rang) {
        const rw = r.a / rh;
        res.push({ ...r.e, x: xx, y, w: rw, h: rh });
        xx += rw;
      }
      y += rh;
      h -= rh;
    }
    reste = reste.slice(i);
  }
  return res;
}

export function MosaiqueMentions({
  liste,
  donnees,
  ouvrir,
  survol,
}: {
  liste: PersonneStat[];
  donnees: DonneesStatistiques;
  ouvrir: Ouvrir;
  survol: (contenu: React.ReactNode) => Record<string, unknown>;
}) {
  const { ref, largeur } = useLargeur<HTMLDivElement>();
  const avecFormation = liste.filter((p) => p.formations.length > 0);
  const nonClassees = avecFormation.filter((p) => p.formations.some((f) => !f.mentionId || !donnees.mentions[f.mentionId])).length;

  const familles = donnees.familles
    .map((F) => {
      const mentions = compterPersonnes(avecFormation, (p) => p.formations.map((f) => (f.mentionId && donnees.mentions[f.mentionId]?.familleId === F.id ? f.mentionId : null)));
      return { ...F, cle: F.id, v: mentions.reduce((s, [, n]) => s + n, 0), mentions: mentions.map(([cle, v]) => ({ cle, v })) };
    })
    .filter((F) => F.v > 0)
    .sort((a, b) => b.v - a.v);

  if (familles.length === 0) return <p className="text-sm text-ink-soft">Aucune mention renseignée pour cette sélection.</p>;

  const ouvrirMention = (id: string) => {
    const m = donnees.mentions[id];
    const ps = avecFormation.filter((p) => p.formations.some((f) => f.mentionId === id));
    ouvrir({
      surtitre: `Mention · ${donnees.familles.find((F) => F.id === m.familleId)?.libelle ?? ""}`,
      titre: m.libelle,
      personnes: ps,
      formation: (p) => p.formations.find((f) => f.mentionId === id),
      filtre: {
        libelle: "Filtrer par établissement",
        valeurs: (p) => p.formations.filter((f) => f.mentionId === id).map((f) => f.etablissement),
        options: compterPersonnes(ps, (p) => p.formations.filter((f) => f.mentionId === id).map((f) => f.etablissement)),
      },
    });
  };
  const bulle = (id: string, n: number, famille: string) => (
    <>
      <b className="block text-sm">{donnees.mentions[id].libelle}</b>
      {personnes(n)}
      <br />
      <span className="text-bordeaux-200">{famille} · cliquer pour la liste</span>
    </>
  );
  const max = Math.max(...familles.flatMap((F) => F.mentions.map((m) => m.v)));

  // Mosaïque : d'abord les grands domaines, puis leurs mentions à l'intérieur.
  const H = largeur < 700 ? 520 : 460;
  const G = 3;
  const blocs = largeur ? squarifier(familles, 0, 0, largeur, H) : [];

  return (
    <div>
      <div ref={ref} className="relative hidden md:block" style={{ height: H }}>
        {blocs.map((F) => {
          const entete = F.h > 70 && F.w > 90 ? 20 : 0;
          const cases = squarifier(F.mentions, 0, entete, F.w - G, F.h - G - entete);
          return (
            <div key={F.id} className="absolute overflow-hidden rounded-[4px]" style={{ left: F.x + G / 2, top: F.y + G / 2, width: F.w - G, height: F.h - G }}>
              {entete > 0 && (
                <span className="absolute inset-x-2 top-0.5 truncate text-[11px] font-bold uppercase leading-4 tracking-[0.1em] text-ink-soft">
                  {F.libelle} · {F.v}
                </span>
              )}
              {cases.map((c) => {
                // Petites cases : le nom ne tient pas (il reste dans l'infobulle et pour les lecteurs d'écran).
                const mini = c.w < 110 || c.h < 62;
                const chiffreSeul = c.w < 80 || c.h < 56;
                const nu = c.w < 30 || c.h < 26;
                return (
                  <button
                    key={c.cle}
                    type="button"
                    onClick={() => ouvrirMention(c.cle)}
                    aria-label={`${donnees.mentions[c.cle].libelle} (${F.libelle}) : ${personnes(c.v)}`}
                    className="absolute flex flex-col justify-between overflow-hidden rounded-[3px] p-2 text-left transition-[filter] hover:brightness-110 focus-visible:brightness-110"
                    style={{ left: c.x + 1, top: c.y + 1, width: c.w - 2, height: c.h - 2, background: F.fond, color: F.texte }}
                    {...survol(bulle(c.cle, c.v, F.libelle))}
                  >
                    {!nu && (
                      <>
                        {!chiffreSeul && (
                          <span className={`font-semibold leading-tight ${mini ? "line-clamp-2 text-xs" : "line-clamp-3 text-sm"}`}>{donnees.mentions[c.cle].libelle}</span>
                        )}
                        <span className={`mt-auto font-impact leading-none ${mini ? "text-lg" : "text-[26px]"}`}>{c.v}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Petit écran : liste groupée par grand domaine */}
      <div className="space-y-5 md:hidden">
        {familles.map((F) => (
          <div key={F.id}>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">
              <span aria-hidden className="size-3 rounded-[3px] ring-1 ring-bordeaux-700/25" style={{ background: F.fond }} />
              {F.libelle} · {F.v}
            </h3>
            <ul className="mt-1 space-y-0.5">
              {F.mentions.map((m) => (
                <li key={m.cle}>
                  <button
                    type="button"
                    onClick={() => ouvrirMention(m.cle)}
                    aria-label={`${donnees.mentions[m.cle].libelle} : ${personnes(m.v)}`}
                    className="grid w-full grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-1 rounded-abm-sm px-2 py-2 text-left hover:bg-bordeaux-100/70"
                  >
                    <span className="text-sm leading-tight">{donnees.mentions[m.cle].libelle}</span>
                    <span className="text-right font-semibold tabular-nums">{m.v}</span>
                    <span aria-hidden className="col-span-2 block h-2.5">
                      <span className="block h-full rounded-r-[4px] ring-1 ring-inset ring-bordeaux-700/20" style={{ width: `${(m.v / max) * 100}%`, background: F.fond }} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {nonClassees > 0 && (
        <p className="mt-3 text-xs text-ink-soft">
          {personnes(nonClassees)} {nonClassees > 1 ? "ont" : "a"} une formation dont la mention n’est pas encore classée par le bureau.
        </p>
      )}
    </div>
  );
}
