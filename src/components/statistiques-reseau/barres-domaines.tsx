"use client";

// « Les domaines professionnels » : pour chaque domaine, ceux qui y travaillent (en poste, en
// alternance) et ceux qui le visent (étudiants…). Un clic liste ces personnes, avec ce qu'elles ont
// étudié : un étudiant attiré par l'action locale trouve qui y travaille, et par quelle formation.

import { useState } from "react";
import { compterPersonnes, personnes, type DonneesStatistiques, type Ouvrir, type PersonneStat } from "./outils";

const VISIBLES = 12;

export function BarresDomaines({
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
  const [tout, setTout] = useState(false);
  const lignes = donnees.domaines
    .map((d) => {
      const ps = liste.filter((p) => p.domaines.includes(d.code));
      return { d, ps, travaillent: ps.filter((p) => p.travaille).length, visent: ps.filter((p) => !p.travaille).length };
    })
    .filter((l) => l.ps.length > 0)
    .sort((a, b) => b.ps.length - a.ps.length || a.d.libelle.localeCompare(b.d.libelle, "fr"));
  const sans = liste.filter((p) => p.domaines.length === 0).length;

  if (lignes.length === 0)
    return (
      <p className="text-sm text-ink-soft">
        Aucun domaine renseigné pour cette sélection. Chacun peut indiquer le sien dans « Ma fiche », étape « Aujourd’hui ».
      </p>
    );

  const max = lignes[0].ps.length;
  const visibles = tout ? lignes : lignes.slice(0, VISIBLES);
  const etudes = (ps: PersonneStat[]) =>
    compterPersonnes(ps, (p) => p.formations.map((f) => f.mentionId))
      .slice(0, 3)
      .map(([id]) => donnees.mentions[id]?.libelle)
      .filter(Boolean)
      .join(" · ");

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-[3px] bg-bordeaux-700" /> Y travaillent
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-[3px] bg-bordeaux-200 ring-1 ring-inset ring-bordeaux-700/30" /> Le visent (étudiants, en recherche…)
        </span>
      </div>
      <ul className="space-y-0.5">
        {visibles.map(({ d, ps, travaillent, visent }) => (
          <li key={d.code}>
            <button
              type="button"
              aria-label={`${d.libelle} : ${travaillent} y travaillent, ${visent} le visent`}
              onClick={() =>
                ouvrir({
                  surtitre: "Domaine professionnel",
                  titre: d.libelle,
                  personnes: ps,
                  tri: (a, b) => Number(b.travaille) - Number(a.travaille) || b.promo - a.promo,
                  etiquette: (p) => (p.travaille ? "Y travaille" : "Le vise"),
                  filtre: {
                    libelle: "Ce qu’ils ont étudié (mention)",
                    valeurs: (p) => p.formations.map((f) => f.mentionId).filter((v): v is string => !!v),
                    options: compterPersonnes(ps, (p) => p.formations.map((f) => f.mentionId)),
                    nom: (id) => donnees.mentions[id]?.libelle ?? "Mention à classer",
                  },
                })
              }
              className="grid w-full grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-1 rounded-abm-sm px-2 py-2 text-left transition-colors hover:bg-bordeaux-100/70 focus-visible:bg-bordeaux-100/70"
              {...survol(
                <>
                  <b className="block text-sm">{d.libelle}</b>
                  {travaillent} y travaillent · {visent} le visent
                  {etudes(ps) && (
                    <>
                      <br />
                      <span className="text-bordeaux-200">Études : {etudes(ps)}</span>
                    </>
                  )}
                </>,
              )}
            >
              <span className="text-sm leading-tight">{d.libelle}</span>
              <span className="text-right font-semibold tabular-nums">{ps.length}</span>
              <span aria-hidden className="col-span-2 flex h-3 gap-[2px]">
                {travaillent > 0 && <span className="block h-full bg-bordeaux-700" style={{ width: `${(travaillent / max) * 100}%`, borderRadius: visent ? 0 : "0 4px 4px 0" }} />}
                {visent > 0 && <span className="block h-full rounded-r-[4px] bg-bordeaux-200 ring-1 ring-inset ring-bordeaux-700/30" style={{ width: `${(visent / max) * 100}%` }} />}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {lignes.length > VISIBLES && (
        <button type="button" onClick={() => setTout(!tout)} className="mt-2 text-sm font-semibold text-bordeaux-700 underline underline-offset-4">
          {tout ? "Afficher moins" : `Voir les ${lignes.length - VISIBLES} autres domaines`}
        </button>
      )}
      <p className="mt-3 text-xs text-ink-soft">
        Chacun choisit jusqu’à 3 domaines : celui où il travaille ou, s’il étudie encore, celui qu’il vise.
        {sans > 0 && ` ${personnes(sans)} n’en ${sans > 1 ? "ont" : "a"} pas encore choisi.`}
      </p>
    </div>
  );
}
