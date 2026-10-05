// Téléchargement de toutes ses données personnelles (droits d'accès et de portabilité, RGPD art. 15 et 20).
import { prisma } from "@/lib/db";
import { obtenirSession } from "@/lib/session";

export async function GET() {
  const session = await obtenirSession();
  if (!session) return new Response("Connexion requise", { status: 401 });

  const compte = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      prenom: true,
      nom: true,
      promoEntree: true,
      profil: true,
      fonction: true,
      statut: true,
      role: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      updatedAt: true,
      // Le mot de passe et la clé de double authentification (chiffrés) ne sont volontairement pas exportés.
      sessions: { select: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true } },
      offresDeposees: {
        select: { titre: true, organisation: true, type: true, statut: true, creeLe: true, description: true },
      },
      personne: {
        include: {
          formations: { omit: { personneId: true } },
          experiences: { omit: { personneId: true } },
          erasmus: { omit: { personneId: true }, include: { universite: { select: { nom: true, ville: true, pays: true } } } },
        },
      },
    },
  });

  const contenu = {
    exportLe: new Date().toISOString(),
    source: "Alumni Bi-Licence Montpellier",
    compte,
  };

  return new Response(JSON.stringify(contenu, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees-abm.json"`,
      "Cache-Control": "no-store",
    },
  });
}
