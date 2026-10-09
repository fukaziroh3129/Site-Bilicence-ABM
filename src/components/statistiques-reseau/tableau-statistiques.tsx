"use client";

// Page « Statistiques » (variante B validée le 8 octobre 2026) : chiffres clés, établissements en
// tête (double anneau + liste), puis onglets Mentions / Domaines professionnels / Par promotion. Un
// filtre de promotion s'applique à tout ; chaque élément cliqué ouvre la liste des personnes.

import { useState } from "react";
import { PastillesChoix, useFiltresDansAdresse } from "@/components/filtres-instantanes";
import { BandeauEspace, Panneau } from "@/components/ui";
import { AnneauEtablissements } from "./anneau-etablissements";
import { BarresDomaines } from "./barres-domaines";
import { MosaiqueMentions } from "./mosaique-mentions";
import { ParPromotion } from "./par-promotion";
import { PanneauPersonnes } from "./panneau-personnes";
import { useBulle, type DonneesStatistiques, type ListePanneau } from "./outils";

const ONGLETS = [
  { cle: "mentions", libelle: "Mentions", phrase: "Les mentions de master, regroupées par grand domaine d’études. Surface = nombre de personnes." },
  { cle: "domaines", libelle: "Domaines professionnels", phrase: "Le domaine où chacun travaille, ou celui qu’il vise s’il étudie encore. Cliquez pour trouver quelqu’un et voir ce qu’il a étudié." },
  { cle: "promotions", libelle: "Par promotion", phrase: "Ce que fait chaque promotion : dernière formation suivie, ou situation actuelle." },
] as const;
type Onglet = (typeof ONGLETS)[number]["cle"];

export function TableauStatistiques({ donnees, promoInitiale, ongletInitial }: { donnees: DonneesStatistiques; promoInitiale: string; ongletInitial: string }) {
  const promos = [...new Set(donnees.personnes.map((p) => p.promo))].sort((a, b) => b - a);
  const [promo, setPromo] = useState(promos.map(String).includes(promoInitiale) ? promoInitiale : "");
  const [onglet, setOnglet] = useState<Onglet>(ONGLETS.some((o) => o.cle === ongletInitial) ? (ongletInitial as Onglet) : "mentions");
  const [panneau, setPanneau] = useState<ListePanneau | null>(null);
  const { bulle, survol, cacher } = useBulle();
  useFiltresDansAdresse({ promo, onglet }, { onglet: "mentions" });

  const liste = promo ? donnees.personnes.filter((p) => String(p.promo) === promo) : donnees.personnes;
  const ouvrir = (l: ListePanneau) => {
    cacher();
    setPanneau(l);
  };

  // Chiffres clés
  const avecFormation = liste.filter((p) => p.formations.length > 0);
  // Parmi les diplômés (hors étudiants encore en bi-licence) : part qui a renseigné une poursuite d'études.
  const diplomes = liste.filter((p) => !p.enLicence);
  const partMaster = diplomes.length ? Math.round((diplomes.filter((p) => p.formations.length > 0).length / diplomes.length) * 100) : null;
  const nbEtablissements = new Set(avecFormation.flatMap((p) => p.formations.map((f) => f.cleEtablissement))).size;
  const nbMentions = new Set(avecFormation.flatMap((p) => p.formations.map((f) => f.mentionId).filter(Boolean))).size;
  const chiffres = [
    { v: String(liste.length), l: "fiches dans le réseau" },
    { v: partMaster === null ? "—" : `${partMaster} %`, l: "des diplômés ont une poursuite d’études renseignée" },
    { v: String(nbEtablissements), l: "établissements fréquentés" },
    { v: String(nbMentions), l: "mentions de master différentes" },
  ];
  const ongletCourant = ONGLETS.find((o) => o.cle === onglet)!;

  return (
    <div className="space-y-6">
      <BandeauEspace
        titre="Où mène la bi-licence ?"
        phrase="Les poursuites d’études et les métiers des anciens, d’après leurs fiches. Cliquez sur un élément pour voir qui l’a choisi et ouvrir sa fiche."
      >
        <dl className="relative mt-6 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          {chiffres.map((c) => (
            <div key={c.l} className="border-l border-white/30 pl-4">
              <dt className="sr-only">{c.l}</dt>
              <dd className="font-impact text-4xl leading-none tabular-nums sm:text-[44px]">{c.v}</dd>
              <dd aria-hidden className="mt-1 text-sm leading-snug text-white/80">
                {c.l}
              </dd>
            </div>
          ))}
        </dl>
      </BandeauEspace>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-abm-lg border border-bordeaux-700/15 bg-white px-4 py-3 shadow-abm-card">
        <span className="eyebrow text-ink-soft">Promotion</span>
        <PastillesChoix
          label="Filtrer par promotion"
          valeur={promo}
          onChange={setPromo}
          options={[{ valeur: "", libelle: "Toutes" }, ...promos.map((a) => ({ valeur: String(a), libelle: donnees.personnes.find((p) => p.promo === a)!.libellePromo }))]}
        />
      </div>

      <Panneau titre="Les établissements">
        <p className="-mt-1 mb-5 max-w-[75ch] text-sm text-ink-soft">
          Anneau intérieur : le type d’établissement (un clic filtre la liste). Anneau extérieur : chaque établissement (un clic
          ouvre la liste des personnes qui y ont étudié).
        </p>
        <AnneauEtablissements liste={liste} ouvrir={ouvrir} survol={survol} mentions={donnees.mentions} />
      </Panneau>

      <section className="rounded-abm-lg border border-bordeaux-700/15 bg-white shadow-abm-card">
        <div role="tablist" aria-label="Statistiques détaillées" className="flex gap-1 overflow-x-auto border-b border-bordeaux-700/15 px-3 [scrollbar-width:none]">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              id={`onglet-${o.cle}`}
              type="button"
              role="tab"
              aria-selected={onglet === o.cle}
              aria-controls="panneau-onglet"
              tabIndex={onglet === o.cle ? 0 : -1}
              onClick={() => setOnglet(o.cle)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                const i = ONGLETS.findIndex((x) => x.cle === onglet);
                const suivant = ONGLETS[(i + (e.key === "ArrowRight" ? 1 : ONGLETS.length - 1)) % ONGLETS.length];
                setOnglet(suivant.cle);
                document.getElementById(`onglet-${suivant.cle}`)?.focus();
              }}
              className="whitespace-nowrap border-b-2 border-transparent px-3 pb-3 pt-4 text-[15px] font-semibold text-ink-soft transition-colors hover:text-bordeaux-700 aria-selected:border-bordeaux-700 aria-selected:text-bordeaux-700"
            >
              {o.libelle}
            </button>
          ))}
        </div>
        <div id="panneau-onglet" role="tabpanel" aria-labelledby={`onglet-${onglet}`} className="p-5 sm:p-6">
          <p className="mb-5 max-w-[75ch] text-sm text-ink-soft">{ongletCourant.phrase}</p>
          {onglet === "mentions" && <MosaiqueMentions liste={liste} donnees={donnees} ouvrir={ouvrir} survol={survol} />}
          {onglet === "domaines" && <BarresDomaines liste={liste} donnees={donnees} ouvrir={ouvrir} survol={survol} />}
          {onglet === "promotions" && <ParPromotion liste={liste} ouvrir={ouvrir} survol={survol} />}
        </div>
      </section>

      {bulle}
      <PanneauPersonnes liste={panneau} onFermer={() => setPanneau(null)} />
    </div>
  );
}
