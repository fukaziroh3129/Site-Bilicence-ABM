// Ménage automatique de la base, sans intervention humaine.
// Lancé au plus une fois toutes les 12 heures, depuis la page de santé (/api/sante,
// interrogée régulièrement par Coolify) et depuis le tableau de bord d'administration.
import "server-only";
import { prisma } from "@/lib/db";

const INTERVALLE = 12 * 60 * 60 * 1000;
const DELAI_CONFIRMATION_JOURS = 30;

let derniereExecution = 0;

export async function maintenance() {
  const maintenant = Date.now();
  if (maintenant - derniereExecution < INTERVALLE) return null;
  derniereExecution = maintenant;

  const limite = new Date(maintenant - DELAI_CONFIRMATION_JOURS * 24 * 60 * 60 * 1000);
  const [inscriptions, verifications, sessions] = await Promise.all([
    // Inscriptions jamais confirmées par e-mail (politique de confidentialité : 30 jours). Les
    // pré-comptes créés par le bureau (INVITE) ne sont pas concernés.
    prisma.user.deleteMany({ where: { emailVerified: false, statut: { not: "INVITE" }, createdAt: { lt: limite } } }),
    // Liens de confirmation / réinitialisation expirés
    prisma.verification.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    // Sessions expirées
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);

  return {
    inscriptionsSupprimees: inscriptions.count,
    verificationsSupprimees: verifications.count,
    sessionsSupprimees: sessions.count,
  };
}
