"use client";

// Bouton de l'en-tête qui réunit « Espace membres » et « Adhérer » : le libellé alterne entre les deux,
// et une boîte s'ouvre au survol (ou à l'appui sur tablette) avec les deux choix.

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui";

export function BoutonMembres() {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);

  // Fermeture par Échap ou par un clic ailleurs sur la page.
  useEffect(() => {
    if (!ouvert) return;
    const clic = (e: PointerEvent) => {
      if (!conteneur.current?.contains(e.target as Node)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOuvert(false);
        (document.activeElement as HTMLElement | null)?.blur();
      }
    };
    document.addEventListener("pointerdown", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("pointerdown", clic);
      document.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  // Après un choix, on referme et on retire le focus (sinon la boîte reste ouverte sur la page suivante).
  const choisir = () => {
    setOuvert(false);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <div ref={conteneur} data-ouvert={ouvert} className="bouton-membres group/membres relative hidden md:block">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        aria-controls="choix-membres"
        className={buttonClasses("primary")}
      >
        <span className="libelle-alterne" aria-hidden>
          <span className="libelle-alterne-pile">
            <span>Espace membres</span>
            <span>Adhérer</span>
            <span>Espace membres</span>
          </span>
        </span>
        <span className="sr-only">Espace membres ou adhésion</span>
        <ChevronDown
          size={15}
          aria-hidden
          className="transition-transform duration-300 group-hover/membres:rotate-180 group-focus-within/membres:rotate-180 group-data-[ouvert=true]/membres:rotate-180"
        />
      </button>

      <div
        id="choix-membres"
        className="invisible absolute top-[calc(100%+12px)] right-0 z-10 w-[290px] -translate-y-1.5 rounded-abm-md border border-bordeaux-700/15 bg-white p-4 opacity-0 shadow-abm-raised transition-[opacity,transform,visibility] duration-200 ease-[var(--ease-premium)] before:absolute before:inset-x-0 before:-top-3.5 before:h-3.5 before:content-[''] group-hover/membres:visible group-hover/membres:translate-y-0 group-hover/membres:opacity-100 group-focus-within/membres:visible group-focus-within/membres:translate-y-0 group-focus-within/membres:opacity-100 group-data-[ouvert=true]/membres:visible group-data-[ouvert=true]/membres:translate-y-0 group-data-[ouvert=true]/membres:opacity-100"
      >
        <span aria-hidden className="absolute -top-[6px] right-7 size-2.5 rotate-45 border-t border-l border-bordeaux-700/15 bg-white" />
        <Link href="/espace" onClick={choisir} className={`${buttonClasses("primary")} w-full`}>
          Espace membres
        </Link>
        <p className="mt-1.5 px-0.5 text-[13.5px] leading-snug text-ink-soft">
          Déjà membre : annuaire, stages, offres et votre fiche.
        </p>
        <div className="mt-3.5 border-t border-bordeaux-700/15 pt-3.5">
          <Link href="/adhesion" onClick={choisir} className={`${buttonClasses("outline")} w-full`}>
            Adhérer
          </Link>
          <p className="mt-1.5 px-0.5 text-[13.5px] leading-snug text-ink-soft">Pas encore membre : rejoindre l’association.</p>
        </div>
      </div>
    </div>
  );
}
