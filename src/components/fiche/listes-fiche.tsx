// Listes modifiables d'une fiche (formations, Erasmus, expériences) : utilisées par l'éditeur
// complet (administration) et par l'assistant « Ma fiche ».

import { Pencil } from "lucide-react";
import Link from "next/link";
import { supprimerErasmus, supprimerExperience, supprimerFormation } from "@/actions/fiche";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { Pastille, Vide, classeLien } from "@/components/ui";
import type { Erasmus, Experience, Formation, Etablissement } from "@/generated/prisma/client";
import { LIBELLES_NIVEAU, LIBELLES_TYPE_EXPERIENCE, periode } from "@/lib/format";
import { LIBELLES_DUREE_ERASMUS, nomPays } from "@/lib/pays";

type Proprietes<T> = {
  personneId: string;
  /** « personne=<id>& » quand le bureau modifie la fiche de quelqu'un d'autre, sinon vide. */
  parametre: string;
  elements: T[];
  /** Le bureau modifie la fiche d'un membre : motif demandé avant chaque suppression (ADM-02). */
  demanderMotif?: boolean;
};

const champsSuppression = (personneId: string, id: string) => ({ id, personneId });

export function ListeFormations({ personneId, parametre, elements, demanderMotif }: Proprietes<Formation>) {
  return (
    <>
    {elements.length === 0 ? (
      <Vide>Aucune formation renseignée.</Vide>
    ) : (
      <ul className="divide-y divide-bordeaux-700/10">
        {elements.map((f) => (
          <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div>
              <p className="font-semibold text-ink">{f.intitule}</p>
              <p className="text-sm text-ink-soft">
                {[f.parcours, f.etablissement, [f.anneeDebut, f.anneeFin].filter(Boolean).join(" — ")].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/espace/ma-fiche/formation?${parametre}id=${f.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
                <Pencil size={14} aria-hidden /> Modifier
              </Link>
              <BoutonSupprimer action={supprimerFormation} champs={champsSuppression(personneId, f.id)} demanderMotif={demanderMotif} />
            </div>
          </li>
        ))}
      </ul>
    )}
    </>
  );
}

export function ListeErasmus({ personneId, parametre, elements, demanderMotif }: Proprietes<Erasmus & { universite: Etablissement }>) {
  return (
    <>
    {elements.length === 0 ? (
      <Vide>Aucun séjour Erasmus renseigné (tout séjour d’études à l’étranger compte).</Vide>
    ) : (
      <ul className="divide-y divide-bordeaux-700/10">
        {elements.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                {e.universite.nom}
              </p>
              <p className="text-sm text-ink-soft">
                {[nomPays(e.universite.pays), e.niveau && LIBELLES_NIVEAU[e.niveau], e.annee, e.duree && LIBELLES_DUREE_ERASMUS[e.duree]]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/espace/ma-fiche/erasmus?${parametre}id=${e.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
                <Pencil size={14} aria-hidden /> Modifier
              </Link>
              <BoutonSupprimer action={supprimerErasmus} champs={champsSuppression(personneId, e.id)} demanderMotif={demanderMotif} />
            </div>
          </li>
        ))}
      </ul>
    )}
    </>
  );
}

export function ListeExperiences({ personneId, parametre, elements, demanderMotif }: Proprietes<Experience>) {
  return (
    <>
    {elements.length === 0 ? (
      <Vide>Aucune expérience renseignée.</Vide>
    ) : (
      <ul className="divide-y divide-bordeaux-700/10">
        {elements.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                {e.organisation}
                <Pastille>{LIBELLES_TYPE_EXPERIENCE[e.type]}</Pastille>
                {e.niveau && <Pastille>{LIBELLES_NIVEAU[e.niveau]}</Pastille>}
              </p>
              <p className="text-sm text-ink-soft">
                {[e.poste, e.ville, periode(e.debut, e.fin)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/espace/ma-fiche/experience?${parametre}id=${e.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
                <Pencil size={14} aria-hidden /> Modifier
              </Link>
              <BoutonSupprimer action={supprimerExperience} champs={champsSuppression(personneId, e.id)} demanderMotif={demanderMotif} />
            </div>
          </li>
        ))}
      </ul>
    )}
    </>
  );
}
