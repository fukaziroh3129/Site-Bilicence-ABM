"use client";

// Panneau latéral : la liste des personnes derrière un élément cliqué (établissement, mention, domaine,
// promotion), avec un menu déroulant pour affiner, et un lien vers chaque fiche de l'annuaire.

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Fenetre } from "@/components/fenetre/fenetre";
import { Initiales } from "@/components/ui";
import { personnes as accorde, type ListePanneau } from "./outils";

export function PanneauPersonnes({ liste, onFermer }: { liste: ListePanneau | null; onFermer: () => void }) {
  return (
    <Fenetre ouverte={!!liste} onFermer={onFermer} titre={liste?.titre ?? ""} surtitre={liste?.surtitre} laterale
      pied={<p className="text-xs text-ink-soft">Chaque ligne ouvre la fiche de la personne dans l’annuaire.</p>}
    >
      {/* La clé remet le filtre à zéro à chaque nouvelle liste. */}
      {liste && <Contenu key={`${liste.surtitre}|${liste.titre}`} liste={liste} />}
    </Fenetre>
  );
}

function Contenu({ liste }: { liste: ListePanneau }) {
  const [choix, setChoix] = useState("");
  const triees = [...liste.personnes].sort(liste.tri ?? ((a, b) => b.promo - a.promo || a.nom.localeCompare(b.nom, "fr")));
  const visibles = choix && liste.filtre ? triees.filter((p) => liste.filtre!.valeurs(p).includes(choix)) : triees;
  const promos = liste.personnes.map((p) => p.promo);
  const nom = liste.filtre?.nom ?? ((v: string) => v);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft" aria-live="polite">
        {choix ? `${accorde(visibles.length)} sur ${liste.personnes.length}` : accorde(liste.personnes.length)}
        {promos.length > 0 &&
          (Math.min(...promos) === Math.max(...promos)
            ? ` · entrée en ${promos[0]}`
            : ` · entrées de ${Math.min(...promos)} à ${Math.max(...promos)}`)}
      </p>
      {liste.filtre && liste.filtre.options.length > 1 && (
        <div>
          <label htmlFor="filtre-panneau" className="eyebrow block text-ink-soft">
            {liste.filtre.libelle}
          </label>
          <select
            id="filtre-panneau"
            value={choix}
            onChange={(e) => setChoix(e.target.value)}
            className="mt-1.5 block w-full rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-2 text-[15px] text-ink focus:border-bordeaux-700"
          >
            <option value="">Tous ({liste.personnes.length})</option>
            {liste.filtre.options.map(([v, n]) => (
              <option key={v} value={v}>
                {nom(v)} ({n})
              </option>
            ))}
          </select>
        </div>
      )}
      <ul className="-mx-2 divide-y divide-bordeaux-700/10">
        {visibles.map((p) => {
          const f = liste.formation?.(p) ?? p.formations[0];
          const etiquette = liste.etiquette?.(p);
          return (
            <li key={p.id}>
              <Link href={`/espace/annuaire/${p.id}`} className="group flex items-center gap-3 rounded-abm-md px-2 py-3 transition-colors hover:bg-bordeaux-100/60">
                <Initiales prenom={p.prenom} nom={p.nom} taille="petit" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink group-hover:text-bordeaux-700">
                    {p.prenom} {p.nom}
                  </span>
                  <span className="block text-[13px] text-ink-soft">Promotion {p.libellePromo}</span>
                  {f ? (
                    <span className="block text-[13px] leading-snug text-ink-soft">
                      <i>« {f.intitule} »</i> · {f.etablissement}
                      {f.enCours && " · en cours"}
                    </span>
                  ) : (
                    <span className="block text-[13px] text-ink-soft">{p.enLicence ? "En bi-licence" : p.travaille ? "En poste" : "Pas de formation renseignée"}</span>
                  )}
                  {etiquette && (
                    <span className="mt-1 inline-block rounded-abm-pill bg-bordeaux-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-bordeaux-700">
                      {etiquette}
                    </span>
                  )}
                </span>
                <ChevronRight size={18} aria-hidden className="shrink-0 text-bordeaux-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
