"use client";

// Liste des offres : filtres instantanés (recherche, type), tri, et fiche complète en fenêtre.
// Toute la carte est cliquable (le titre est un bouton étiré sur la carte).

import { ArrowRight, Building2, CalendarClock, ExternalLink, Mail, MapPin, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Fenetre } from "@/components/fenetre/fenetre";
import { CadreFiltres, ChampRecherche, NombreResultats, PastillesChoix, Tri, useFiltresDansAdresse } from "@/components/filtres-instantanes";
import { BlocDate, Pastille, Vide, buttonClasses, classeLien } from "@/components/ui";
import { correspond, dateCourte } from "@/lib/format";

export type OffreCarte = {
  id: string;
  titre: string;
  type: string;
  typeLibelle: string;
  organisation: string;
  lieu: string | null;
  description: string;
  lien: string | null;
  contact: string | null;
  dateLimite: number | null;
  publieeLe: number | null;
  /** Jours avant la date limite (calculé par le serveur) ; null sans date limite. */
  joursRestants: number | null;
  proposePar: string | null;
};

type Filtres = { q: string; type: string; tri: string };

const TRIS = [
  { valeur: "recent", libelle: "Plus récentes" },
  { valeur: "limite", libelle: "Clôture la plus proche" },
];

/** Contact cliquable : e-mail → lien mailto, adresse web → lien ; sinon texte simple. */
function Contact({ texte }: { texte: string }) {
  const email = texte.match(/[^\s<>()]+@[^\s<>()]+\.[a-z]{2,}/i)?.[0];
  if (email) {
    return (
      <a href={`mailto:${email}`} className={classeLien}>
        {texte}
      </a>
    );
  }
  if (/^https?:\/\//.test(texte.trim())) {
    return (
      <a href={texte.trim()} target="_blank" rel="noopener noreferrer" className={classeLien}>
        {texte}
      </a>
    );
  }
  return <>{texte}</>;
}

function Cloture({ jours }: { jours: number | null }) {
  if (jours === null || jours > 7) return null;
  const texte = jours <= 0 ? "Clôture aujourd’hui" : jours === 1 ? "Clôture demain" : `Clôture dans ${jours} jours`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-abm-pill bg-bordeaux-100 px-2.5 py-0.5 text-xs font-semibold text-bordeaux-800">
      <span aria-hidden className="size-1.5 rounded-full bg-bordeaux-500" />
      {texte}
    </span>
  );
}

