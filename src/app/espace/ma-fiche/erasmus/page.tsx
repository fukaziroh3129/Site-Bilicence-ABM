import { notFound } from "next/navigation";
import { FormulaireErasmus } from "@/components/fiche/formulaire-erasmus";
import { parametre } from "@/components/filtres";
import { GabaritSousPageFiche } from "@/components/fiche/gabarit-sous-page";
import { exigerDroitSurFiche, pageDeFiche } from "@/lib/acces";
import { prisma } from "@/lib/db";
import { motifNecessaire } from "@/lib/notes";
import { exigerCompte } from "@/lib/session";
import { optionsPays, universitesPourFormulaire } from "@/lib/liste-etablissements";

export const metadata = { title: "Erasmus" };

// Ajout (sans ?id=) ou modification (avec ?id=) d'un séjour Erasmus.
// ?personne= permet au bureau de modifier la fiche de quelqu'un d'autre.
export default async function PageErasmus({ searchParams }: PageProps<"/espace/ma-fiche/erasmus">) {
  const { user } = await exigerCompte(); // comptes en attente compris : ils remplissent leur fiche
  const p = await searchParams;
  const personneId = parametre(p.personne) ?? user.personneId;
  if (!personneId) notFound();
  const { estProprietaire } = await exigerDroitSurFiche(personneId);

  const id = parametre(p.id);
  const sejour = id ? await prisma.erasmus.findUnique({ where: { id, personneId }, include: { universite: true } }) : null;
  if (id && !sejour) notFound();

  return (
    <GabaritSousPageFiche
      retour={pageDeFiche(personneId, estProprietaire, "erasmus")}
      estProprietaire={estProprietaire}
      etape="erasmus"
      titre={sejour ? "Modifier un Erasmus" : "Ajouter un Erasmus"}
    >
      <FormulaireErasmus
        personneId={personneId}
        sejour={sejour}
        paysDeLUniversite={sejour?.universite.pays}
        optionsPays={optionsPays()}
        universites={await universitesPourFormulaire()}
        demanderMotif={await motifNecessaire({ personneId, estProprietaire })}
      />
    </GabaritSousPageFiche>
  );
}
