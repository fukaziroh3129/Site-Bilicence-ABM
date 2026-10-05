import { notFound } from "next/navigation";
import { EnTeteConsole, FilAriane } from "@/components/ui";
import { prisma } from "@/lib/db";
import { exigerBureau } from "@/lib/session";
import { FormulaireArticle } from "./formulaire";

export const metadata = { title: "Publication" };

// /admin/actualites/nouveau pour créer (?type=evenement pour pré-choisir « Événement »),
// /admin/actualites/<id> pour modifier.
export default async function AdminArticle({ params, searchParams }: PageProps<"/admin/actualites/[id]">) {
  await exigerBureau();
  const { id } = await params;
  const { type } = await searchParams;
  const article = id === "nouveau" ? null : await prisma.article.findUnique({ where: { id } });
  if (id !== "nouveau" && !article) notFound();
  const typeInitial = article?.type ?? (type === "evenement" ? "EVENEMENT" : "ACTUALITE");
  const titre = article ? (article.type === "EVENEMENT" ? "Modifier l’événement" : "Modifier l’actualité") : "Nouvelle publication";

  return (
    <div className="-mt-4 space-y-6">
      <FilAriane retour={{ href: "/admin/actualites", libelle: "Publications" }} ici={article?.titre ?? titre} />
      <EnTeteConsole titre={titre} />
      <FormulaireArticle article={article} typeInitial={typeInitial} />
    </div>
  );
}
