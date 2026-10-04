import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VueFiche } from "@/components/fiche/vue-fiche";
import { FilAriane, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { estAdministrateur } from "@/lib/roles";
import { exigerMembreActif } from "@/lib/session";
import { FICHE_VISIBLE } from "@/lib/visibilite";

export const metadata = { title: "Fiche" };

export default async function FicheAnnuaire({ params }: PageProps<"/espace/annuaire/[id]">) {
  const { user } = await exigerMembreActif();
  const { id } = await params;

  const personne = await prisma.personne.findFirst({
    where: { id, ...FICHE_VISIBLE },
    include: {
      formations: { orderBy: [{ anneeDebut: "desc" }, { creeLe: "desc" }] },
      experiences: { orderBy: [{ debut: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }] },
      erasmus: { include: { universite: true }, orderBy: [{ annee: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }] },
    },
  });
  if (!personne) notFound();

  const estMoi = user.personneId === personne.id;

  return (
    <div className="-mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilAriane retour={{ href: "/espace/annuaire", libelle: "Annuaire" }} ici={`${personne.prenom} ${personne.nom}`} />
        {(estMoi || estAdministrateur(user.role)) && (
          <Link
            href={estMoi ? "/espace/ma-fiche" : `/admin/personnes/${personne.id}`}
            className={`inline-flex items-center gap-1 text-sm ${classeLien}`}
          >
            <Pencil size={14} aria-hidden /> Modifier cette fiche
          </Link>
        )}
      </div>
      <VueFiche personne={personne} voitTout={estMoi || estAdministrateur(user.role)} />
    </div>
  );
}
