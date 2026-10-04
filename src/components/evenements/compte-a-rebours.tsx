"use client";

// Compte à rebours jusqu'au prochain événement (chiffres réels, mis à jour chaque minute).
// Calculé seulement dans le navigateur, pour afficher l'heure exacte du visiteur.

import { useEffect, useState } from "react";

export function CompteARebours({ debut }: { debut: string }) {
  const [maintenant, setMaintenant] = useState<number | null>(null);

  useEffect(() => {
    const maj = () => setMaintenant(Date.now());
    const premier = setTimeout(maj, 0);
    const minute = setInterval(maj, 60_000);
    return () => {
      clearTimeout(premier);
      clearInterval(minute);
    };
  }, []);

  const reste = maintenant === null ? null : Math.max(0, new Date(debut).getTime() - maintenant);
  const minutes = reste === null ? null : Math.floor(reste / 60_000);
  // Plus d'un jour : jours + heures ; sinon heures + minutes.
  const cases =
    minutes === null
      ? [
          { valeur: "–", libelle: "jours" },
          { valeur: "–", libelle: "heures" },
        ]
      : minutes >= 24 * 60
        ? [
            { valeur: Math.floor(minutes / (24 * 60)), libelle: Math.floor(minutes / (24 * 60)) > 1 ? "jours" : "jour" },
            { valeur: Math.floor(minutes / 60) % 24, libelle: "heures" },
          ]
        : [
            { valeur: Math.floor(minutes / 60), libelle: "heures" },
            { valeur: minutes % 60, libelle: "minutes" },
          ];

  return (
    <div className="flex gap-2.5 text-center" role="timer" aria-label="Temps restant avant l’événement">
      {cases.map((c) => (
        <div key={c.libelle} className="min-w-[76px] rounded-abm-md bg-white/10 px-3.5 py-2.5">
          <span className="block font-display text-4xl font-extrabold leading-none tabular-nums">{c.valeur}</span>
          <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/80">{c.libelle}</span>
        </div>
      ))}
    </div>
  );
}
