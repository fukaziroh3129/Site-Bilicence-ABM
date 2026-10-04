import { parametre } from "@/components/filtres";
import { AnnuaireInteractif, type PersonneAnnuaire } from "@/components/annuaire/annuaire-interactif";
import { BandeauEspace } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_STATUT_ACTUEL, formationEnCours } from "@/lib/format";
import { dictionnaireDomaines } from "@/lib/domaines";
import { nomPays } from "@/lib/pays";
import { exigerMembreActif } from "@/lib/session";
import { FICHE_VISIBLE } from "@/lib/visibilite";

export const metadata = { title: "Annuaire" };

export default async function Annuaire({ searchParams }: PageProps<"/espace/annuaire">) {
  await exigerMembreActif();
  const p = await searchParams;

  const dico = await dictionnaireDomaines();

  // Avec une centaine de personnes, on charge tout et on filtre dans le navigateur : simple et instantané.
  const fiches = await prisma.personne.findMany({
    where: FICHE_VISIBLE,
    include: {
      formations: { orderBy: [{ anneeDebut: "desc" }, { creeLe: "desc" }] },
      experiences: { select: { type: true, organisation: true, poste: true, ville: true, secteurs: true } },
      erasmus: { select: { universite: { select: { nom: true, ville: true, pays: true } } } },
    },
  });

  const personnes: PersonneAnnuaire[] = fiches.map((pe) => {
    const derniere = pe.formations[0];
    const statut = pe.statutActuel ? LIBELLES_STATUT_ACTUEL[pe.statutActuel] : null;
    const domainesExperiences = [...new Set(pe.experiences.flatMap((e) => e.secteurs))];
    const contacts: PersonneAnnuaire["contacts"] = [];
    if (pe.afficherEmail && pe.emailContact) contacts.push("email");
    if (pe.afficherLinkedin && pe.linkedin) contacts.push("linkedin");
    if (pe.afficherTelephone && pe.telephone) contacts.push("telephone");
    return {
      id: pe.id,
      prenom: pe.prenom,
      nom: pe.nom,
      promo: pe.promoEntree,
      statut,
      statutFort: pe.statutActuel === "EN_POSTE" || pe.statutActuel === "EN_ALTERNANCE",
      situation: [pe.situationActuelle, pe.structureActuelle].filter(Boolean).join(" · ") || null,
      ville: pe.ville,
      domaines: pe.secteurs,
      domainesExperiences,
      formation: derniere ? { intitule: derniere.intitule, etablissement: derniere.etablissement, enCours: formationEnCours(derniere) } : null,
      contacts,
      stages: pe.experiences.filter((e) => e.type === "STAGE" || e.type === "ALTERNANCE").length,
      erasmus: pe.erasmus.length > 0,
      modifieLe: pe.modifieLe.getTime(),
      texte: [
        pe.prenom,
        pe.nom,
        statut,
        pe.situationActuelle,
        pe.structureActuelle,
        pe.ville,
        pe.presentation,
        ...[...pe.secteurs, ...domainesExperiences].map(dico.libelle),
        ...pe.formations.flatMap((f) => [f.intitule, f.parcours, f.etablissement]),
        ...pe.experiences.flatMap((e) => [e.organisation, e.poste, e.ville]),
        ...pe.erasmus.flatMap((e) => [e.universite.nom, e.universite.ville, nomPays(e.universite.pays)]),
      ]
        .filter(Boolean)
        .join(" "),
    };
  });

  const promos = new Set(personnes.map((pe) => pe.promo)).size;
  const tri = parametre(p.tri);

  return (
    <div className="space-y-8">
      <BandeauEspace
        titre="Annuaire"
        phrase="Les étudiants et diplômés de la bi-licence. Retrouvez un ancien par son nom, sa ville, sa structure, sa formation ou son université Erasmus."
        chiffre={personnes.length}
        libelleChiffre={`membre${personnes.length > 1 ? "s" : ""} · ${promos} promotion${promos > 1 ? "s" : ""}`}
      />
      <AnnuaireInteractif
        personnes={personnes}
        domaines={dico.domaines.map((d) => ({ code: d.code, libelle: d.libelle, court: d.court }))}
        initial={{
          q: parametre(p.q) ?? "",
          promo: parametre(p.promo) ?? "",
          domaine: parametre(p.secteur) ?? "",
          joignable: parametre(p.joignable) === "1",
          tri: tri === "nom" || tri === "maj" ? tri : "promo",
        }}
      />
    </div>
  );
}
