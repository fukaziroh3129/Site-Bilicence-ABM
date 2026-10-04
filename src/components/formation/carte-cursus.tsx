"use client";

// « Économie et sciences politiques » : un vrai bouton qui ouvre la carte du cursus dans une
// fenêtre (pop-up). La carte montre les trois années en bandes (L1, L2, L3), les deux moitiés de la
// bi-licence en deux colonnes (économie à gauche, science politique à droite, le commun dessous),
// les matières en pastilles. Un clic sur une pastille ouvre sa mini-fiche (semestre, crédits, heures).
// Les disciplines se distinguent aussi sans la couleur : pastille pleine, claire ou en pointillés.

import { Landmark, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FACULTE, LIBELLES_DISCIPLINE, MATIERES, type Discipline, type Matiere } from "@/lib/formation";
import styles from "./carte-cursus.module.css";

const ANNEES = [1, 2, 3] as const;
const anneeDe = (s: number) => Math.ceil(s / 2);
const SAISON = (s: number) => (s % 2 === 1 ? "automne" : "printemps");

const total = (liste: Matiere[], d?: Discipline) => liste.filter((x) => !d || x.discipline === d).reduce((s, x) => s + x.ects, 0);
const compte = (d: Discipline) => MATIERES.filter((x) => x.discipline === d).length;

export function OuvrirCursus() {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [ouvert, setOuvert] = useState(false);

  function ouvrir() {
    dialogue.current?.showModal();
    setOuvert(true);
  }
  function fermer() {
    dialogue.current?.close();
  }

  // Page figée derrière la fenêtre tant qu'elle est ouverte.
  useEffect(() => {
    if (!ouvert) return;
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = avant;
    };
  }, [ouvert]);

  return (
    <>
      <button type="button" onClick={ouvrir} className={`group ${styles.declencheur}`} aria-haspopup="dialog">
        <span className={`fond-bordeaux ${styles.moitie}`}>
          <TrendingUp size={30} strokeWidth={1.5} aria-hidden className="text-white/80" />
          <span className="mt-4 block font-display text-3xl font-bold">Économie</span>
          <span className="mt-2 block text-sm text-white/76">Micro et macroéconomie, statistiques, histoire et pensée économiques…</span>
          <span className="eyebrow mt-5 block text-white/70">
            {compte("ECO")} matières · {total(MATIERES, "ECO")} ECTS
          </span>
        </span>
        <span className={`${styles.moitie} ${styles.moitieClaire}`}>
          <Landmark size={30} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
          <span className="mt-4 block font-display text-3xl font-bold text-bordeaux-700">Science politique</span>
          <span className="mt-2 block text-sm text-ink-soft">Vie politique, relations internationales, sociologie, politiques publiques…</span>
          <span className="eyebrow mt-5 block text-bordeaux-600">
            {compte("SCPO")} matières · {total(MATIERES, "SCPO")} ECTS
          </span>
        </span>
        <span aria-hidden className={styles.jonction}>
          +
        </span>
        <span className={styles.appel}>
          Voir toutes les matières sur la carte du cursus
          <span aria-hidden className="fleche">→</span>
        </span>
      </button>

      <dialog
        ref={dialogue}
        className={styles.dialogue}
        aria-labelledby="titre-cursus"
        onClose={() => setOuvert(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) fermer(); // clic sur le fond
        }}
      >
        {ouvert && <CarteCursus onFermer={fermer} />}
      </dialog>
    </>
  );
}

type Filtre = "TOUT" | Discipline;

