import { notFound } from "next/navigation";
import { FormulaireExperience } from "@/components/fiche/formulaire-experience";
import { parametre } from "@/components/filtres";
import { GabaritSousPageFiche } from "@/components/fiche/gabarit-sous-page";
import { exigerDroitSurFiche, pageDeFiche } from "@/lib/acces";
import { prisma } from "@/lib/db";
import { motifNecessaire } from "@/lib/notes";
import { optionsDomaines } from "@/lib/domaines";
import { exigerCompte } from "@/lib/session";

export const metadata = { title: "Expérience" };

// Ajout (sans ?id=) ou modification (avec ?id=) d'une expérience (stage, emploi, associatif…).
// ?personne= permet au bureau de modifier la fiche de quelqu'un d'autre.
export default async function PageExperience({ searchParams }: PageProps<"/espace/ma-fiche/experience">) {
  const { user } = await exigerCompte(); // comptes en attente compris : ils remplissent leur fiche
  const p = await searchParams;
  const personneId = parametre(p.personne) ?? user.personneId;
  if (!personneId) notFound();
  const { estProprietaire } = await exigerDroitSurFiche(personneId);

  const id = parametre(p.id);
  const experience = id ? await prisma.experience.findUnique({ where: { id, personneId } }) : null;
  if (id && !experience) notFound();

  return (
    <GabaritSousPageFiche
      retour={pageDeFiche(personneId, estProprietaire, "experiences")}
      estProprietaire={estProprietaire}
      etape="experiences"
      titre={experience ? "Modifier une expérience" : "Ajouter une expérience"}
    >
      <FormulaireExperience
        personneId={personneId}
        experience={experience}
        optionsDomaines={await optionsDomaines()}
        demanderMotif={await motifNecessaire({ personneId, estProprietaire })}
      />
    </GabaritSousPageFiche>
  );
}
