"use client";

// Carrousel de la page publique « Que sont-ils devenus ? » : une carte au centre, les voisines
// réduites et inclinées sur les côtés. Navigation : flèches, glisser (souris ou doigt), flèches
// du clavier, défilement horizontal du pavé tactile, clic sur une carte de côté.
// Les positions sont calculées ici et appliquées directement aux cartes (style.transform) pour
// que le glissement suive le doigt sans saccade.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EVENEMENT_FILTRE, type DetailFiltre } from "@/components/statistiques/stats-devenir";
import { correspond } from "@/lib/format";
import { ContenuCarte } from "./carte-parcours";
import styles from "./carrousel.module.css";
import { RechercheParcours } from "./recherche-parcours";
import type { CarteParcours, DomaineFiltre } from "./types";

/** Texte dans lequel porte la recherche libre. */
function texteDe(c: CarteParcours, libelle: (code: string) => string) {
  return [
    c.prenom,
    c.nom,
    c.ville,
    c.presentation,
    c.aujourdhui?.titre,
    c.aujourdhui?.structure,
    // La bi-licence est commune à tous : elle ne compte pas dans la recherche.
    ...c.etapes.filter((e) => !e.base).flatMap((e) => [e.titre, e.detail, e.lieu]),
    ...c.experiences.flatMap((e) => [e.poste, e.organisation]),
    ...c.domaines.map(libelle),
  ];
}

/** Établissement choisi dans les statistiques (ex. « Instituts d'études politiques »). */
export type FiltreEtablissement = { cle: string; libelle: string };

