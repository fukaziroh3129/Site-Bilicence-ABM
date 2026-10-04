"use client";

// Annuaire des membres : filtres instantanés (recherche, promotion, domaine, « joignables »),
// tri, et regroupement par promotion. Les fiches sont chargées par la page (serveur) ;
// le filtrage se fait ici, dans le navigateur, avec la même recherche sans accents que le reste du site.

import { ArrowRight, BriefcaseBusiness, Globe, Mail, MapPin, Phone, SquareUser } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bascule,
  CadreFiltres,
  ChampRecherche,
  ListeChoix,
  NombreResultats,
  PastillesChoix,
  Tri,
  useFiltresDansAdresse,
} from "@/components/filtres-instantanes";
import { Initiales, Pastille, Vide, buttonClasses } from "@/components/ui";
import { correspond, libellePromo } from "@/lib/format";

export type PersonneAnnuaire = {
  id: string;
  prenom: string;
  nom: string;
  promo: number;
  statut: string | null;
  /** Statut « en poste » ou « en alternance » : pastille pleine. */
  statutFort: boolean;
  situation: string | null;
  ville: string | null;
  domaines: string[];
  /** Domaines de ses expériences (le filtre « Domaine » les prend aussi en compte). */
  domainesExperiences: string[];
  formation: { intitule: string; etablissement: string; enCours: boolean } | null;
  contacts: ("email" | "telephone" | "linkedin")[];
  stages: number;
  erasmus: boolean;
  modifieLe: number;
  /** Tous les textes sur lesquels porte la recherche. */
  texte: string;
};

export type DomaineAnnuaire = { code: string; libelle: string; court: string };

type Filtres = { q: string; promo: string; domaine: string; joignable: boolean; tri: string };

const TRIS = [
  { valeur: "promo", libelle: "Promotion" },
  { valeur: "nom", libelle: "Nom" },
  { valeur: "maj", libelle: "Fiches mises à jour récemment" },
];

const VIDES: Omit<Filtres, "tri"> = { q: "", promo: "", domaine: "", joignable: false };

