// Formations complémentaires saisies comme des masters (table Formation) : repérage et rangement.
// Utilisé par l'administration (/admin/formations-complementaires) et par le script
// `npm run complementaires:detecter`. Reçoit le client Prisma en paramètre (les scripts ont le leur).

import type { PrismaClient } from "@/generated/prisma/client";
import { detecterComplementaire, resultatDansIntitule, type TypeComplementaire } from "@/lib/complementaires";
import { estBiLicence } from "@/lib/mentions";

/**
 * Relit toutes les formations « master » (sauf celles que le bureau a gardées comme masters) et
 * note le type proposé pour celles qui ressemblent à un DU, une certification, un MOOC…
 * Rien n'est déplacé : le bureau range ensuite chaque proposition. Renvoie les propositions.
 */
export async function repererComplementaires(prisma: PrismaClient, { confirmer = true } = {}) {
  const formations = await prisma.formation.findMany({
    where: { complementaireEcarte: false },
    select: {
      id: true,
      intitule: true,
      parcours: true,
      etablissement: true,
      anneeDebut: true,
      anneeFin: true,
      complementaireSuggere: true,
      personne: { select: { prenom: true, nom: true, promoEntree: true } },
    },
  });
  const propositions: { id: string; personne: string; intitule: string; type: TypeComplementaire; raison: string }[] = [];
  let modifiees = 0;

  for (const f of formations) {
    if (estBiLicence(f.intitule, f.etablissement)) continue;
    const d = detecterComplementaire(f, f.personne.promoEntree);
    if (d) propositions.push({ id: f.id, personne: `${f.personne.prenom} ${f.personne.nom}`, intitule: f.intitule, ...d });
    const type = d?.type ?? null;
    if (type !== f.complementaireSuggere) {
      modifiees++;
      if (confirmer) await prisma.formation.update({ where: { id: f.id }, data: { complementaireSuggere: type } });
    }
  }
  return { examinees: formations.length, modifiees, propositions };
}

/**
 * Range une formation « master » parmi les formations complémentaires de la personne : la formation
 * complémentaire est créée avec les mêmes informations, puis la formation est supprimée.
 */
export async function rangerEnComplementaire(prisma: PrismaClient, formationId: string, type: TypeComplementaire) {
  const f = await prisma.formation.findUnique({ where: { id: formationId } });
  if (!f) return null;
  // « TOEIC 880 » : le score passe dans son propre champ et le titre redevient « TOEIC ».
  const resultat = type === "CERTIFICATION" ? resultatDansIntitule(f.intitule) : null;
  const intitule = (resultat ? f.intitule.replace(resultat, "").replace(/\s+/g, " ").trim() : f.intitule) || f.intitule;
  await prisma.$transaction([
    prisma.formationComplementaire.create({
      data: {
        personneId: f.personneId,
        type,
        titre: f.parcours ? `${intitule} – ${f.parcours}` : intitule,
        organisme: f.etablissement,
        etablissementId: f.etablissementId,
        anneeDebut: f.anneeDebut,
        // Une certification ou un MOOC n'a qu'une année.
        anneeFin: type === "CERTIFICATION" || type === "MOOC" ? null : f.anneeFin,
        resultat,
        creeLe: f.creeLe,
      },
    }),
    prisma.formation.delete({ where: { id: f.id } }),
  ]);
  return f;
}