export function CarrouselParcours({
  cartes,
  domaines,
  domaineInitial = null,
  etablissementInitial = null,
}: {
  cartes: CarteParcours[];
  domaines: DomaineFiltre[];
  /** Filtres reçus dans l'adresse (lien depuis les statistiques d'une autre page). */
  domaineInitial?: string | null;
  etablissementInitial?: FiltreEtablissement | null;
}) {
  const parCode = useMemo(() => new Map(domaines.map((d) => [d.code, d])), [domaines]);
  const court = useCallback((code: string) => parCode.get(code)?.court ?? code, [parCode]);
  const libelle = useCallback((code: string) => parCode.get(code)?.libelle ?? code, [parCode]);

  const [actifs, setActifs] = useState<string[]>(domaineInitial ? [domaineInitial] : []);
  const [etablissement, setEtablissement] = useState<FiltreEtablissement | null>(etablissementInitial);
  const [texte, setTexte] = useState("");
  const [courant, setCourant] = useState(0);
  const [retournee, setRetournee] = useState<string | null>(null);

  // Un parcours correspond s'il a au moins un des domaines choisis et contient tous les mots tapés.
  const liste = useMemo(
    () =>
      cartes.filter(
        (c) =>
          (!actifs.length || c.domaines.some((d) => actifs.includes(d))) &&
          (!etablissement || c.etablissements.includes(etablissement.cle)) &&
          correspond(texte, texteDe(c, libelle)),
      ),
    [cartes, actifs, etablissement, texte, libelle],
  );
  const n = liste.length;
  const boucle = n >= 5; // en dessous, la même carte apparaîtrait des deux côtés

  const sceneRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const position = useRef(0); // position « flottante » pendant un glissement
  const depart = useRef<{ x: number; t: number } | null>(null);
  const deplace = useRef(false);

  /** Écart signé entre la carte i et la position f (le plus court chemin quand on boucle). */
  const ecart = useCallback(
    (i: number, f: number) => {
      let d = i - f;
      if (boucle) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      return d;
    },
    [boucle, n],
  );

  const pas = useCallback(() => {
    const largeur = refs.current[0]?.offsetWidth ?? 340;
    const etroit = (sceneRef.current?.offsetWidth ?? 1000) < 700;
    return { s1: largeur * (etroit ? 0.94 : 0.8), s2: largeur * 0.62, limite: etroit ? 1.6 : 2.6 };
  }, []);

  const placer = useCallback(
    (f: number) => {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { s1, s2, limite } = pas();
      refs.current.slice(0, n).forEach((el, i) => {
        if (!el) return;
        const d = ecart(i, f);
        const a = Math.abs(d);
        const x = a <= 1 ? d * s1 : Math.sign(d) * (s1 + (a - 1) * s2);
        const rotation = reduit ? 0 : Math.max(-16, Math.min(16, d * 9));
        el.style.transform = `translateX(${x}px) scale(${1 - 0.13 * Math.min(a, 2)}) rotateY(${rotation}deg)`;
        el.style.zIndex = String(100 - Math.round(a * 10));
        el.style.opacity = a > limite ? "0" : a > limite - 0.6 ? String((limite - a) / 0.6) : "1";
        el.style.pointerEvents = a > limite ? "none" : "";
        el.style.setProperty("--voile", String(Math.min(a, 2) * 0.3));
      });
    },
    [ecart, n, pas],
  );

  /** Place les cartes sans animation (premier affichage, nouveau filtre, fenêtre redimensionnée). */
  const placerSansAnimation = useCallback(
    (f: number) => {
      const scene = sceneRef.current;
      if (!scene) return;
      scene.classList.add(styles.glisse);
      placer(f);
      void scene.offsetWidth; // force le navigateur à appliquer les positions avant de réactiver l'animation
      scene.classList.remove(styles.glisse);
    },
    [placer],
  );

  // Nouvelle liste (filtre) : placement immédiat ; simple changement de carte : placement animé.
  const listePrecedente = useRef<CarteParcours[] | null>(null);
  useLayoutEffect(() => {
    const nouvelleListe = listePrecedente.current !== liste;
    listePrecedente.current = liste;
    position.current = courant;
    if (nouvelleListe) placerSansAnimation(courant);
    else placer(courant);
  }, [liste, courant, placer, placerSansAnimation]);

  const aller = useCallback(
    (i: number) => {
      if (!n) return;
      const cible = boucle ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i));
      setRetournee(null);
      if (cible === courant) placer(courant); // retour en place après un glissement trop court
      else setCourant(cible);
    },
    [boucle, courant, n, placer],
  );

  // Changer de filtre ramène au premier parcours.
  const filtrer = (changement: () => void) => {
    changement();
    setCourant(0);
    setRetournee(null);
  };

  // Clic sur une ligne des statistiques (sous le carrousel) : on filtre puis on remonte au carrousel.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    function appliquer(e: Event) {
      const { type, cle, libelle } = (e as CustomEvent<DetailFiltre>).detail;
      setTexte("");
      if (type === "domaine") {
        setActifs([cle]);
        setEtablissement(null);
      } else {
        setActifs([]);
        setEtablissement({ cle, libelle });
      }
      setCourant(0);
      setRetournee(null);
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      sectionRef.current?.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "start" });
    }
    window.addEventListener(EVENEMENT_FILTRE, appliquer);
    return () => window.removeEventListener(EVENEMENT_FILTRE, appliquer);
  }, []);

  // ─── Glisser à la souris ou au doigt ───
  useEffect(() => {
    function bouger(e: PointerEvent) {
      if (!depart.current) return;
      const dx = e.clientX - depart.current.x;
      if (!deplace.current && Math.abs(dx) < 6) return;
      if (!deplace.current) {
        deplace.current = true;
        sceneRef.current?.classList.add(styles.glisse);
        setRetournee(null);
      }
      let f = courant - dx / pas().s1;
      if (!boucle) f = Math.max(-0.4, Math.min(n - 0.6, f));
      position.current = f;
      placer(f);
    }
    function lacher(e: PointerEvent, annule: boolean) {
      if (!depart.current) return;
      const dx = e.clientX - depart.current.x;
      const vitesse = dx / (performance.now() - depart.current.t);
      depart.current = null;
      sceneRef.current?.classList.remove(styles.glisse);
      if (!deplace.current) return;
      let cible = Math.round(position.current);
      if (!annule && cible === courant && (Math.abs(dx) > 40 || Math.abs(vitesse) > 0.4)) cible = courant - Math.sign(dx);
      aller(cible);
      setTimeout(() => (deplace.current = false), 0);
    }
    const haut = (e: PointerEvent) => lacher(e, false);
    // Le navigateur reprend la main (défilement vertical au doigt) : on remet les cartes en place.
    const annule = (e: PointerEvent) => lacher(e, true);
    window.addEventListener("pointermove", bouger);
    window.addEventListener("pointerup", haut);
    window.addEventListener("pointercancel", annule);
    return () => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("pointerup", haut);
      window.removeEventListener("pointercancel", annule);
    };
  }, [aller, boucle, courant, n, pas, placer]);

  // ─── Clavier, pavé tactile, redimensionnement ───
  useEffect(() => {
    function clavier(e: KeyboardEvent) {
      const cible = e.target as HTMLElement;
      if (cible.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        aller(courant - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        aller(courant + 1);
      }
    }
    document.addEventListener("keydown", clavier);
    return () => document.removeEventListener("keydown", clavier);
  }, [aller, courant]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let cumul = 0;
    let verrou = false;
    function molette(e: WheelEvent) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // défilement vertical : la page (ou le parcours) défile normalement
      e.preventDefault();
      if (verrou) return;
      cumul += e.deltaX;
      if (Math.abs(cumul) > 50) {
        aller(courant + Math.sign(cumul));
        cumul = 0;
        verrou = true;
        setTimeout(() => (verrou = false), 450);
      }
    }
    scene.addEventListener("wheel", molette, { passive: false });
    return () => scene.removeEventListener("wheel", molette);
  }, [aller, courant]);

  useEffect(() => {
    const redimensionner = () => placerSansAnimation(position.current);
    window.addEventListener("resize", redimensionner);
    return () => window.removeEventListener("resize", redimensionner);
  }, [placerSansAnimation]);

  const actuel = liste[courant];

  return (
    <section ref={sectionRef} id="parcours" className={styles.carrousel} aria-roledescription="carrousel" aria-label="Parcours des anciens">
      <div
        ref={sceneRef}
        className={styles.scene}
        onPointerDown={(e) => {
          if (n && e.button === 0) {
            depart.current = { x: e.clientX, t: performance.now() };
            deplace.current = false;
          }
        }}
      >
        {n === 0 && (
          <p className={styles.vide}>
            {!texte && (etablissement || actifs.length)
              ? // Les statistiques comptent toutes les fiches ; le carrousel, seulement les parcours rendus publics.
                "Aucun parcours public pour l’instant : les anciens concernés n’ont pas encore choisi d’apparaître sur cette page."
              : "Aucun parcours ne correspond à votre recherche."}
          </p>
        )}
        {liste.map((c, i) => (
          <div
            key={c.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={styles.carte}
            data-active={i === courant}
            data-retournee={retournee === c.id}
            role="group"
            aria-roledescription="carte"
            aria-hidden={i !== courant}
            onClick={() => {
              if (!deplace.current && i !== courant) aller(i);
            }}
          >
            <div className={styles.voile} />
            <ContenuCarte
              carte={c}
              position={i + 1}
              total={n}
              active={i === courant}
              retournee={retournee === c.id}
              court={court}
              onRetourner={() => setRetournee((r) => (r === c.id ? null : c.id))}
            />
          </div>
        ))}
      </div>

      <div className={styles.commandes}>
        <button
          type="button"
          className={styles.fleche}
          onClick={() => aller(courant - 1)}
          disabled={!n || (!boucle && courant === 0)}
          aria-label="Parcours précédent"
        >
          <ChevronLeft size={22} strokeWidth={2.2} aria-hidden />
        </button>
        <div className={styles.position}>
          <div className={styles.compteur}>
            {n ? (
              <>
                {String(courant + 1).padStart(2, "0")} <small>/ {String(n).padStart(2, "0")} parcours</small>
              </>
            ) : (
              <small>0 parcours</small>
            )}
          </div>
          <div className={styles.barre}>
            <div style={{ width: n ? `${((courant + 1) / n) * 100}%` : 0 }} />
          </div>
        </div>
        <button
          type="button"
          className={styles.fleche}
          onClick={() => aller(courant + 1)}
          disabled={!n || (!boucle && courant === n - 1)}
          aria-label="Parcours suivant"
        >
          <ChevronRight size={22} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {actuel ? `Parcours ${courant + 1} sur ${n} : ${actuel.prenom} ${actuel.nom}` : ""}
      </p>

      <div className={styles.trouver}>
        <p className={styles.trouverTitre}>Trouver un parcours</p>
        <RechercheParcours
          cartes={cartes}
          domaines={domaines}
          actifs={actifs}
          texte={texte}
          onTexte={(t) => filtrer(() => setTexte(t))}
          onAjouterDomaine={(code) => filtrer(() => setActifs((a) => (a.includes(code) ? a : [...a, code])))}
          onRetirerDomaine={(code) => filtrer(() => setActifs((a) => a.filter((x) => x !== code)))}
          etablissement={etablissement}
          onRetirerEtablissement={() => filtrer(() => setEtablissement(null))}
          onPersonne={(id) => {
            setActifs([]);
            setEtablissement(null);
            setTexte("");
            setRetournee(null);
            setCourant(Math.max(0, cartes.findIndex((c) => c.id === id)));
          }}
        />
      </div>
    </section>
  );
}
