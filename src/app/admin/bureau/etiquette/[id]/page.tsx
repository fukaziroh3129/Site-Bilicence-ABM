import { notFound } from "next/navigation";
import { EnTeteConsole, FilAriane } from "@/components/ui";
import { prisma } from "@/lib/db";
import { exigerBureau } from "@/lib/session";
import { FormulaireFonction } from "./formulaire";

export const metadata = { title: "Fonction ou pôle du bureau" };

// /admin/bureau/etiquette/nouveau pour ajouter, /admin/bureau/etiquette/<id> pour modifier.
export default async function AdminFonction({ params }: PageProps<"/admin/bureau/etiquette/[id]">) {
  await exigerBureau();
  const { id } = await params;
  const fonction = id === "nouveau" ? null : await prisma.fonction.findUnique({ where: { id } });
  if (id !== "nouveau" && !fonction) notFound();

  return (
    <div className="mx-auto -mt-4 max-w-3xl space-y-6">
      <FilAriane
        retour={{ href: "/admin/bureau?vue=etiquettes", libelle: "Fonctions et pôles" }}
        ici={fonction ? fonction.nom : "Nouvelle étiquette"}
      />
      <EnTeteConsole titre={fonction ? `Modifier : ${fonction.nom}` : "Ajouter une fonction ou un pôle"} />
      <div className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-8">
        <FormulaireFonction fonction={fonction} />
      </div>
    </div>
  );
}
