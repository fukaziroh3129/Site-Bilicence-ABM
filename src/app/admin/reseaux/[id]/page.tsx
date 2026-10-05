import { notFound } from "next/navigation";
import { EnTeteConsole, FilAriane } from "@/components/ui";
import { prisma } from "@/lib/db";
import { exigerBureau } from "@/lib/session";
import { FormulairePostSocial } from "./formulaire";

export const metadata = { title: "Post de réseau social" };

// /admin/reseaux/nouveau pour ajouter, /admin/reseaux/<id> pour modifier.
export default async function AdminPostSocial({ params }: PageProps<"/admin/reseaux/[id]">) {
  await exigerBureau();
  const { id } = await params;
  const post = id === "nouveau" ? null : await prisma.postSocial.findUnique({ where: { id } });
  if (id !== "nouveau" && !post) notFound();

  return (
    <div className="mx-auto -mt-4 max-w-3xl space-y-6">
      <FilAriane retour={{ href: "/admin/reseaux", libelle: "Réseaux" }} ici={post ? post.legende : "Nouveau post"} />
      <EnTeteConsole titre={post ? "Modifier le post" : "Ajouter un post"} />
      <div className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-8">
        <FormulairePostSocial post={post} />
      </div>
    </div>
  );
}
