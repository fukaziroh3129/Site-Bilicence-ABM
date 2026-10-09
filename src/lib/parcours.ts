// Construction d'une carte « Que sont-ils devenus ? » à partir d'une fiche. Utilisée par la page
// publique /promotions et par l'aperçu de « Ma fiche ». Uniquement des informations couvertes par
// l'accord public : jamais de coordonnées, de détail d'expérience ni de contact.
import type { CarteParcours } from "@/components/parcours/types";
import type { Prisma } from "@/generated/prisma/client";
import { clesEtablissements } from "@/lib/etablissements";
import {
  LIBELLES_NIVEAU,
  LIBELLES_STATUT_ACTUEL,
  LIBELLES_TYPE_EXPERIENCE,
  anneesFormation,
  formationEnCours,
  libellePromo,
  promoEnCours,
} from "@/lib/format";
import { LIBELLES_DUREE_ERASMUS, nomPays } from "@/lib/pays";

/** Champs à lire en base pour construire une carte. */
export const SELECTION_CARTE = {
  id: true,
  prenom: true,
  nom: true,
  promoEntree: true,
  statutActuel: true,
  situationActuelle: true,
  structureActuelle: true,
  ville: true,
  secteurs: true,
  presentation: true,
  conseil: true,
  formations: {
    select: {
      intitule: true,
      parcours: true,
      etablissement: true,
      etablissementRef: { select: { nom: true, type: true } },
      mention: { select: { famille: { select: { code: true } } } },
      anneeDebut: true,
      anneeFin: true,
    },
    orderBy: [{ anneeDebut: { sort: "asc", nulls: "last" } }, { creeLe: "asc" }],
  },
  erasmus: {
    select: { annee: true, duree: true, niveau: true, descriptif: true, universite: { select: { nom: true, pays: true } } },
    orderBy: [{ annee: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }],
  },
  experiences: {
    select: { type: true, poste: true, organisation: true, resume: true },
    orderBy: [{ debut: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }],
    take: 3,
  },
} satisfies Prisma.PersonneSelect;

export type PersonneCarte = Prisma.PersonneGetPayload<{ select: typeof SELECTION_CARTE }>;

export function versCarteParcours(p: PersonneCarte): CarteParcours {
  const enCours = p.formations.filter(formationEnCours).at(-1);
  return {
    id: p.id,
    prenom: p.prenom,
    nom: p.nom,
    promo: libellePromo(p.promoEntree).replace("-", "–"),
    statut: p.statutActuel ? { code: p.statutActuel, libelle: LIBELLES_STATUT_ACTUEL[p.statutActuel] } : null,
    ville: p.ville,
    presentation: p.presentation,
    // « Aujourd'hui » : ce que la personne a écrit, sinon sa formation en cours.
    aujourdhui: p.situationActuelle
      ? { titre: p.situationActuelle, structure: p.structureActuelle }
      : enCours
        ? { titre: enCours.intitule, structure: enCours.etablissement }
        : null,
    etapes: [
      {
        titre: "Bi-licence Économie – Science politique",
        detail: null,
        lieu: "Université de Montpellier",
        annees: libellePromo(p.promoEntree).replace("-", "–"),
        enCours: promoEnCours(p.promoEntree),
        base: true,
      },
      ...p.formations.map((f) => ({
        titre: f.intitule,
        detail: f.parcours,
        lieu: f.etablissement,
        annees: anneesFormation(f),
        enCours: formationEnCours(f),
      })),
    ],
    domaines: p.secteurs,
    etablissements: clesEtablissements(p.formations),
    familles: [...new Set(p.formations.flatMap((f) => (f.mention ? [f.mention.famille.code] : [])))],
    erasmus: p.erasmus.map((e) => ({
      universite: e.universite.nom,
      pays: nomPays(e.universite.pays),
      details: [e.niveau && LIBELLES_NIVEAU[e.niveau], e.annee, e.duree && LIBELLES_DUREE_ERASMUS[e.duree]].filter(Boolean).join(" · ") || null,
      descriptif: e.descriptif,
    })),
    experiences: p.experiences.map((e) => ({
      type: LIBELLES_TYPE_EXPERIENCE[e.type],
      poste: e.poste,
      organisation: e.organisation,
      resume: e.resume,
    })),
    conseil: p.conseil,
  };
}
