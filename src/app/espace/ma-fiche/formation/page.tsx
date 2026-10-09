import { notFound } from "next/navigation";
import { FormulaireFormation } from "@/components/fiche/formulaire-formation";
import { parametre } from "@/components/filtres";
import { GabaritSousPageFiche } from "@/components/fiche/gabarit-sous-page";
import { exigerDroitSurFiche, pageDeFiche } from "@/lib/acces";
import { prisma } from "@/lib/db";
import { nomsEtablissements } from "@/lib/liste-etablissements";
import { groupesMentions } from "@/lib/liste-mentions";
import { motifNecessaire } from "@/lib/notes";
import { exigerCompte } from "@/lib/session";

export const metadata = { title: "Formation" };

// Ajout (sans ?id=) ou modification (avec ?id=) d'une formation.
// ?personne= permet au bureau de modifier la fiche de quelqu'un d'autre.
export default async function PageFormation({ searchParams }: PageProps<"/espace/ma-fiche/formation">) {
  const { user } = await exigerCompte(); // comptes en attente compris : ils remplissent leur fiche
  const p = await searchParams;
  const personneId = parametre(p.personne) ?? user.personneId;
  if (!personneId) notFound();
  const { estProprietaire } = await exigerDroitSurFiche(personneId);

  const id = parametre(p.id);
  const formation = id ? await prisma.formation.findUnique({ where: { id, personneId } }) : null;
  if (id && !formation) notFound();

  return (
    <GabaritSousPageFiche
      retour={pageDeFiche(personneId, estProprietaire, "etudes")}
      estProprietaire={estProprietaire}
      etape="etudes"
      titre={formation ? "Modifier une formation" : "Ajouter une formation"}
    >
      <FormulaireFormation
        personneId={personneId}
        formation={formation}
        etablissements={await nomsEtablissements()}
        mentions={await groupesMentions()}
        demanderMotif={await motifNecessaire({ personneId, estProprietaire })}
      />
    </GabaritSousPageFiche>
  );
}
