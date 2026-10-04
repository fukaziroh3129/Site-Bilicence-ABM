import { notFound } from "next/navigation";
import { EnTeteConsole, FilAriane } from "@/components/ui";
import { prisma } from "@/lib/db";
import { exigerBureau } from "@/lib/session";
import { FormulaireArticle } from "./formulaire";

export const metadata = { title: "Article" };

// /admin/actualites/nouveau pour créer, /admin/actualites/<id> pour modifier.
export default async function AdminArticle({ params }: PageProps<"/admin/actualites/[id]">) {
  await exigerBureau();
  const { id } = await params;
  const article = id === "nouveau" ? null : await prisma.article.findUnique({ where: { id } });
  if (id !== "nouveau" && !article) notFound();
  const titre = article ? "Modifier l’article" : "Nouvel article";

  return (
    <div className="-mt-4 space-y-6">
      <FilAriane retour={{ href: "/admin/actualites", libelle: "Actualités" }} ici={article?.titre ?? titre} />
      <EnTeteConsole titre={titre} />
      <FormulaireArticle article={article} />
    </div>
  );
}
