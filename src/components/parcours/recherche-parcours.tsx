"use client";

// Champ de recherche unique sous le carrousel : on tape un nom, un master, une ville… et le champ
// propose des domaines (qui deviennent des filtres), des personnes (accès direct à leur carte)
// et des établissements.

import { Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { normaliser } from "@/lib/format";
import styles from "./carrousel.module.css";
import type { CarteParcours, DomaineFiltre } from "./types";

type Option =
  | { type: "domaine"; groupe: string; domaine: DomaineFiltre }
  | { type: "personne"; groupe: string; carte: CarteParcours }
  | { type: "etablissement"; groupe: string; lieu: string };

/** Met en gras la partie du texte qui correspond à la recherche. */
function Surligne({ texte, q }: { texte: string; q: string }) {
  const i = q ? normaliser(texte).indexOf(q) : -1;
  if (i < 0) return <span>{texte}</span>;
  return (
    <span>
      {texte.slice(0, i)}
      <mark>{texte.slice(i, i + q.length)}</mark>
      {texte.slice(i + q.length)}
    </span>
  );
}

export function RechercheParcours({
  cartes,
  domaines,
  actifs,
  texte,
  onTexte,
  onAjouterDomaine,
  onRetirerDomaine,
  etablissement,
  onRetirerEtablissement,
  onPersonne,
}: {
  cartes: CarteParcours[];
  domaines: DomaineFiltre[];
  actifs: string[];
  texte: string;
  onTexte: (texte: string) => void;
  onAjouterDomaine: (code: string) => void;
  onRetirerDomaine: (code: string) => void;
  /** Filtre posé depuis les statistiques (ex. « Instituts d'études politiques »). */
  etablissement: { cle: string; libelle: string } | null;
  onRetirerEtablissement: () => void;
  onPersonne: (id: string) => void;
}) {
  const id = useId();
  const champ = useRef<HTMLInputElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [selection, setSelection] = useState(-1);
  const q = normaliser(texte);

  const options = useMemo<Option[]>(() => {
    const doms = domaines.filter(
      (d) => d.nombre > 0 && !actifs.includes(d.code) && (!q || normaliser(d.libelle).includes(q) || normaliser(d.court).includes(q)),
    );
    const personnes = q ? cartes.filter((c) => normaliser(`${c.prenom} ${c.nom}`).includes(q)).slice(0, 4) : [];
    const lieux = q
      ? [...new Set(cartes.flatMap((c) => c.etapes.filter((e) => !e.base).map((e) => e.lieu)))].filter((l) => normaliser(l).includes(q)).slice(0, 3)
      : [];
    return [
      ...doms.map((domaine) => ({ type: "domaine" as const, groupe: q ? "Domaines" : "Parcourir par domaine", domaine })),
      ...personnes.map((carte) => ({ type: "personne" as const, groupe: "Personnes", carte })),
      ...lieux.map((lieu) => ({ type: "etablissement" as const, groupe: "Établissements", lieu })),
    ];
  }, [cartes, domaines, actifs, q]);

  const visible = ouvert && options.length > 0;
  const libelleCourt = (code: string) => domaines.find((d) => d.code === code)?.court ?? code;

  function choisir(o: Option) {
    if (o.type === "domaine") {
      onAjouterDomaine(o.domaine.code);
      onTexte("");
    } else if (o.type === "personne") {
      onPersonne(o.carte.id);
      setOuvert(false);
    } else {
      onTexte(o.lieu);
    }
    setSelection(-1);
    champ.current?.focus();
  }

  function clavier(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOuvert(true);
      setSelection((s) => Math.min(options.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelection((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter" && visible && selection >= 0) {
      e.preventDefault();
      choisir(options[selection]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    } else if (e.key === "Backspace" && !texte && actifs.length) {
      onRetirerDomaine(actifs[actifs.length - 1]);
    } else if (e.key === "Backspace" && !texte && etablissement) {
      onRetirerEtablissement();
    }
  }

  return (
    <div className={styles.combo}>
      {/* Un clic n'importe où dans le champ (hors étiquette) place le curseur dans la saisie. */}
      <div className={styles.champ} onClick={() => champ.current?.focus()}>
        <Search size={18} className={styles.loupe} aria-hidden />
        {actifs.map((code) => (
          <button
            key={code}
            type="button"
            className={styles.jeton}
            onClick={(e) => {
              e.stopPropagation();
              onRetirerDomaine(code);
            }}
            aria-label={`Retirer le filtre ${libelleCourt(code)}`}
          >
            {libelleCourt(code)} <X size={14} strokeWidth={2.4} aria-hidden />
          </button>
        ))}
        {etablissement && (
          <button
            type="button"
            className={styles.jeton}
            onClick={(e) => {
              e.stopPropagation();
              onRetirerEtablissement();
            }}
            aria-label={`Retirer le filtre ${etablissement.libelle}`}
          >
            {etablissement.libelle} <X size={14} strokeWidth={2.4} aria-hidden />
          </button>
        )}
        <input
          ref={champ}
          role="combobox"
          aria-label="Rechercher un parcours ou un domaine"
          aria-expanded={visible}
          aria-controls={`${id}-suggestions`}
          aria-autocomplete="list"
          aria-activedescendant={visible && selection >= 0 ? `${id}-option-${selection}` : undefined}
          autoComplete="off"
          placeholder="Un nom, un master… ou un domaine"
          value={texte}
          onChange={(e) => {
            onTexte(e.target.value);
            setOuvert(true);
            setSelection(-1);
          }}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 120)}
          onKeyDown={clavier}
        />
      </div>

      <ul id={`${id}-suggestions`} role="listbox" className={styles.suggestions} hidden={!visible}>
        {options.map((o, k) => (
          <li key={`${o.type}-${k}`} role="presentation">
            {(k === 0 || options[k - 1].groupe !== o.groupe) && (
              <div className={styles.groupe} role="presentation">
                {o.groupe}
              </div>
            )}
            <div
              id={`${id}-option-${k}`}
              role="option"
              aria-selected={k === selection}
              className={styles.option}
              onMouseDown={(e) => {
                e.preventDefault();
                choisir(o);
              }}
            >
              {o.type === "domaine" && (
                <>
                  <Surligne texte={o.domaine.libelle} q={q} />
                  <small>{o.domaine.nombre}</small>
                </>
              )}
              {o.type === "personne" && (
                <>
                  <span className={styles.ico} aria-hidden>
                    {o.carte.prenom[0]}
                    {o.carte.nom[0]}
                  </span>
                  <Surligne texte={`${o.carte.prenom} ${o.carte.nom}`} q={q} />
                  {o.carte.aujourdhui && <small>{o.carte.aujourdhui.titre}</small>}
                </>
              )}
              {o.type === "etablissement" && <Surligne texte={o.lieu} q={q} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
