import { notFound } from "next/navigation";
import { EnTeteConsole, FilAriane } from "@/components/ui";
import { prisma } from "@/lib/db";
import { trierFonctions } from "@/lib/fonctions-bureau";
import { exigerBureau } from "@/lib/session";
import { FormulaireMembreBureau } from "./formulaire";

export const metadata = { title: "Membre du bureau" };

// /admin/bureau/nouveau pour ajouter, /admin/bureau/<id> pour modifier.
export default async function AdminMembreBureau({ params }: PageProps<"/admin/bureau/[id]">) {
  await exigerBureau();
  const { id } = await params;
  const membre = id === "nouveau" ? null : await prisma.membreBureau.findUnique({ where: { id }, include: { fonctions: { select: { id: true } } } });
  if (id !== "nouveau" && !membre) notFound();
  const fonctions = trierFonctions(await prisma.fonction.findMany({ select: { id: true, nom: true, niveau: true, ordre: true } }));
  const titre = membre ? `Modifier : ${membre.prenom} ${membre.nom}` : "Ajouter un membre du bureau";

  return (
    <div className="mx-auto -mt-4 max-w-3xl space-y-6">
      <FilAriane retour={{ href: "/admin/bureau", libelle: "Bureau" }} ici={membre ? `${membre.prenom} ${membre.nom}` : "Nouveau membre"} />
      <EnTeteConsole titre={titre} />
      <div className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-8">
        <FormulaireMembreBureau membre={membre} fonctions={fonctions} fonctionsDuMembre={membre?.fonctions.map((f) => f.id) ?? []} />
      </div>
    </div>
  );
}
