"use client";

// Carte interactive des Erasmus. Plus un pays a vu partir d'étudiants, plus il est foncé.
// Recherche : un pays ou une université (avec suggestions) ouvre le pays et la carte zoome dessus.
// Souris : une fiche résume le pays au survol (rang, part des départs, universités).
// Clic, toucher ou clavier : le pays s'ouvre dans le panneau (universités et nombre de départs ;
// pour les membres, qui est parti et leur retour). Jamais de nom pour les visiteurs sans compte.

import { ArrowLeft, MousePointerClick, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import carte from "@/lib/carte-monde.json";
import { normaliser } from "@/lib/format";
import styles from "./carte-erasmus.module.css";

export type SejourMembre = {
  id: string;
  personneId: string;
  nom: string;
  details: string; // « Promo 2021–2024 · Licence · 2023 · Un semestre »
  descriptif: string | null;
  aUnRetour: boolean;
};

export type UniversiteCarte = {
  id: string;
  nom: string;
  ville: string | null;
  departs: number;
  sejours?: SejourMembre[]; // uniquement pour les membres connectés
};

export type DestinationPays = {
  code: string;
  nom: string;
  departs: number;
  universites: UniversiteCarte[];
};

/** Classes de couleur : 1, 2–3, 4–6, 7–10, 11 et plus. */
const PALIERS = [1, 2, 4, 7, 11];
const COULEURS = ["var(--abm-bordeaux-200)", "var(--abm-bordeaux-300)", "var(--abm-bordeaux-400)", "var(--abm-bordeaux-600)", "var(--abm-bordeaux-800)"];
const niveau = (n: number) => PALIERS.filter((p) => n >= p).length;

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const rangTexte = (r: number) => (r === 1 ? "1re destination" : `${r}e destination`);

type Boite = [number, number, number, number]; // x, y, largeur, hauteur (comme un viewBox)

/** Proportions du cadre de la carte (16 / 10) : la boîte de zoom les respecte. */
const RATIO = 1.6;

/**
 * Boîte de zoom sur un pays : celle de son territoire principal (plus quelques îles proches), sans
 * les territoires lointains (la Guyane pour la France…). Les tracés sont en « M x y » puis « l dx dy ».
 */
function boitePays(d: string): Boite {
  const morceaux = d
    .split("M")
    .filter(Boolean)
    .map((partie) => {
      const n = partie.replace(/[lz]/g, " ").trim().split(/\s+/).map(Number);
      let x = n[0];
      let y = n[1];
      let [x0, y0, x1, y1] = [x, y, x, y];
      for (let i = 2; i + 1 < n.length; i += 2) {
        x += n[i];
        y += n[i + 1];
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
      return [x0, y0, x1, y1];
    });
  const aire = (b: number[]) => (b[2] - b[0]) * (b[3] - b[1]);
  const principal = morceaux.reduce((a, b) => (aire(b) > aire(a) ? b : a));
  const cx = (principal[0] + principal[2]) / 2;
  const cy = (principal[1] + principal[3]) / 2;
  const portee = Math.max(principal[2] - principal[0], principal[3] - principal[1]) * 1.2;
  let [x0, y0, x1, y1] = principal;
  for (const b of morceaux) {
    if (Math.hypot((b[0] + b[2]) / 2 - cx, (b[1] + b[3]) / 2 - cy) > portee) continue;
    x0 = Math.min(x0, b[0]);
    y0 = Math.min(y0, b[1]);
    x1 = Math.max(x1, b[2]);
    y1 = Math.max(y1, b[3]);
  }
  // Marge autour du pays, taille minimale (petits pays), puis proportions du cadre.
  let l = Math.max((x1 - x0) * 1.8, 520);
  let h = Math.max((y1 - y0) * 1.8, 520 / RATIO);
  if (l / h < RATIO) l = h * RATIO;
  else h = l / RATIO;
  return [(x0 + x1) / 2 - l / 2, (y0 + y1) / 2 - h / 2, l, h];
}

/** Déplace le viewBox de la carte vers la boîte voulue, en douceur (sauf « réduire les animations »). */
function useZoom(svg: React.RefObject<SVGSVGElement | null>, cible: Boite) {
  const actuel = useRef<Boite>(cible);
  const [x, y, l, h] = cible;
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const depart = actuel.current;
    const arrivee: Boite = [x, y, l, h];
    const appliquer = (b: Boite) => {
      actuel.current = b;
      element.setAttribute("viewBox", b.map((v) => v.toFixed(1)).join(" "));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return appliquer(arrivee);
    const debut = performance.now();
    let image = 0;
    const etape = (t: number) => {
      const p = Math.min(1, (t - debut) / 750);
      const e = 1 - Math.pow(1 - p, 4); // départ rapide, arrivée douce
      appliquer(depart.map((v, i) => v + (arrivee[i] - v) * e) as Boite);
      if (p < 1) image = requestAnimationFrame(etape);
    };
    image = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(image);
  }, [svg, x, y, l, h]);
}

type Suggestion = { type: "pays"; pays: DestinationPays } | { type: "universite"; pays: DestinationPays; universite: UniversiteCarte };

export function CarteErasmus({ destinations, membre }: { destinations: DestinationPays[]; membre: boolean }) {
  const parCode = useMemo(() => new Map(destinations.map((d) => [d.code, d])), [destinations]);
  const total = destinations.reduce((s, d) => s + d.departs, 0);
  const maxDeparts = destinations[0]?.departs ?? 1; // la liste arrive triée
  /** Rang de chaque pays (ex aequo : même rang). */
  const rangs = useMemo(() => {
    const r = new Map<string, number>();
    destinations.forEach((d, i) => r.set(d.code, i > 0 && destinations[i - 1].departs === d.departs ? r.get(destinations[i - 1].code)! : i + 1));
    return r;
  }, [destinations]);

  const [vue, setVue] = useState<"europe" | "monde">("europe");
  const [choisi, setChoisi] = useState<string | null>(null);
  const [surlignee, setSurlignee] = useState<string | null>(null); // université mise en avant dans le panneau
  const [bulle, setBulle] = useState<{ code: string; x: number; y: number; gauche: boolean; haut: boolean } | null>(null);

  const detail = choisi ? parCode.get(choisi) : undefined;
  const survole = bulle ? parCode.get(bulle.code) : undefined;
  const horsEurope = destinations.filter((d) => !estEnEurope(d.code)).reduce((s, d) => s + d.departs, 0);

  // ─── Zoom ───
  const svgRef = useRef<SVGSVGElement>(null);
  const traces = useMemo(() => new Map(carte.pays.map((p) => [p.code, p.d])), []);
  const cible = useMemo<Boite>(() => {
    const d = choisi ? traces.get(choisi) : undefined;
    return d ? boitePays(d) : (carte.vues[vue] as Boite);
  }, [choisi, traces, vue]);
  useZoom(svgRef, cible);

  function ouvrir(code: string, universite: string | null = null) {
    setChoisi(code);
    setSurlignee(universite);
    setBulle(null);
    if (!estEnEurope(code)) setVue("monde");
  }
  function fermer() {
    setChoisi(null);
    setSurlignee(null);
  }

  // L'université cherchée est amenée en vue dans le panneau.
  const panneauRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!surlignee) return;
    panneauRef.current?.querySelector(`[data-universite="${surlignee}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [surlignee, choisi]);

  function codeDe(cible: EventTarget) {
    const code = (cible as Element).closest?.("[data-code]")?.getAttribute("data-code");
    return code && parCode.has(code) ? code : null;
  }

  return (
    <div className="space-y-4">
      <div className={styles.barre}>
        <RechercheDestinations destinations={destinations} onChoisir={(s) => ouvrir(s.pays.code, s.type === "universite" ? s.universite.id : null)} />
        <div className={styles.vues} role="group" aria-label="Zone affichée">
          <button
            type="button"
            aria-pressed={vue === "europe" && !choisi}
            onClick={() => {
              fermer();
              setVue("europe");
            }}
          >
            Europe
          </button>
          <button
            type="button"
            aria-pressed={vue === "monde" && !choisi}
            onClick={() => {
              fermer();
              setVue("monde");
            }}
          >
            Monde{horsEurope > 0 && vue === "europe" ? ` (+${horsEurope})` : ""}
          </button>
        </div>
      </div>

      <div className={styles.disposition}>
        <div
          className={styles.cadre}
          onPointerMove={(e) => {
            const code = e.pointerType === "mouse" ? codeDe(e.target) : null;
            if (!code) return setBulle(null);
            const zone = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - zone.left;
            const y = e.clientY - zone.top;
            // La fiche passe de l'autre côté du curseur près des bords, pour rester dans le cadre.
            setBulle({ code, x, y, gauche: x > zone.width - 300, haut: y > zone.height - 240 });
          }}
          onPointerLeave={() => setBulle(null)}
          onClick={(e) => {
            const code = codeDe(e.target);
            if (code) ouvrir(code);
          }}
          onKeyDown={(e) => {
            const code = codeDe(e.target);
            if (code && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              ouvrir(code);
            }
          }}
        >
          <svg
            ref={svgRef}
            viewBox={carte.vues.europe.join(" ")}
            className={styles.carte}
            data-zoom={choisi ? "" : undefined}
            role="img"
            aria-label="Carte des destinations Erasmus. La liste complète figure à côté."
          >
            {carte.pays.map((p) => {
              const d = parCode.get(p.code);
              return (
                <path
                  key={p.code}
                  d={p.d}
                  data-code={p.code}
                  className={styles.pays}
                  data-niveau={d ? niveau(d.departs) : undefined}
                  data-choisi={choisi === p.code || undefined}
                  data-estompe={(choisi && choisi !== p.code) || undefined}
                  tabIndex={d ? 0 : undefined}
                  role={d ? "button" : undefined}
                  aria-label={d ? `${d.nom} : ${pluriel(d.departs, "départ")}` : undefined}
                />
              );
            })}
          </svg>

          {choisi && (
            <button type="button" className={styles.recentrer} onClick={fermer}>
              <X size={14} strokeWidth={2.4} aria-hidden /> Vue d’ensemble
            </button>
          )}

          <div className={styles.legende} aria-hidden>
            <span>Nombre de départs</span>
            <ol>
              {["1", "2–3", "4–6", "7–10", "11+"].map((libelle, i) => (
                <li key={libelle}>
                  <i style={{ background: COULEURS[i] }} />
                  {libelle}
                </li>
              ))}
            </ol>
          </div>

          {survole && bulle && (
            <div
              className={styles.bulle}
              data-gauche={bulle.gauche || undefined}
              data-haut={bulle.haut || undefined}
              style={{ left: bulle.x, top: bulle.y }}
              aria-hidden
            >
              <div className={styles.bulleTete}>
                <b>{survole.nom}</b>
                <span className={styles.rang}>{rangTexte(rangs.get(survole.code)!)}</span>
              </div>
              <p className={styles.bulleChiffre}>
                <strong>{survole.departs}</strong> {survole.departs > 1 ? "départs" : "départ"}
                <span> · {pluriel(survole.universites.length, "université")}</span>
              </p>
              <div className={styles.part}>
                <i style={{ width: `${(survole.departs / total) * 100}%` }} />
              </div>
              <small className={styles.partTexte}>{Math.round((survole.departs / total) * 100)}&nbsp;% de tous les départs</small>
              <ul>
                {survole.universites.slice(0, 3).map((u) => (
                  <li key={u.id}>
                    <span>{u.nom}</span>
                    <span className={styles.mini}>
                      <i style={{ width: `${(u.departs / survole.departs) * 100}%` }} />
                    </span>
                    <span>{u.departs}</span>
                  </li>
                ))}
              </ul>
              {survole.universites.length > 3 && <small className={styles.partTexte}>et {pluriel(survole.universites.length - 3, "autre")}</small>}
              <p className={styles.astuce}>
                <MousePointerClick size={13} aria-hidden /> Cliquez pour le détail
              </p>
            </div>
          )}
        </div>

        <aside ref={panneauRef} className={styles.panneau} aria-live="polite">
          {detail ? (
            <>
              <button type="button" className={styles.retour} onClick={fermer}>
                <ArrowLeft size={14} aria-hidden /> Toutes les destinations
              </button>
              <p className={styles.rang}>{rangTexte(rangs.get(detail.code)!)}</p>
              <h2>{detail.nom}</h2>
              <p className={styles.sousTitre}>
                {pluriel(detail.departs, "départ")} · {pluriel(detail.universites.length, "université")} ·{" "}
                {Math.round((detail.departs / total) * 100)}&nbsp;% des départs
              </p>
              <ul className={styles.universites}>
                {detail.universites.map((u) => (
                  <li key={u.id} data-universite={u.id} data-surlignee={surlignee === u.id || undefined}>
                    <div className={styles.ligneUniv}>
                      <div>
                        <b>{u.nom}</b>
                        {u.ville && <small>{u.ville}</small>}
                      </div>
                      <span className={styles.nombre}>{u.departs}</span>
                    </div>
                    <div className={styles.mini} aria-hidden>
                      <i style={{ width: `${(u.departs / detail.departs) * 100}%` }} />
                    </div>
                    {u.sejours && (
                      <ul className={styles.sejours}>
                        {u.sejours.map((s) => (
                          <li key={s.id}>
                            <Link href={`/espace/annuaire/${s.personneId}#${s.id}`}>{s.nom}</Link>
                            <span>{s.details}</span>
                            {s.descriptif && <p>{s.descriptif}</p>}
                            {s.aUnRetour && <span>Retour d’expérience détaillé sur sa fiche.</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2>Toutes les destinations</h2>
              <p className={styles.sousTitre}>Choisissez un pays, sur la carte ou dans la liste.</p>
              {destinations.length === 0 ? (
                <p className={styles.sousTitre}>Les premiers séjours seront bientôt renseignés.</p>
              ) : (
                <ol className={styles.classement}>
                  {destinations.map((d) => (
                    <li key={d.code}>
                      <button type="button" onClick={() => ouvrir(d.code)}>
                        <span className={styles.classementNom}>
                          <span>{d.nom}</span>
                          <span className={styles.mini} aria-hidden>
                            <i style={{ width: `${(d.departs / maxDeparts) * 100}%` }} />
                          </span>
                        </span>
                        <span className={styles.nombre}>{d.departs}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
          {!membre && (
            <p className={styles.invitation}>
              Vous êtes membre&nbsp;? <Link href="/connexion?suite=/erasmus">Connectez-vous</Link> pour voir qui est parti et
              lire leurs retours d’expérience.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Champ de recherche avec suggestions : pays et universités. */
function RechercheDestinations({ destinations, onChoisir }: { destinations: DestinationPays[]; onChoisir: (s: Suggestion) => void }) {
  const id = useId();
  const [texte, setTexte] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [selection, setSelection] = useState(-1);
  const q = normaliser(texte.trim());

  const options = useMemo<Suggestion[]>(() => {
    if (!q) return [];
    const pays = destinations.filter((d) => normaliser(d.nom).includes(q)).map((pays) => ({ type: "pays" as const, pays }));
    const universites = destinations.flatMap((pays) =>
      pays.universites
        .filter((u) => normaliser(`${u.nom} ${u.ville ?? ""}`).includes(q))
        .map((universite) => ({ type: "universite" as const, pays, universite })),
    );
    return [...pays.slice(0, 4), ...universites.slice(0, 6)];
  }, [destinations, q]);
  const visible = ouvert && q.length > 0;

  function choisir(s: Suggestion) {
    onChoisir(s);
    setTexte("");
    setOuvert(false);
    setSelection(-1);
  }

  return (
    <div className={styles.recherche}>
      <Search size={17} className={styles.loupe} aria-hidden />
      <input
        role="combobox"
        aria-label="Rechercher un pays ou une université"
        aria-expanded={visible}
        aria-controls={`${id}-suggestions`}
        aria-autocomplete="list"
        aria-activedescendant={visible && selection >= 0 ? `${id}-option-${selection}` : undefined}
        autoComplete="off"
        placeholder="Un pays, une université…"
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value);
          setOuvert(true);
          setSelection(-1);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setTimeout(() => setOuvert(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelection((s) => Math.min(options.length - 1, s + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelection((s) => Math.max(0, s - 1));
          } else if (e.key === "Enter" && options.length) {
            e.preventDefault();
            choisir(options[Math.max(0, selection)]);
          } else if (e.key === "Escape") {
            setOuvert(false);
          }
        }}
      />
      <ul id={`${id}-suggestions`} role="listbox" className={styles.suggestions} hidden={!visible}>
        {options.length === 0 && <li className={styles.aucune}>Aucune destination ne correspond.</li>}
        {options.map((o, k) => (
          <li
            key={o.type === "pays" ? o.pays.code : o.universite.id}
            id={`${id}-option-${k}`}
            role="option"
            aria-selected={k === selection}
            onMouseDown={(e) => {
              e.preventDefault();
              choisir(o);
            }}
          >
            {o.type === "pays" ? (
              <>
                <span>
                  <b>{o.pays.nom}</b>
                  <small>Pays · {pluriel(o.pays.universites.length, "université")}</small>
                </span>
                <span className={styles.nombre}>{o.pays.departs}</span>
              </>
            ) : (
              <>
                <span>
                  <b>{o.universite.nom}</b>
                  <small>
                    {o.universite.ville ? `${o.universite.ville}, ` : ""}
                    {o.pays.nom}
                  </small>
                </span>
                <span className={styles.nombre}>{o.universite.departs}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pays visibles dans le cadrage « Europe » (pour signaler les départs hors de ce cadre). */
const EUROPE = new Set(
  "AL AD AT BE BA BG BY CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SK SM UA VA XK TR".split(" "),
);
function estEnEurope(code: string) {
  return EUROPE.has(code);
}