function CarteCursus({ onFermer }: { onFermer: () => void }) {
  const [filtre, setFiltre] = useState<Filtre>("TOUT");
  const [choisie, setChoisie] = useState<Matiere | null>(null);
  const fiche = useRef<HTMLElement>(null);

  // Sur mobile, la mini-fiche s'affiche sous la carte : on l'amène à l'écran.
  useEffect(() => {
    if (choisie && window.matchMedia("(max-width: 1023px)").matches) fiche.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [choisie]);

  const parAnnee = useMemo(() => ANNEES.map((a) => MATIERES.filter((x) => anneeDe(x.semestre) === a)), []);

  return (
    <div className={styles.contenu}>
      <header className={styles.entete}>
        <div>
          <p className="eyebrow text-bordeaux-600">Bi-licence · 3 ans · 180 ECTS</p>
          <h2 id="titre-cursus" className="mt-1 font-display text-2xl font-bold text-bordeaux-700 sm:text-3xl">
            La carte du cursus
          </h2>
        </div>
        <div className={styles.filtres} role="group" aria-label="Mettre en avant une discipline">
          {(["TOUT", "ECO", "SCPO", "COMMUN"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filtre === f} onClick={() => setFiltre(f)}>
              {f !== "TOUT" && <i aria-hidden className={styles.temoin} data-discipline={f} />}
              {f === "TOUT" ? "Tout" : LIBELLES_DISCIPLINE[f]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onFermer} className={styles.fermer} aria-label="Fermer la carte du cursus">
          <X size={20} aria-hidden />
        </button>
      </header>

      <div className={styles.corps}>
        <div className="space-y-5">
          {parAnnee.map((liste, i) => {
            const annee = ANNEES[i];
            const eco = total(liste, "ECO");
            const scpo = total(liste, "SCPO");
            const commun = total(liste, "COMMUN");
            const tous = eco + scpo + commun;
            return (
              <section key={annee} className={styles.bande} aria-label={`Licence ${annee}`} style={{ animationDelay: `${i * 90}ms` }}>
                <div className={styles.bandeTete}>
                  <span className={styles.annee}>L{annee}</span>
                  <span className="text-sm text-ink-soft">
                    Semestres {annee * 2 - 1} et {annee * 2} · {tous} ECTS
                  </span>
                </div>

                {/* Équilibre de l'année entre les deux disciplines (en crédits) */}
                <div className={styles.equilibre} aria-hidden>
                  <span data-discipline="ECO" style={{ flexGrow: eco }} />
                  <span data-discipline="COMMUN" style={{ flexGrow: commun }} />
                  <span data-discipline="SCPO" style={{ flexGrow: scpo }} />
                </div>
                <p className="mt-1 flex justify-between gap-3 text-xs text-ink-soft">
                  <span>Économie {eco}&nbsp;ECTS</span>
                  <span>Commun {commun}&nbsp;ECTS</span>
                  <span>Science politique {scpo}&nbsp;ECTS</span>
                </p>

                <div className={styles.moities}>
                  {(["ECO", "SCPO"] as const).map((d) => (
                    <div key={d} className={styles.colonne} data-discipline={d}>
                      <p className={styles.colonneTitre}>{LIBELLES_DISCIPLINE[d]}</p>
                      <Pastilles liste={liste.filter((x) => x.discipline === d)} filtre={filtre} choisie={choisie} onChoisir={setChoisie} />
                    </div>
                  ))}
                </div>
                <div className={styles.commun}>
                  <Pastilles liste={liste.filter((x) => x.discipline === "COMMUN")} filtre={filtre} choisie={choisie} onChoisir={setChoisie} />
                </div>
              </section>
            );
          })}
        </div>

        <aside ref={fiche} className={styles.fiche} aria-live="polite">
          {choisie ? (
            <MiniFiche matiere={choisie} onFermer={() => setChoisie(null)} />
          ) : (
            <p className="text-sm text-ink-soft">
              Cliquez sur une matière pour voir sa fiche&nbsp;: semestre, crédits, heures de cours.
            </p>
          )}
        </aside>
      </div>
      <p className={styles.source}>
        Maquette 2024-2025 de la Faculté d’Économie, susceptible d’évoluer d’une année à l’autre. Des options facultatives
        (sport, projet étudiant, certification Voltaire, PIX…) s’ajoutent chaque semestre.
      </p>
    </div>
  );
}

function Pastilles({
  liste,
  filtre,
  choisie,
  onChoisir,
}: {
  liste: Matiere[];
  filtre: Filtre;
  choisie: Matiere | null;
  onChoisir: (m: Matiere) => void;
}) {
  return (
    <ul className={styles.pastilles}>
      {liste.map((x, i) => (
        <li key={x.id}>
          <button
            type="button"
            className={styles.pastille}
            data-discipline={x.discipline}
            data-estompee={(filtre !== "TOUT" && filtre !== x.discipline) || undefined}
            aria-pressed={choisie?.id === x.id}
            onClick={() => onChoisir(x)}
            style={{ animationDelay: `${120 + i * 35}ms` }}
          >
            <small>S{x.semestre}</small>
            {x.nom}
          </button>
        </li>
      ))}
    </ul>
  );
}

function MiniFiche({ matiere: x, onFermer }: { matiere: Matiere; onFermer: () => void }) {
  return (
    <div key={x.id} className={styles.ficheContenu}>
      <div className="flex items-start justify-between gap-3">
        <span className={styles.ficheDiscipline} data-discipline={x.discipline}>
          {LIBELLES_DISCIPLINE[x.discipline]}
        </span>
        <button type="button" onClick={onFermer} className={styles.ficheFermer} aria-label="Fermer la fiche">
          <X size={16} aria-hidden />
        </button>
      </div>
      <h3 className="mt-3 font-display text-xl font-bold leading-snug text-bordeaux-700">{x.nom}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        L{anneeDe(x.semestre)} · semestre {x.semestre} ({SAISON(x.semestre)})
      </p>

      <dl className={styles.ficheChiffres}>
        <div>
          <dt>Crédits</dt>
          <dd>
            {x.ects}
            <small>&nbsp;ECTS</small>
          </dd>
        </div>
        {x.cm !== undefined && (
          <div>
            <dt>Cours magistral</dt>
            <dd>
              {x.cm}
              <small>&nbsp;h</small>
            </dd>
          </div>
        )}
        {x.td !== undefined && (
          <div>
            <dt>Travaux dirigés</dt>
            <dd>
              {x.td}
              <small>&nbsp;h</small>
            </dd>
          </div>
        )}
      </dl>

      <p className="mt-4 text-sm">
        <span className="font-semibold">Enseignée par&nbsp;:</span> {FACULTE[x.discipline]}
      </p>
      {x.contenu ? (
        <p className="mt-3 text-sm leading-relaxed">{x.contenu}</p>
      ) : (
        <p className="mt-3 rounded-abm-sm border border-dashed border-bordeaux-300 px-3 py-2 text-xs text-ink-soft">
          <span className="font-semibold text-bordeaux-700">Contenu à compléter</span>&nbsp;: l’université ne publie pas encore le
          descriptif de cette matière.
        </p>
      )}
    </div>
  );
}
