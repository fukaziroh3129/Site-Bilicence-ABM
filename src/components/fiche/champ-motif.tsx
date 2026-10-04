"use client";

// Champ « Motif de la modification » (patch ADM-02), affiché dans les formulaires quand un
// administrateur modifie la fiche d'un membre. Le membre voit ce message sur « Ma fiche ».

import { ZoneTexte } from "@/components/formulaire";
import type { EtatFormulaire } from "@/lib/formulaire";

export const CHAMP_MOTIF = "motifModification";

export function ChampMotif({ etat }: { etat: EtatFormulaire }) {
  return (
    <div className="rounded-abm-md border border-bordeaux-700/30 bg-bordeaux-100 p-4">
      <ZoneTexte
        nom={CHAMP_MOTIF}
        libelle="Motif de la modification"
        requis
        rows={2}
        maxLength={500}
        aide="Obligatoire : ce que vous avez changé et pourquoi. La personne verra ce message sur sa fiche."
        etat={etat}
      />
    </div>
  );
}
