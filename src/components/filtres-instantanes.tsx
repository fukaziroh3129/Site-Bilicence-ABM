"use client";

// Briques de la barre de filtres « instantanée » (annuaire, offres, stages) : les résultats se
// mettent à jour pendant la frappe, sans bouton « Filtrer ». Le filtrage lui-même est fait par
// chaque page (quelques centaines d'éléments au plus : tout est déjà chargé dans le navigateur).

import { Search } from "lucide-react";
import { useEffect } from "react";

/** Panneau qui contient la barre de filtres ; `pied` = ligne du bas (nombre de résultats, tri). */
export function CadreFiltres({ children, pied, label }: { children: React.ReactNode; pied: React.ReactNode; label: string }) {
  return (
    <div role="search" aria-label={label} className="grid gap-4 rounded-abm-lg border border-bordeaux-700/15 bg-white p-4 shadow-abm-card sm:p-5">
      {children}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bordeaux-700/10 pt-3 text-sm text-ink-soft">{pied}</div>
    </div>
  );
}

/** Champ de recherche en pilule, avec loupe. */
export function ChampRecherche({
  valeur,
  onChange,
  placeholder,
  label,
}: {
  valeur: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-[1_1_280px]">
      <Search size={17} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bordeaux-500" />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-12 w-full rounded-full border border-bordeaux-700/30 bg-paper pl-11 pr-4 text-[15px] text-ink transition-colors placeholder:text-ink-soft/80 focus:border-bordeaux-700 focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,92,95,0.2)] focus:outline-none"
      />
    </div>
  );
}

/** Choix court en pastilles (une seule à la fois), avec l'effectif de chaque option. */
export function PastillesChoix({
  options,
  valeur,
  onChange,
  label,
}: {
  options: { valeur: string; libelle: string; nombre?: number }[];
  valeur: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          aria-pressed={valeur === o.valeur}
          onClick={() => onChange(o.valeur)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-abm-pill border border-bordeaux-700/30 bg-white px-3 py-1 text-sm font-semibold text-bordeaux-700 transition-colors hover:bg-bordeaux-100 aria-pressed:border-bordeaux-700 aria-pressed:bg-bordeaux-700 aria-pressed:text-white"
        >
          {o.libelle}
          {o.nombre !== undefined && <span className="text-xs font-normal opacity-75">{o.nombre}</span>}
        </button>
      ))}
    </div>
  );
}

/** Choix long en liste déroulante. */
export function ListeChoix({
  options,
  valeur,
  onChange,
  label,
  tous,
}: {
  options: { valeur: string; libelle: string }[];
  valeur: string;
  onChange: (v: string) => void;
  label: string;
  tous: string;
}) {
  return (
    <select
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-12 min-w-0 max-w-full flex-[0_1_260px] rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 text-sm text-ink focus:border-bordeaux-700"
    >
      <option value="">{tous}</option>
      {options.map((o) => (
        <option key={o.valeur} value={o.valeur}>
          {o.libelle}
        </option>
      ))}
    </select>
  );
}

/** Interrupteur (case à cocher présentée en bouton glissant). */
export function Bascule({ coche, onChange, libelle }: { coche: boolean; onChange: (v: boolean) => void; libelle: string }) {
  return (
    <label className="inline-flex min-h-8 cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
      <input type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-[22px] w-[38px] shrink-0 rounded-abm-pill bg-bordeaux-200 transition-colors after:absolute after:left-[3px] after:top-[3px] after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-bordeaux-700 peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bordeaux-700"
      />
      {libelle}
    </label>
  );
}

/** Nombre de résultats (annoncé aux lecteurs d'écran) + lien « Effacer ». */
export function NombreResultats({
  nombre,
  singulier,
  pluriel,
  actifs,
  onEffacer,
}: {
  nombre: number;
  singulier: string;
  pluriel: string;
  actifs: boolean;
  onEffacer: () => void;
}) {
  return (
    <span className="flex items-center gap-3">
      <span aria-live="polite">
        <strong className="text-ink tabular-nums">{nombre}</strong> {nombre > 1 ? pluriel : singulier}
      </span>
      {actifs && (
        <button type="button" onClick={onEffacer} className="underline underline-offset-4 hover:text-bordeaux-700">
          Effacer les filtres
        </button>
      )}
    </span>
  );
}

/** Menu de tri discret, à droite du pied de la barre. */
export function Tri({ options, valeur, onChange }: { options: { valeur: string; libelle: string }[]; valeur: string; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2">
      Trier par
      <select value={valeur} onChange={(e) => onChange(e.target.value)} className="cursor-pointer rounded-abm-sm bg-transparent px-1 py-1 font-semibold text-bordeaux-700 focus:outline-2">
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Garde les filtres dans l'adresse de la page (sans recharger) : on peut partager ou mettre
 * en favori une recherche. Les valeurs vides (ou égales au défaut) ne sont pas écrites.
 */
export function useFiltresDansAdresse(valeurs: Record<string, string | boolean>, defauts: Record<string, string | boolean> = {}) {
  const cle = JSON.stringify(valeurs);
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [nom, v] of Object.entries(valeurs)) {
      if (v === "" || v === false || v === defauts[nom]) continue;
      params.set(nom, v === true ? "1" : v);
    }
    const chaine = params.toString();
    const adresse = `${window.location.pathname}${chaine ? `?${chaine}` : ""}${window.location.hash}`;
    if (adresse !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", adresse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
}
