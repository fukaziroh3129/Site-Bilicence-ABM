// Domaines professionnels (table Domaine). Les fiches et les expériences enregistrent le code
// du domaine : renommer un domaine ne touche pas aux fiches.
// Un membre peut ajouter un domaine absent de la liste (patch ADM-03) : il est utilisable tout de
// suite, dans les listes comme dans les filtres, et marqué « à contrôler » pour le bureau, qui le
// renomme, le fusionne avec un doublon ou le supprime (/admin/domaines, tableau de bord).

import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { normaliser, slugifier } from "@/lib/format";

/** Nombre maximum de domaines sur une fiche (pour que les cartes restent lisibles). */
export const MAX_DOMAINES_PAR_FICHE = 3;

/**
 * Groupes d'affichage des domaines (formulaires, statistiques), dans l'ordre. Un domaine sans groupe
 * (ajouté par un membre, ou « Autre ») est rangé dans « Autres domaines ».
 */
export const GROUPES_DOMAINES = ["Action publique", "Économie et entreprise", "Société et engagement", "Savoirs, médias, culture"] as const;
export const GROUPE_AUTRES = "Autres domaines";

/** Tous les domaines, chargés une seule fois par requête. */
export const chargerDomaines = cache(() =>
  prisma.domaine.findMany({ orderBy: [{ ordre: "asc" }, { libelle: "asc" }] }),
);

/** Domaines + fonctions de libellé à partir d'un code. */
export async function dictionnaireDomaines() {
  const domaines = await chargerDomaines();
  const parCode = new Map(domaines.map((d) => [d.code, d]));
  return {
    domaines,
    libelle: (code: string) => parCode.get(code)?.libelle ?? code,
    court: (code: string) => parCode.get(code)?.court ?? code,
  };
}

/** Options de cases à cocher pour un formulaire, rangées par groupe (GROUPES_DOMAINES, puis les autres). */
export async function optionsDomaines() {
  const domaines = await chargerDomaines();
  const rang = (g: string | null) => {
    const i = GROUPES_DOMAINES.indexOf(g as (typeof GROUPES_DOMAINES)[number]);
    return i === -1 ? GROUPES_DOMAINES.length : i;
  };
  return [...domaines]
    .sort((a, b) => rang(a.groupe) - rang(b.groupe) || (a.code === "autre" ? 1 : 0) - (b.code === "autre" ? 1 : 0))
    .map((d) => ({ valeur: d.code, libelle: d.libelle, groupe: rang(d.groupe) < GROUPES_DOMAINES.length ? d.groupe! : GROUPE_AUTRES }));
}

/**
 * Domaine ajouté par un membre : si un domaine équivalent existe déjà (majuscules et accents
 * ignorés), on le réutilise ; sinon on le crée, utilisable tout de suite. Renvoie son code.
 */
export async function trouverOuAjouterDomaine(texte: string, { ajouteParId = null, aControler = true }: { ajouteParId?: string | null; aControler?: boolean } = {}) {
  const libelle = texte.trim().replace(/\s+/g, " ");
  const cle = normaliser(libelle);
  const domaines = await prisma.domaine.findMany();
  const existant = domaines.find((d) => normaliser(d.libelle) === cle || normaliser(d.court) === cle || d.code === slugifier(libelle));
  if (existant) return existant.code;

  const base = slugifier(libelle) || "domaine";
  let code = base;
  for (let i = 2; domaines.some((d) => d.code === code); i++) code = `${base}-${i}`;
  await prisma.domaine.create({
    data: { code, libelle, court: libelle.length > 24 ? `${libelle.slice(0, 23)}…` : libelle, aControler, ajouteParId },
  });
  return code;
}
