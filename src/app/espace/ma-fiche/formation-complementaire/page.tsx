import { notFound } from "next/navigation";
import { FormulaireComplementaire } from "@/components/fiche/formulaire-complementaire";
import { GabaritSousPageFiche } from "@/components/fiche/gabarit-sous-page";
import { parametre } from "@/components/filtres";
import { exigerDroitSurFiche, pageDeFiche } from "@/lib/acces";
import { prisma } from "@/lib/db";
import { nomsEtablissements } from "@/lib/liste-etablissements";
import { motifNecessaire } from "@/lib/notes";
import { exigerCompte } from "@/lib/session";

export const metadata = { title: "Formation complémentaire" };

// Ajout (sans ?id=) ou modification (avec ?id=) d'une formation complémentaire (DU, certification, MOOC…).
// ?personne= permet au bureau de modifier la fiche de quelqu'un d'autre.
export default async function PageFormationComplementaire({ searchParams }: PageProps<"/espace/ma-fiche/formation-complementaire">) {
  const { user } = await exigerCompte(); // comptes en attente compris : ils remplissent leur fiche
  const p = await searchParams;
  const personneId = parametre(p.personne) ?? user.personneId;
  if (!personneId) notFound();
  const { estProprietaire } = await exigerDroitSurFiche(personneId);

  const id = parametre(p.id);
  const formation = id ? await prisma.formationComplementaire.findUnique({ where: { id, personneId } }) : null;
  if (id && !formation) notFound();

  return (
    <GabaritSousPageFiche
      retour={pageDeFiche(personneId, estProprietaire, "etudes")}
      estProprietaire={estProprietaire}
      etape="etudes"
      titre={formation ? "Modifier une formation complémentaire" : "Ajouter une formation complémentaire"}
    >
      <FormulaireComplementaire
        personneId={personneId}
        formation={formation}
        etablissements={await nomsEtablissements()}
        demanderMotif={await motifNecessaire({ personneId, estProprietaire })}
      />
    </GabaritSousPageFiche>
  );
}
