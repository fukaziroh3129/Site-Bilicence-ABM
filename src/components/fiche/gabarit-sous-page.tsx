// Gabarit des sous-pages de « Ma fiche » (ajouter / modifier une formation, une expérience, un Erasmus) :
// retour vers l'étape de l'assistant, rappel de l'étape, formulaire dans un panneau.

import { FilAriane } from "@/components/ui";
import { ETAPES_FICHE, type EtapeFiche } from "@/lib/completude";

export function GabaritSousPageFiche({
  retour,
  estProprietaire,
  etape,
  titre,
  children,
}: {
  retour: string;
  estProprietaire: boolean;
  etape: EtapeFiche;
  titre: string;
  children: React.ReactNode;
}) {
  const rang = ETAPES_FICHE.findIndex((e) => e.cle === etape);
  const libelleEtape = `Étape ${rang + 1} sur ${ETAPES_FICHE.length} · ${ETAPES_FICHE[rang].titre}`;
  return (
    <div className="mx-auto -mt-4 max-w-3xl space-y-6">
      <FilAriane retour={{ href: retour, libelle: estProprietaire ? "Ma fiche" : "Retour à la fiche" }} ici={ETAPES_FICHE[rang].titre} />
      <div>
        <p className="eyebrow text-bordeaux-500">{libelleEtape}</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold text-bordeaux-700 sm:text-4xl">{titre}</h1>
      </div>
      <div className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-8">{children}</div>
    </div>
  );
}
