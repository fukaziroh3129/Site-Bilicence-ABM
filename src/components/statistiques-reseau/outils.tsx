"use client";

// Outils communs aux graphiques de la page « Statistiques » : comptages, infobulle, types partagés.

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormationStat, PersonneStat, TypeStat } from "@/lib/statistiques-reseau";

export type { DonneesStatistiques, FormationStat, PersonneStat, TypeStat } from "@/lib/statistiques-reseau";

/** Ce qu'il faut pour ouvrir le panneau latéral listant des personnes. */
export type ListePanneau = {
  surtitre: string;
  titre: string;
  personnes: PersonneStat[];
  /** Formation à montrer pour chaque personne (celle de l'établissement ou de la mention cliquée). */
  formation?: (p: PersonneStat) => FormationStat | undefined;
  /** Menu déroulant qui filtre la liste (ex. par mention). */
  filtre?: { libelle: string; valeurs: (p: PersonneStat) => string[]; options: [string, number][]; nom?: (valeur: string) => string };
  /** Petite étiquette par personne (ex. « Y travaille » / « Le vise »). */
  etiquette?: (p: PersonneStat) => string | null;
  tri?: (a: PersonneStat, b: PersonneStat) => number;
};
export type Ouvrir = (liste: ListePanneau) => void;

export const personnes = (n: number) => `${n} personne${n > 1 ? "s" : ""}`;

/** Compte les personnes par valeur (une personne compte une fois par valeur), du plus grand au plus petit. */
export function compterPersonnes(liste: PersonneStat[], valeurs: (p: PersonneStat) => (string | null | undefined)[]) {
  const n = new Map<string, number>();
  for (const p of liste) for (const v of new Set(valeurs(p))) if (v) n.set(v, (n.get(v) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]);
}

export const ORDRE_TYPES: TypeStat[] = ["UNIVERSITE", "IEP", "ECOLE", "ETRANGER"];
export const LIBELLES_TYPES: Record<TypeStat, { un: string; plusieurs: string }> = {
  UNIVERSITE: { un: "Université", plusieurs: "Universités" },
  IEP: { un: "IEP", plusieurs: "IEP" },
  ECOLE: { un: "École", plusieurs: "Écoles" },
  ETRANGER: { un: "Étranger", plusieurs: "Étranger" },
};
/** Couleurs des types d'établissement : gamme bordeaux de la charte (les libellés portent l'identité). */
export const COULEURS_TYPES: Record<TypeStat, { fond: string; clair: boolean }> = {
  UNIVERSITE: { fond: "#5C1A1E", clair: false },
  IEP: { fond: "#B85C5F", clair: false },
  ECOLE: { fond: "#E6BDBE", clair: true },
  ETRANGER: { fond: "#5A4446", clair: false },
};

/** Infobulle qui suit la souris (et s'affiche au focus clavier). */
export function useBulle() {
  const [bulle, setBulle] = useState<{ x: number; y: number; contenu: React.ReactNode } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!bulle || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let left = bulle.x + 14;
    let top = bulle.y + 14;
    if (left + r.width > window.innerWidth - 8) left = bulle.x - r.width - 14;
    if (top + r.height > window.innerHeight - 8) top = bulle.y - r.height - 14;
    setPosition({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [bulle]);

  const proprietes = useCallback(
    (contenu: React.ReactNode) => ({
      onMouseMove: (e: React.MouseEvent) => setBulle({ x: e.clientX, y: e.clientY, contenu }),
      onMouseLeave: () => setBulle(null),
      onFocus: (e: React.FocusEvent<Element>) => {
        const r = e.currentTarget.getBoundingClientRect();
        setBulle({ x: r.left + r.width / 2, y: r.top + r.height / 2, contenu });
      },
      onBlur: () => setBulle(null),
    }),
    [],
  );

  const element = bulle ? (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed z-[90] max-w-[280px] rounded-abm-sm bg-bordeaux-900 px-3 py-2 text-[13px] leading-snug text-white shadow-abm-raised"
      style={position ?? { left: -9999, top: -9999 }}
    >
      {bulle.contenu}
    </div>
  ) : null;

  return { bulle: element, survol: proprietes, cacher: () => setBulle(null) };
}

/** Largeur d'un élément, mise à jour quand elle change (pour les graphiques qui se calculent en pixels). */
export function useLargeur<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const o = new ResizeObserver(([e]) => setLargeur(Math.round(e.contentRect.width)));
    o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, largeur };
}