export function OffresInteractives({
  offres,
  types,
  initial,
  aside,
}: {
  offres: OffreCarte[];
  types: { valeur: string; libelle: string }[];
  initial: Filtres;
  aside: React.ReactNode;
}) {
  const [f, setF] = useState<Filtres>(initial);
  const maj = (partiel: Partial<Filtres>) => setF((avant) => ({ ...avant, ...partiel }));
  useFiltresDansAdresse({ q: f.q, type: f.type, tri: f.tri }, { tri: "recent" });
  const [ouverte, setOuverte] = useState<OffreCarte | null>(null);

  const resultats = useMemo(() => {
    const r = offres.filter((o) => (!f.type || o.type === f.type) && correspond(f.q, [o.titre, o.organisation, o.lieu, o.description, o.typeLibelle]));
    if (f.tri === "limite") return [...r].sort((a, b) => (a.dateLimite ?? Infinity) - (b.dateLimite ?? Infinity));
    return r;
  }, [offres, f]);

  const actifs = !!(f.q || f.type);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="space-y-6">
        <CadreFiltres
          label="Rechercher une offre"
          pied={
            <>
              <NombreResultats nombre={resultats.length} singulier="offre" pluriel="offres" actifs={actifs} onEffacer={() => maj({ q: "", type: "" })} />
              <Tri options={TRIS} valeur={f.tri} onChange={(tri) => maj({ tri })} />
            </>
          }
        >
          <ChampRecherche valeur={f.q} onChange={(q) => maj({ q })} label="Rechercher une offre" placeholder="Intitulé, structure, ville…" />
          <PastillesChoix
            label="Type d’offre"
            valeur={f.type}
            onChange={(type) => maj({ type })}
            options={[
              { valeur: "", libelle: "Toutes", nombre: offres.length },
              ...types.map((t) => ({ ...t, nombre: offres.filter((o) => o.type === t.valeur).length })).filter((t) => t.nombre > 0),
            ]}
          />
        </CadreFiltres>

        {resultats.length === 0 ? (
          <div className="rounded-abm-lg border border-dashed border-bordeaux-300 bg-white">
            <Vide>
              {offres.length === 0
                ? "Aucune offre en cours pour le moment. Vous connaissez une opportunité ? Proposez-la au réseau."
                : "Aucune offre ne correspond à cette recherche."}
            </Vide>
            <div className="-mt-4 flex flex-wrap justify-center gap-3 pb-8">
              {actifs && (
                <button type="button" onClick={() => maj({ q: "", type: "" })} className={buttonClasses("outline", "petit")}>
                  Effacer les filtres
                </button>
              )}
              <Link href="/espace/offres/proposer" className={buttonClasses("primary", "petit")}>
                <Plus size={14} aria-hidden /> Proposer une offre
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {resultats.map((o) => (
              <li key={o.id}>
                <article className="carte-premium group relative flex gap-4 rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:gap-5">
                  <BlocDate date={o.dateLimite ? new Date(o.dateLimite) : null} surtitre={o.dateLimite ? "avant le" : undefined} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pastille accent>{o.typeLibelle}</Pastille>
                      {o.publieeLe && <span className="text-xs text-ink-soft">Publiée le {dateCourte(new Date(o.publieeLe))}</span>}
                      <Cloture jours={o.joursRestants} />
                    </div>
                    <h2 className="mt-2 font-display text-xl font-bold leading-snug text-bordeaux-700">
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => setOuverte(o)}
                        className="text-left after:absolute after:inset-0 after:rounded-abm-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-bordeaux-700"
                      >
                        {o.titre}
                      </button>
                    </h2>
                    <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={14} aria-hidden /> {o.organisation}
                      </span>
                      {o.lieu && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} aria-hidden /> {o.lieu}
                        </span>
                      )}
                    </p>
                    <p className="mt-2.5 line-clamp-2 text-[15px]">{o.description}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
                      {o.proposePar && <span>Proposée par {o.proposePar}</span>}
                      <span className="ml-auto inline-flex items-center gap-1 font-semibold text-bordeaux-700">
                        Voir l’offre <ArrowRight size={14} aria-hidden className="fleche" />
                      </span>
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28">{aside}</aside>

      <Fenetre
        ouverte={!!ouverte}
        onFermer={() => setOuverte(null)}
        surtitre={ouverte && [ouverte.typeLibelle, ouverte.publieeLe && `publiée le ${dateCourte(new Date(ouverte.publieeLe))}`].filter(Boolean).join(" · ")}
        titre={ouverte?.titre}
        pied={
          ouverte?.lien ? (
            <a href={ouverte.lien} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
              <ExternalLink size={16} aria-hidden /> Voir l’annonce d’origine
            </a>
          ) : undefined
        }
      >
        {ouverte && (
          <div className="space-y-6">
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-2 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
                <Building2 size={16} aria-hidden className="shrink-0 text-bordeaux-700" /> {ouverte.organisation}
              </li>
              {ouverte.lieu && (
                <li className="flex items-center gap-2 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
                  <MapPin size={16} aria-hidden className="shrink-0 text-bordeaux-700" /> {ouverte.lieu}
                </li>
              )}
              <li className="flex items-center gap-2 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
                <CalendarClock size={16} aria-hidden className="shrink-0 text-bordeaux-700" />
                {ouverte.dateLimite ? (
                  <span className="font-semibold text-bordeaux-700">Candidater avant le {dateCourte(new Date(ouverte.dateLimite))}</span>
                ) : (
                  "Sans date limite"
                )}
              </li>
              {ouverte.contact && (
                <li className="flex min-w-0 items-center gap-2 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
                  <Mail size={16} aria-hidden className="shrink-0 text-bordeaux-700" />
                  <span className="min-w-0 break-words">
                    <Contact texte={ouverte.contact} />
                  </span>
                </li>
              )}
              {ouverte.proposePar && (
                <li className="flex items-center gap-2 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
                  <UserRound size={16} aria-hidden className="shrink-0 text-bordeaux-700" /> Proposée par {ouverte.proposePar}
                </li>
              )}
            </ul>
            <p className="whitespace-pre-line text-sm leading-relaxed">{ouverte.description}</p>
          </div>
        )}
      </Fenetre>
    </div>
  );
}
