// Barre de recherche et de filtres des listes de l'administration (fiches, établissements).
// C'est un simple formulaire GET : les filtres apparaissent dans l'adresse de la page,
// ce qui permet de partager ou de garder en favori une recherche.
// (L'annuaire, les offres et les stages utilisent la version instantanée : filtres-instantanes.tsx.)

import { Search } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui";

const classeLibelle = "mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft";

type Filtre = {
  nom: string;
  libelle: string;
  options: { valeur: string; libelle: string }[];
  valeur?: string;
};

export function Filtres({
  action,
  recherche,
  placeholder,
  filtres,
  className = "",
}: {
  action: string;
  recherche?: string;
  placeholder: string;
  filtres: Filtre[];
  className?: string;
}) {
  const actifs = !!recherche || filtres.some((f) => f.valeur);
  return (
    <form action={action} method="get" className={`flex flex-wrap items-end gap-3 ${className}`}>
      <div className="min-w-0 flex-[2_1_260px]">
        <label htmlFor="q" className={classeLibelle}>
          Rechercher
        </label>
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bordeaux-500" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={recherche}
            placeholder={placeholder}
            className="h-11 w-full rounded-full border border-bordeaux-700/30 bg-paper pl-10 pr-4 text-sm text-ink focus:border-bordeaux-700 focus:bg-white"
          />
        </div>
      </div>
      {filtres.map((f) => (
        <div key={f.nom} className="min-w-0 flex-[1_1_160px]">
          <label htmlFor={f.nom} className={classeLibelle}>
            {f.libelle}
          </label>
          <select
            id={f.nom}
            name={f.nom}
            defaultValue={f.valeur ?? ""}
            className="h-11 w-full rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 text-sm text-ink focus:border-bordeaux-700"
          >
            <option value="">Tous</option>
            {f.options.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button type="submit" className={buttonClasses("primary", "petit")}>
          <Search size={14} aria-hidden /> Filtrer
        </button>
        {actifs && (
          <Link href={action} className="text-sm text-ink-soft underline underline-offset-4 hover:text-bordeaux-700">
            Effacer
          </Link>
        )}
      </div>
    </form>
  );
}

/** Lit un paramètre d'adresse (?q=…) comme texte simple. */
export function parametre(valeur: string | string[] | undefined) {
  return typeof valeur === "string" ? valeur : undefined;
}
