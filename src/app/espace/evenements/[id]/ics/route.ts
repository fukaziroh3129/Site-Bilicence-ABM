// Téléchargement d'un événement au format .ics (à ouvrir dans son agenda).
import { prisma } from "@/lib/db";
import { fichierIcs } from "@/lib/calendrier";
import { slugifier } from "@/lib/format";
import { obtenirSession } from "@/lib/session";

export async function GET(_request: Request, { params }: RouteContext<"/espace/evenements/[id]/ics">) {
  const session = await obtenirSession();
  if (session?.user.statut !== "ACTIF") return new Response("Accès réservé aux membres", { status: 401 });

  const { id } = await params;
  const evenement = await prisma.evenement.findUnique({ where: { id } });
  if (!evenement) return new Response("Introuvable", { status: 404 });

  return new Response(fichierIcs(evenement), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugifier(evenement.titre) || "evenement"}.ics"`,
    },
  });
}
