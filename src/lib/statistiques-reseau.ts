// Données de la page « Statistiques » (/espace/statistiques, membres validés) : pour chaque fiche
// visible, ses formations (établissement, type, mention, grand domaine), ses domaines professionnels
// et sa situation. Les regroupements se font dans le navigateur (filtre par promotion instantané) :
// avec ~150 fiches, tout tient dans la page. Les noms ne sont envoyés qu'aux membres validés, comme
// pour l'annuaire ; chaque personne mène à sa fiche.

import "server-only";
import { prisma } from "@/lib/db";
import { dictionnaireDomaines, GROUPES_DOMAINES } from "@/lib/domaines";
import { decrireEtablissement } from "@/lib/etablissements";
import { libellePromo, promoEnCours } from "@/lib/format";
import { chargerFamilles } from "@/lib/liste-mentions";
import { couleurFamille, estBiLicence } from "@/lib/mentions";
import { FICHE_VISIBLE } from "@/lib/visibilite";

/** Type d'établissement dans les statistiques : les établissements hors de France forment « Étranger ». */
export type TypeStat = "UNIVERSITE" | "IEP" | "ECOLE" | "ETRANGER";

export type FormationStat = {
  intitule: string;
  etablissement: string;
  /** Clé de regroupement de l'établissement (deux écritures du même établissement ont la même clé). */
  cleEtablissement: string;
  type: TypeStat;
  mentionId: string | null;
  enCours: boolean;
};

export type PersonneStat = {
  id: string;
  prenom: string;
  nom: string;
  promo: number;
  libellePromo: string;
  /** En poste ou en alternance : ses domaines sont ceux où elle travaille (sinon, ceux qu'elle vise). */
  travaille: boolean;
  /** Encore en bi-licence (bouton de « Ma fiche », ou promotion en cours sans autre formation). */
  enLicence: boolean;
  /** Formations après la bi-licence, la plus récente en premier. */
  formations: FormationStat[];
  domaines: string[];
};

export type DonneesStatistiques = {
  personnes: PersonneStat[];
  familles: { id: string; libelle: string; fond: string; texte: string }[];
  mentions: Record<string, { libelle: string; familleId: string }>;
  domaines: { code: string; libelle: string; court: string; groupe: string | null }[];
  groupesDomaines: readonly string[];
};

export async function donneesStatistiques(): Promise<DonneesStatistiques> {
  const [fiches, familles, dico] = await Promise.all([
    prisma.personne.findMany({
      where: FICHE_VISIBLE,
      select: {
        id: true,
        prenom: true,
        nom: true,
        promoEntree: true,
        statutActuel: true,
        secteurs: true,
        formations: {
          select: {
            intitule: true,
            etablissement: true,
            mentionId: true,
            anneeDebut: true,
            anneeFin: true,
            etablissementRef: { select: { nom: true, type: true, pays: true } },
          },
          orderBy: [{ anneeDebut: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }],
        },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    }),
    chargerFamilles(),
    dictionnaireDomaines(),
  ]);

  const annee = new Date().getFullYear();
  const personnes: PersonneStat[] = fiches.map((p) => {
    // La bi-licence saisie par erreur comme formation n'est jamais comptée comme poursuite d'études.
    const formations = p.formations
      .filter((f) => !estBiLicence(f.intitule, f.etablissement))
      .map((f): FormationStat => {
        const e = decrireEtablissement(f);
        const etranger = f.etablissementRef ? f.etablissementRef.pays !== "FR" : false;
        const type: TypeStat = etranger ? "ETRANGER" : e.type === "IEP" ? "IEP" : e.type === "UNIVERSITE" ? "UNIVERSITE" : "ECOLE";
        return {
          intitule: f.intitule,
          etablissement: e.nom,
          cleEtablissement: e.cle,
          type,
          mentionId: f.mentionId,
          enCours: f.anneeFin === null ? f.anneeDebut !== null && f.anneeDebut <= annee : f.anneeFin >= annee,
        };
      });
    return {
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      promo: p.promoEntree,
      libellePromo: libellePromo(p.promoEntree).replace("-", "–"),
      travaille: p.statutActuel === "EN_POSTE" || p.statutActuel === "EN_ALTERNANCE",
      enLicence: p.statutActuel === "EN_LICENCE" || (formations.length === 0 && promoEnCours(p.promoEntree)),
      formations,
      domaines: p.secteurs,
    };
  });

  const mentions: DonneesStatistiques["mentions"] = {};
  for (const f of familles) for (const m of f.mentions) mentions[m.id] = { libelle: m.libelle, familleId: f.id };

  return {
    personnes,
    familles: familles.map((f, rang) => ({ id: f.id, libelle: f.libelle, ...couleurFamille(rang) })),
    mentions,
    domaines: dico.domaines.map((d) => ({ code: d.code, libelle: d.libelle, court: d.court, groupe: d.groupe })),
    groupesDomaines: GROUPES_DOMAINES,
  };
}
