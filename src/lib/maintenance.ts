// Ménage automatique de la base, sans intervention humaine.
// Lancé au plus une fois toutes les 12 heures, depuis la page de santé (/api/sante,
// interrogée régulièrement par Coolify) et depuis le tableau de bord d'administration.
import "server-only";
import { prisma } from "@/lib/db";
import { supprimerRapportsDe } from "@/lib/rapports";

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

  // Inscriptions refusées par le bureau (politique de confidentialité : 30 jours) : le compte et la fiche
  // commencée pendant l'attente, avec ses rapports de stage.
  const refuses = await prisma.user.findMany({
    where: { statut: "REFUSE", createdAt: { lt: limite } },
    select: { id: true, personneId: true },
  });
  for (const compte of refuses) {
    await prisma.user.delete({ where: { id: compte.id } });
    if (compte.personneId) {
      await supprimerRapportsDe(compte.personneId);
      await prisma.personne.delete({ where: { id: compte.personneId } }).catch(() => {});
    }
  }

  return {
    inscriptionsSupprimees: inscriptions.count,
    refusesSupprimes: refuses.length,
    verificationsSupprimees: verifications.count,
    sessionsSupprimees: sessions.count,
  };
}
