"use client";

// Fenêtre (pop-up) accessible, basée sur l'élément <dialog> du navigateur : focus piégé dans la
// fenêtre, fermeture par Échap, par le bouton ou par un clic sur le fond, page figée derrière.

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./fenetre.module.css";

type ProprietesFenetre = {
  ouverte: boolean;
  onFermer: () => void;
  titre: React.ReactNode;
  /** Petite ligne au-dessus du titre (type, date…). */
  surtitre?: React.ReactNode;
  /** Zone fixe en bas de la fenêtre (liens, boutons). */
  pied?: React.ReactNode;
  etroite?: boolean;
  children: React.ReactNode;
};

export function Fenetre({ ouverte, onFermer, titre, surtitre, pied, etroite, children }: ProprietesFenetre) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitre = useId();

  useEffect(() => {
    const dialogue = ref.current;
    if (!dialogue) return;
    if (ouverte && !dialogue.open) dialogue.showModal();
    if (!ouverte && dialogue.open) dialogue.close();
  }, [ouverte]);

  // Page figée derrière la fenêtre tant qu'elle est ouverte.
  useEffect(() => {
    if (!ouverte) return;
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = avant;
    };
  }, [ouverte]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitre}
      className={`${styles.fenetre} ${etroite ? styles.etroite : ""}`}
      onClose={onFermer}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer(); // clic sur le fond
      }}
    >
      {ouverte && (
        <>
          <div className={`fond-bordeaux ${styles.entete}`}>
            {surtitre && <p className="eyebrow text-white/76">{surtitre}</p>}
            <h2 id={idTitre} className="mt-1 font-display text-2xl font-bold leading-tight">
              {titre}
            </h2>
            <button type="button" onClick={onFermer} className={styles.fermer}>
              <X size={22} aria-hidden />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
          <div className={styles.corps}>{children}</div>
          {pied && <div className={styles.pied}>{pied}</div>}
        </>
      )}
    </dialog>
  );
}

/** Bouton qui ouvre une fenêtre. Le contenu peut être préparé côté serveur (children). */
export function BoutonFenetre({
  libelle,
  classeBouton,
  ...fenetre
}: Omit<ProprietesFenetre, "ouverte" | "onFermer"> & { libelle: React.ReactNode; classeBouton: string }) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOuverte(true)} className={classeBouton}>
        {libelle}
      </button>
      <Fenetre {...fenetre} ouverte={ouverte} onFermer={() => setOuverte(false)} />
    </>
  );
}
