"use client";

// Contenu d'une carte (recto et verso). Sa position dans le carrousel est gérée par CarrouselParcours.

import { ChevronDown, Globe, MapPin, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./carrousel.module.css";
import type { CarteParcours, EtapeCarte } from "./types";

/** Couleur de la petite pastille devant l'étiquette de situation. */
const COULEURS_STATUT: Record<string, string> = {
  EN_LICENCE: "#FFFFFF",
  EN_MASTER: "#F2D9D9",
  EN_DOCTORAT: "#BFD3F2",
  EN_ALTERNANCE: "#F6D38B",
  EN_POSTE: "#9FD8B0",
  CESURE: "#E2C8F0",
  EN_RECHERCHE: "#F4B9A6",
};

/** Le parcours : une fenêtre de hauteur fixe qu'on fait défiler (molette ou doigt) quand il est long. */
function ZoneParcours({ etapes, nom, active }: { etapes: EtapeCarte[]; nom: string; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [suite, setSuite] = useState(false);
  const [avant, setAvant] = useState(false);

  const mesurer = useCallback(() => {
    const d = ref.current;
    if (!d) return;
    setSuite(d.scrollTop + d.clientHeight < d.scrollHeight - 2);
    setAvant(d.scrollTop > 2);
  }, []);

  useEffect(() => {
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    if (ref.current) observateur.observe(ref.current);
    return () => observateur.disconnect();
  }, [mesurer]);

  // Au-delà de 3 étapes, une ligne par étape pour en montrer davantage.
  const compact = etapes.length > 3;
  const defile = suite || avant;

  return (
    <div className={`${styles.blocParcours} ${suite ? styles.aSuite : ""} ${avant ? styles.aAvant : ""}`}>
      <p className={styles.titreBloc}>Parcours</p>
      <div
        ref={ref}
        className={styles.defile}
        onScroll={mesurer}
        tabIndex={active && defile ? 0 : -1}
        aria-label={defile ? `Parcours de ${nom} (faire défiler)` : undefined}
      >
        <ol className={`${styles.frise} ${compact ? styles.compacte : ""}`}>
          {etapes.map((e, k) => (
            <li key={k} data-base={e.base ? "true" : undefined} data-en-cours={e.enCours ? "true" : undefined}>
              {compact ? (
                <>
                  <b>{e.titre}</b> <span>· {e.lieu}</span>
                </>
              ) : (
                <>
                  <b>{e.titre}</b>
                  <span>{[e.detail, e.lieu, e.annees].filter(Boolean).join(" · ")}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      </div>
      <span className={styles.indice} aria-hidden>
        <ChevronDown size={16} strokeWidth={2.4} />
      </span>
    </div>
  );
}

export function ContenuCarte({
  carte,
  position,
  total,
  active,
  retournee,
  court,
  onRetourner,
}: {
  carte: CarteParcours;
  position: number;
  total: number;
  active: boolean;
  retournee: boolean;
  court: (code: string) => string;
  onRetourner: () => void;
}) {
  const nom = `${carte.prenom} ${carte.nom}`;
  const aUnVerso = !!(carte.presentation || carte.erasmus.length || carte.experiences.length || carte.conseil);
  // Seule la face visible de la carte centrale est atteignable au clavier.
  const tabRecto = active && !retournee ? 0 : -1;
  const tabVerso = active && retournee ? 0 : -1;

  return (
    <div className={styles.retournable}>
      <article className={styles.face} aria-hidden={retournee || undefined} aria-label={`${nom}, parcours ${position} sur ${total}`}>
        <div className={styles.haut}>
          <Image src="/brand/logo-abm-seal-white.png" alt="" width={150} height={150} className={styles.filigrane} />
          {carte.statut && (
            <span className={styles.statut} style={{ "--pastille": COULEURS_STATUT[carte.statut.code] } as React.CSSProperties}>
              {carte.statut.libelle}
            </span>
          )}
          {carte.ville && (
            <span className={styles.villeHaut}>
              <MapPin size={13} strokeWidth={2.2} aria-hidden />
              {carte.ville}
            </span>
          )}
        </div>
        <div className={styles.avatar} aria-hidden>
          {carte.prenom[0]}
          {carte.nom[0]}
        </div>
        <div className={styles.corps}>
          <div>
            <h2 className={styles.nom}>{nom}</h2>
            {carte.presentation && <p className={styles.accroche}>« {carte.presentation} »</p>}
          </div>
          {carte.aujourdhui && (
            <div>
              <p className={styles.titreBloc}>Aujourd’hui</p>
              <p className={styles.poste}>{carte.aujourdhui.titre}</p>
              {carte.aujourdhui.structure && <p className={styles.structure}>{carte.aujourdhui.structure}</p>}
            </div>
          )}
          <ZoneParcours etapes={carte.etapes} nom={nom} active={active && !retournee} />
          {carte.domaines.length > 0 && (
            <div className={styles.pastilles}>
              {carte.domaines.map((d) => (
                <span key={d} className={styles.pastille}>
                  {court(d)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={styles.pied}>
          <span className={styles.promo}>Promo {carte.promo}</span>
          {aUnVerso && (
            <button type="button" className={styles.retourner} tabIndex={tabRecto} onClick={onRetourner}>
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden /> En savoir plus
            </button>
          )}
        </div>
      </article>

      {aUnVerso && (
        <article className={`${styles.face} ${styles.verso}`} aria-hidden={!retournee || undefined} aria-label={`Détails sur ${nom}`}>
          <div className={styles.versoCorps}>
            <div>
              <p className={styles.titreBloc}>En quelques mots</p>
              <h2 className={styles.nom}>{nom}</h2>
            </div>
            {carte.presentation && <p className={styles.texte}>{carte.presentation}</p>}
            {(carte.erasmus.length > 0 || carte.experiences.length > 0) && (
              <div>
                <p className={styles.titreBloc}>Expériences</p>
                <ul className={styles.experiences}>
                  {carte.erasmus.map((e, k) => (
                    <li key={`erasmus-${k}`} className={styles.erasmus}>
                      <Globe size={22} strokeWidth={1.8} aria-hidden />
                      <div>
                        <i>Erasmus</i>
                        <b>
                          {e.universite} — {e.pays}
                        </b>
                        {e.details && <span>{e.details}</span>}
                        {e.descriptif && <span>{e.descriptif}</span>}
                      </div>
                    </li>
                  ))}
                  {carte.experiences.map((e, k) => (
                    <li key={k}>
                      <i>{e.type}</i>
                      <b>{[e.poste, e.organisation].filter(Boolean).join(" — ")}</b>
                      {e.resume && <span>{e.resume}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {carte.conseil && (
              <div>
                <p className={styles.titreBloc}>Son conseil aux étudiants</p>
                <p className={styles.conseil}>{carte.conseil}</p>
              </div>
            )}
          </div>
          <div className={styles.pied}>
            <span className={styles.promo}>Promo {carte.promo}</span>
            <button type="button" className={styles.retourner} tabIndex={tabVerso} onClick={onRetourner}>
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden /> Revenir
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
