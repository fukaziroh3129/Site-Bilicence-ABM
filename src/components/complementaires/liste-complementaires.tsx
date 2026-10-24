"use client";

// Page « Formations complémentaires » : liste des formations (titres identiques regroupés), filtrable
// par type et par recherche ; un clic ouvre le panneau latéral des personnes qui l'ont suivie, avec leur avis.

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ICONES_COMPLEMENTAIRE } from "@/components/complementaires/icones";
import { Fenetre } from "@/components/fenetre/fenetre";
import { CadreFiltres, ChampRecherche, PastillesChoix, useFiltresDansAdresse } from "@/components/filtres-instantanes";
import { Initiales, Panneau, Vide } from "@/components/ui";
import { LIBELLES_COMPLEMENTAIRE, type TypeComplementaire } from "@/lib/complementaires";
import { correspond } from "@/lib/format";

export type GroupeAffiche = {
  cle: string;
  titre: string;
  type: TypeComplementaire;
  organismes: string[];
  /** Part de cette formation dans toutes les formations complémentaires saisies, en %. */
  part: number;
  temoins: { id: string; personneId: string; prenom: string; nom: string; details: string; avis: string | null }[];
};

const personnes = (n: number) => `${n} personne${n > 1 ? "s" : ""}`;

export function ListeComplementaires({
  groupes,
  total,
  types,
  initiale,
}: {
  groupes: GroupeAffiche[];
  total: number;
  types: { valeur: string; libelle: string }[];
  /** Formation à ouvrir à l'arrivée (lien « N membres l'ont suivie » d'une fiche). */
  initiale: string;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [ouverte, setOuverte] = useState(initiale);
  useFiltresDansAdresse({ q, type, formation: ouverte });

  const visibles = groupes.filter(
    (g) => (!type || g.type === type) && correspond(q, [g.titre, ...g.organismes, ...g.temoins.flatMap((t) => [t.prenom, t.nom])]),
  );
  const options = useMemo(
    () => [
      { valeur: "", libelle: "Tout", nombre: total },
      ...types
        .map((t) => ({ ...t, nombre: groupes.filter((g) => g.type === t.valeur).reduce((n, g) => n + g.temoins.length, 0) }))
        .filter((t) => t.nombre > 0),
    ],
    [groupes, types, total],
  );
  const max = Math.max(1, ...groupes.map((g) => g.temoins.length));
  const groupe = groupes.find((g) => g.cle === ouverte) ?? null;

  if (groupes.length === 0) {
    return (
      <Vide>
        Aucune formation complémentaire pour l’instant. Ajoutez les vôtres (DU, certification, MOOC…) dans « Ma fiche », étape « Études ».
      </Vide>
    );
  }

  return (
    <>
      <CadreFiltres
        label="Filtrer les formations"
        pied={
          <span aria-live="polite">
            {visibles.length} formation{visibles.length > 1 ? "s" : ""} sur {groupes.length}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <ChampRecherche valeur={q} onChange={setQ} placeholder="Rechercher une formation, un organisme, une personne…" label="Rechercher" />
          <PastillesChoix options={options} valeur={type} onChange={setType} label="Type de formation" />
        </div>
      </CadreFiltres>

      <Panneau
        titre="Les formations"
        corps={false}
        action={<span className="text-sm text-ink-soft">Le pourcentage : part dans toutes les formations complémentaires saisies</span>}
      >
        {visibles.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-soft">Aucune formation ne correspond à ces critères.</p>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {visibles.map((g) => {
              const Icone = ICONES_COMPLEMENTAIRE[g.type];
              const n = g.temoins.length;
              return (
                <li key={g.cle}>
                  <button
                    type="button"
                    onClick={() => setOuverte(g.cle)}
                    className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-bordeaux-100/40 focus-visible:bg-bordeaux-100/40"
                  >
                    <span aria-hidden className="row-span-2 grid size-10 place-items-center rounded-abm-sm bg-bordeaux-100 text-bordeaux-700">
                      <Icone size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug text-ink group-hover:text-bordeaux-700">{g.titre}</span>
                      <span className="block text-[13.5px] text-ink-soft">
                        {[LIBELLES_COMPLEMENTAIRE[g.type].un, g.organismes.slice(0, 2).join(", ") + (g.organismes.length > 2 ? "…" : ""), personnes(n)].join(" · ")}
                      </span>
                    </span>
                    <span className="row-span-2 flex items-center gap-3 text-right">
                      <span>
                        <span className="block font-impact text-3xl leading-none text-bordeaux-700 tabular-nums">{g.part} %</span>
                        <span className="hidden text-[11.5px] text-ink-soft sm:block">des formations compl.</span>
                      </span>
                      <ChevronRight size={18} aria-hidden className="hidden shrink-0 text-bordeaux-400 sm:block" />
                    </span>
                    <span aria-hidden className="col-start-2 h-1.5 overflow-hidden rounded-abm-pill bg-bordeaux-100">
                      <span className="block h-full rounded-abm-pill bg-bordeaux-700" style={{ width: `${(n / max) * 100}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panneau>
      <p className="text-xs text-ink-soft">
        Les formations de même titre sont regroupées (majuscules, accents et ponctuation ignorés). Réservé aux membres connectés.
      </p>

      <Fenetre
        ouverte={!!groupe}
        onFermer={() => setOuverte("")}
        laterale
        surtitre={groupe && LIBELLES_COMPLEMENTAIRE[groupe.type].un}
        titre={groupe?.titre ?? ""}
        pied={<p className="text-xs text-ink-soft">Chaque nom ouvre la fiche de la personne dans l’annuaire.</p>}
      >
        {groupe && <Temoins key={groupe.cle} groupe={groupe} />}
      </Fenetre>
    </>
  );
}

function Temoins({ groupe }: { groupe: GroupeAffiche }) {
  const n = groupe.temoins.length;
  const avecAvis = groupe.temoins.filter((t) => t.avis).length;
  // Les avis d'abord.
  const tries = [...groupe.temoins].sort((a, b) => Number(!!b.avis) - Number(!!a.avis));
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">{groupe.organismes.join(" · ")}</p>
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        {[
          [String(n), n > 1 ? "personnes" : "personne"],
          [`${groupe.part} %`, "des formations compl."],
          [String(avecAvis), "avis"],
        ].map(([chiffre, libelle]) => (
          <div key={libelle} className="border-l-2 border-bordeaux-200 pl-3">
            <dt className="sr-only">{libelle}</dt>
            <dd className="font-impact text-2xl leading-none text-bordeaux-700 tabular-nums">{chiffre}</dd>
            <dd className="text-xs text-ink-soft">{libelle}</dd>
          </div>
        ))}
      </dl>
      <ul className="space-y-3">
        {tries.map((t) => (
          <li key={t.id} className="rounded-abm-md border border-bordeaux-700/12 bg-white p-4">
            <Link href={`/espace/annuaire/${t.personneId}#${t.id}`} className="group flex items-center gap-3">
              <Initiales prenom={t.prenom} nom={t.nom} taille="petit" />
              <span className="min-w-0">
                <span className="block font-semibold text-ink underline-offset-4 group-hover:text-bordeaux-700 group-hover:underline">
                  {t.prenom} {t.nom}
                </span>
                <span className="block text-[13px] text-ink-soft">{t.details}</span>
              </span>
            </Link>
            {t.avis ? (
              <blockquote className="relative mt-3 whitespace-pre-line rounded-abm-sm bg-beige-papier py-3 pl-10 pr-4 font-display text-[15px] italic leading-relaxed text-bordeaux-700">
                <span aria-hidden className="absolute left-3 top-0 font-display text-4xl not-italic leading-none text-bordeaux-300">
                  “
                </span>
                {t.avis}
              </blockquote>
            ) : (
              <p className="mt-2 text-[13px] italic text-ink-soft">Pas d’avis rédigé.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
