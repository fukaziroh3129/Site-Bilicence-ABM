// Page de santé pour Coolify : répond « ok » si le site et la base de données fonctionnent.
// À déclarer dans Coolify (Health check → chemin /api/sante) : le site redémarre seul s'il ne répond plus.
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { maintenance } from "@/lib/maintenance";

export async function GET() {
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return Response.json({ statut: "base indisponible" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  // Profite de l'appel régulier pour faire le ménage (au plus deux fois par jour).
  await maintenance().catch((e) => console.error("Maintenance :", e));

  return Response.json({ statut: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
