// Téléchargement d'un événement au format .ics (à ouvrir dans son agenda). Public, comme la page.
import { estEvenement, fichierIcs } from "@/lib/calendrier";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: RouteContext<"/actualites/[slug]/ics">) {
  const { slug } = await params;
  const article = await prisma.article.findFirst({ where: { slug, publie: true } });
  if (!article || !estEvenement(article)) return new Response("Introuvable", { status: 404 });

  return new Response(fichierIcs(article), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${article.slug}.ics"`,
    },
  });
}