export function AnnuaireInteractif({
  personnes,
  domaines,
  initial,
}: {
  personnes: PersonneAnnuaire[];
  domaines: DomaineAnnuaire[];
  initial: Filtres;
}) {
  const [f, setF] = useState<Filtres>(initial);
  const maj = (partiel: Partial<Filtres>) => setF((avant) => ({ ...avant, ...partiel }));
  useFiltresDansAdresse({ q: f.q, promo: f.promo, secteur: f.domaine, joignable: f.joignable, tri: f.tri }, { tri: "promo" });

  const parCode = useMemo(() => new Map(domaines.map((d) => [d.code, d])), [domaines]);

  // Promotions qui ont au moins une fiche, avec leur effectif.
  const promos = useMemo(() => {
    const compte = new Map<number, number>();
    for (const p of personnes) compte.set(p.promo, (compte.get(p.promo) ?? 0) + 1);
    return [...compte.entries()].sort((a, b) => a[0] - b[0]);
  }, [personnes]);

  const resultats = useMemo(() => {
    const r = personnes.filter(
      (p) =>
        (!f.promo || p.promo === Number(f.promo)) &&
        (!f.domaine || p.domaines.includes(f.domaine) || p.domainesExperiences.includes(f.domaine)) &&
        (!f.joignable || p.contacts.length > 0) &&
        correspond(f.q, [p.texte]),
    );
    const parNom = (a: PersonneAnnuaire, b: PersonneAnnuaire) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr");
    if (f.tri === "nom") return r.sort(parNom);
    if (f.tri === "maj") return r.sort((a, b) => b.modifieLe - a.modifieLe);
    return r.sort((a, b) => a.promo - b.promo || parNom(a, b));
  }, [personnes, f]);

  const actifs = !!(f.q || f.promo || f.domaine || f.joignable);
  const effacer = () => maj(VIDES);

  // Regroupement par promotion (tri « Promotion » seulement).
  const groupes = useMemo(() => {
    if (f.tri !== "promo") return [{ promo: null as number | null, personnes: resultats }];
    const g: { promo: number | null; personnes: PersonneAnnuaire[] }[] = [];
    for (const p of resultats) {
      if (g.at(-1)?.promo !== p.promo) g.push({ promo: p.promo, personnes: [] });
      g.at(-1)!.personnes.push(p);
    }
    return g;
  }, [resultats, f.tri]);

  return (
    <div className="space-y-8">
      <CadreFiltres
        label="Rechercher dans l’annuaire"
        pied={
          <>
            <NombreResultats nombre={resultats.length} singulier="personne" pluriel="personnes" actifs={actifs} onEffacer={effacer} />
            <Tri options={TRIS} valeur={f.tri} onChange={(tri) => maj({ tri })} />
          </>
        }
      >
        <div className="flex flex-wrap gap-3">
          <ChampRecherche
            valeur={f.q}
            onChange={(q) => maj({ q })}
            label="Rechercher une personne"
            placeholder="Ex. Lyon, Sciences Po, conseil, Bologne…"
          />
          <ListeChoix
            label="Domaine"
            tous="Tous les domaines"
            valeur={f.domaine}
            onChange={(domaine) => maj({ domaine })}
            options={domaines.map((d) => ({ valeur: d.code, libelle: d.libelle }))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PastillesChoix
            label="Promotion"
            valeur={f.promo}
            onChange={(promo) => maj({ promo })}
            options={[
              { valeur: "", libelle: "Toutes", nombre: personnes.length },
              ...promos.map(([a, n]) => ({ valeur: String(a), libelle: libellePromo(a), nombre: n })),
            ]}
          />
          <Bascule coche={f.joignable} onChange={(joignable) => maj({ joignable })} libelle="Joignables uniquement" />
        </div>
      </CadreFiltres>

      {resultats.length === 0 ? (
        <div className="rounded-abm-lg border border-dashed border-bordeaux-300 bg-white">
          <Vide>
            Aucune personne ne correspond. La recherche porte sur les noms, villes, postes, structures, formations, domaines et
            universités Erasmus.
          </Vide>
          <div className="-mt-4 pb-8 text-center">
            <button type="button" onClick={effacer} className={buttonClasses("outline", "petit")}>
              Effacer les filtres
            </button>
          </div>
        </div>
      ) : (
        groupes.map((g) => (
          <section key={g.promo ?? "tous"} aria-labelledby={g.promo ? `promo-${g.promo}` : undefined}>
            {g.promo && (
              <div className="sticky top-[72px] z-10 -mx-1 mb-4 flex items-baseline gap-3 border-b border-bordeaux-700/15 bg-paper px-1 pb-2 pt-3">
                <h2 id={`promo-${g.promo}`} className="font-display text-xl font-bold text-bordeaux-700">
                  Promotion {libellePromo(g.promo)}
                </h2>
                <span className="text-sm text-ink-soft">
                  {g.personnes.length} personne{g.personnes.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {g.personnes.map((p) => (
                <li key={p.id}>
                  <Carte p={p} parCode={parCode} domaineFiltre={f.domaine} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

const ICONES_CONTACT = { email: Mail, linkedin: SquareUser, telephone: Phone } as const;
const LIBELLES_CONTACT = { email: "e-mail", linkedin: "LinkedIn", telephone: "téléphone" } as const;

function Carte({ p, parCode, domaineFiltre }: { p: PersonneAnnuaire; parCode: Map<string, DomaineAnnuaire>; domaineFiltre: string }) {
  // Le domaine qui a fait ressortir la personne est toujours visible, même s'il vient d'une expérience.
  const viaExperience = domaineFiltre && !p.domaines.includes(domaineFiltre) && p.domainesExperiences.includes(domaineFiltre);
  return (
    <Link
      href={`/espace/annuaire/${p.id}`}
      className="carte-premium group flex h-full flex-col rounded-abm-lg border border-bordeaux-700/15 bg-white px-5 pt-5 shadow-abm-card"
    >
      <div className="flex items-start gap-4">
        <Initiales prenom={p.prenom} nom={p.nom} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-xl font-bold leading-tight text-bordeaux-700">
              {p.prenom} {p.nom}
            </p>
            {p.statut && (
              <span className="shrink-0">
                <Pastille accent={p.statutFort}>{p.statut}</Pastille>
              </span>
            )}
          </div>
          {p.situation && <p className="mt-1 text-[15px] text-ink">{p.situation}</p>}
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-soft">
            {p.ville && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} aria-hidden /> {p.ville}
              </span>
            )}
            <span>Promotion {libellePromo(p.promo)}</span>
          </p>
        </div>
      </div>

      {p.formation && (
        <p className="mt-3 text-sm text-ink-soft">
          {p.formation.intitule} — {p.formation.etablissement}
          {p.formation.enCours && <span className="font-semibold text-bordeaux-600"> · en cours</span>}
        </p>
      )}

      {(p.domaines.length > 0 || viaExperience) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.domaines.map((code) => (
            <span key={code} title={parCode.get(code)?.libelle}>
              <Pastille>{parCode.get(code)?.court ?? code}</Pastille>
            </span>
          ))}
          {viaExperience && (
            <span
              title="Domaine d’une de ses expériences"
              className="inline-block rounded-abm-pill border border-dashed border-bordeaux-700/40 px-2.5 py-0.5 text-xs font-semibold text-bordeaux-700"
            >
              {parCode.get(domaineFiltre)?.court ?? domaineFiltre} · expérience
            </span>
          )}
        </div>
      )}

      <div aria-hidden className="min-h-4 flex-1" />
      <div className="flex items-center gap-4 border-t border-bordeaux-700/10 pb-3 pt-3 text-[13px] text-ink-soft">
        {p.contacts.length > 0 ? (
          <span className="inline-flex items-center gap-1.5" title="Coordonnées visibles des membres">
            {p.contacts.map((c) => {
              const Icone = ICONES_CONTACT[c];
              return <Icone key={c} size={15} aria-hidden className="text-bordeaux-700" />;
            })}
            <span className="sr-only">Joignable par {p.contacts.map((c) => LIBELLES_CONTACT[c]).join(", ")}</span>
          </span>
        ) : (
          <span className="opacity-80">Pas de contact visible</span>
        )}
        {p.stages > 0 && (
          <span className="inline-flex items-center gap-1">
            <BriefcaseBusiness size={14} aria-hidden /> {p.stages} stage{p.stages > 1 ? "s" : ""}
          </span>
        )}
        {p.erasmus && (
          <span className="inline-flex items-center gap-1">
            <Globe size={14} aria-hidden /> Erasmus
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-bordeaux-700">
          Voir la fiche <ArrowRight size={14} aria-hidden className="fleche" />
        </span>
      </div>
    </Link>
  );
}
