// Édition complète d'une fiche sur une seule page, pour le bureau (administration).
// Les membres remplissent la leur avec l'assistant par étapes (src/components/fiche/assistant-fiche.tsx).

import { Plus } from "lucide-react";
import Link from "next/link";
import { FormulaireInfos } from "@/components/fiche/formulaire-infos";
import { ListeErasmus, ListeExperiences, ListeFormations } from "@/components/fiche/listes-fiche";
import { TitreSection, classeLien } from "@/components/ui";
import type { Erasmus, Experience, Formation, Personne, Etablissement } from "@/generated/prisma/client";
import { MAX_DOMAINES_PAR_FICHE, optionsDomaines } from "@/lib/domaines";

type PersonneComplete = Personne & {
  formations: Formation[];
  experiences: Experience[];
  erasmus: (Erasmus & { universite: Etablissement })[];
};

export async function EditeurFiche({
  personne,
  pourAutrui,
  demanderMotif = false,
}: {
  personne: PersonneComplete;
  pourAutrui: boolean;
  /** La fiche d'un membre (avec compte) : chaque modification demande un motif, transmis à la personne (ADM-02). */
  demanderMotif?: boolean;
}) {
  const domaines = await optionsDomaines();
  const parametre = pourAutrui ? `personne=${personne.id}&` : "";

  return (
    <div className="space-y-14">
      <section>
        <TitreSection>Informations</TitreSection>
        <div className="mt-6">
          <FormulaireInfos personne={personne} pourAutrui={pourAutrui} demanderMotif={demanderMotif} optionsDomaines={domaines} maxDomaines={MAX_DOMAINES_PAR_FICHE} />
        </div>
      </section>

      <section>
        <TitreSection
          action={
            <Link href={`/espace/ma-fiche/formation?${parametre}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
              <Plus size={16} aria-hidden /> Ajouter une formation
            </Link>
          }
        >
          Formations après la licence
        </TitreSection>
        <ListeFormations personneId={personne.id} parametre={parametre} elements={personne.formations} demanderMotif={demanderMotif} />
      </section>

      <section>
        <TitreSection
          action={
            <Link href={`/espace/ma-fiche/erasmus?${parametre}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
              <Plus size={16} aria-hidden /> Ajouter un Erasmus
            </Link>
          }
        >
          Erasmus
        </TitreSection>
        <ListeErasmus personneId={personne.id} parametre={parametre} elements={personne.erasmus} demanderMotif={demanderMotif} />
      </section>

      <section>
        <TitreSection
          action={
            <Link href={`/espace/ma-fiche/experience?${parametre}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
              <Plus size={16} aria-hidden /> Ajouter une expérience
            </Link>
          }
        >
          Expériences (stages, emplois, associatif…)
        </TitreSection>
        <ListeExperiences personneId={personne.id} parametre={parametre} elements={personne.experiences} demanderMotif={demanderMotif} />
      </section>
    </div>
  );
}
