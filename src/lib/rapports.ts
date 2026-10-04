// Suppression des rapports de stage (PDF) d'une fiche, avant de supprimer la fiche elle-même :
// la base les oublie automatiquement (suppression en cascade), mais pas le disque.
import "server-only";
import { prisma } from "@/lib/db";
import { supprimerRapport } from "@/lib/fichiers";

export async function supprimerRapportsDe(personneId: string) {
  const experiences = await prisma.experience.findMany({
    where: { personneId, rapportFichier: { not: null } },
    select: { rapportFichier: true },
  });
  await Promise.all(experiences.map((e) => supprimerRapport(e.rapportFichier)));
}
