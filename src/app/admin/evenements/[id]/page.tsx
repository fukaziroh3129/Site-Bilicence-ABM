import { notFound } from "next/navigation";
import { EnTeteConsole, FilAriane } from "@/components/ui";
import { prisma } from "@/lib/db";
import { exigerBureau } from "@/lib/session";
import { FormulaireEvenement } from "./formulaire";

export const metadata = { title: "Événement" };

// /admin/evenements/nouveau pour créer, /admin/evenements/<id> pour modifier.
export default async function AdminEvenement({ params }: PageProps<"/admin/evenements/[id]">) {
  await exigerBureau();
  const { id } = await params;
  const evenement = id === "nouveau" ? null : await prisma.evenement.findUnique({ where: { id } });
  if (id !== "nouveau" && !evenement) notFound();
  const titre = evenement ? "Modifier l’événement" : "Nouvel événement";

  return (
    <div className="mx-auto -mt-4 max-w-3xl space-y-6">
      <FilAriane retour={{ href: "/admin/evenements", libelle: "Événements" }} ici={evenement?.titre ?? titre} />
      <EnTeteConsole titre={titre} />
      <div className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-8">
        <FormulaireEvenement evenement={evenement} />
      </div>
    </div>
  );
}
