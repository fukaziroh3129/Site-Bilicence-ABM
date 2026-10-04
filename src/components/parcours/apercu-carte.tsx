"use client";

// Aperçu de sa propre carte « Que sont-ils devenus ? » dans « Ma fiche » (recto / verso).

import { useState } from "react";
import { ContenuCarte } from "./carte-parcours";
import styles from "./carrousel.module.css";
import type { CarteParcours } from "./types";

export function ApercuCarte({ carte, courts }: { carte: CarteParcours; courts: Record<string, string> }) {
  const [retournee, setRetournee] = useState(false);
  return (
    <div className={`${styles.carrousel} ${styles.apercu}`}>
      <div className={styles.carte} data-active="true" data-retournee={retournee}>
        <ContenuCarte
          carte={carte}
          position={1}
          total={1}
          active
          retournee={retournee}
          court={(code) => courts[code] ?? code}
          onRetourner={() => setRetournee((r) => !r)}
        />
      </div>
    </div>
  );
}
