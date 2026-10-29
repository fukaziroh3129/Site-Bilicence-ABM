import { SimulateurMoyenne } from "@/components/simulateur/simulateur-moyenne";
import { prisma } from "@/lib/db";
import { anneeParDefaut } from "@/lib/mcc";
import { estPersonnel } from "@/lib/profils";
import { exigerCompte } from "@/lib/session";

export const metadata = { title: "Simulateur de moyenne" };

// Simulateur de moyenne d'après le MCC (src/lib/mcc.ts). Ouvert à tous les comptes, en attente compris (choix de
// Guillaume, 29 octobre 2026) : l'outil ne montre rien des autres membres et les notes restent dans le navigateur.
export default async function PageSimulateur() {
  const { user } = await exigerCompte();
  // Année affichée à l'ouverture : celle de l'étudiant, d'après la promotion de sa fiche (ou de son compte).
  const fiche =
    user.personneId && !estPersonnel(user)
      ? await prisma.personne.findUnique({ where: { id: user.personneId }, select: { promoEntree: true } })
      : null;
  const promo = estPersonnel(user) ? null : (fiche?.promoEntree ?? user.promoEntree);

  return <SimulateurMoyenne anneeInitiale={anneeParDefaut(promo)} />;
}
