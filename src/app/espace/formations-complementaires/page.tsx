import { parametre } from "@/components/filtres";
import { ListeComplementaires, type GroupeAffiche } from "@/components/complementaires/liste-complementaires";
import { BandeauEspace } from "@/components/ui";
import { LIBELLES_COMPLEMENTAIRE, anneesComplementaire, regrouperFormations } from "@/lib/complementaires";
import { prisma } from "@/lib/db";
import { libellePromo } from "@/lib/format";
import { exigerMembreActif } from "@/lib/session";
import { FICHE_VISIBLE } from "@/lib/visibilite";

export const metadata = { title: "Formations complémentaires" };

// DU, licences en parallèle, certifications, MOOC… suivis par les membres, regroupés par formation, avec
// leurs avis. Réservé aux membres validés (les avis sont nominatifs, comme l'annuaire).
export default async function FormationsComplementaires({ searchParams }: PageProps<"/espace/formations-complementaires">) {
  await exigerMembreActif();
  const p = await searchParams;

  const formations = await prisma.formationComplementaire.findMany({
    where: { personne: FICHE_VISIBLE },
    include: { personne: { select: { id: true, prenom: true, nom: true, promoEntree: true } } },
    orderBy: [{ anneeDebut: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }],
  });

  const total = formations.length;
  const groupes: GroupeAffiche[] = regrouperFormations(formations)
    .map((g) => {
      // Organisme le plus cité du groupe (une même formation peut être suivie dans plusieurs universités).
      const organismes = [...new Set(g.elements.map((f) => f.organisme))];
      return {
        cle: g.cle,
        titre: g.titre,
        type: g.type,
        organismes,
        part: Math.round((g.elements.length / total) * 100),
        temoins: g.elements.map((f) => ({
          id: f.id,
          personneId: f.personne.id,
          prenom: f.personne.prenom,
          nom: f.personne.nom,
          details: [
            `Promotion ${libellePromo(f.personne.promoEntree)}`,
            organismes.length > 1 && f.organisme,
            anneesComplementaire(f),
            f.resultat && `Score : ${f.resultat}`,
          ]
            .filter(Boolean)
            .join(" · "),
          avis: f.avis,
        })),
      };
    })
    .sort((a, b) => b.temoins.length - a.temoins.length || a.titre.localeCompare(b.titre, "fr"));

  const personnes = new Set(formations.map((f) => f.personneId)).size;
  const avis = formations.filter((f) => f.avis).length;
  const chiffres = [
    { n: groupes.length, libelle: groupes.length > 1 ? "formations différentes" : "formation" },
    { n: total, libelle: total > 1 ? "formations saisies" : "formation saisie" },
    { n: avis, libelle: avis > 1 ? "avis rédigés" : "avis rédigé" },
  ];

  return (
    <div className="space-y-8">
      <BandeauEspace
        titre="Formations complémentaires"
        phrase="Diplômes universitaires, licences en parallèle, certifications, MOOC : ce que les membres ont suivi en plus de la bi-licence, avec leur avis."
        chiffre={personnes}
        libelleChiffre={personnes > 1 ? "personnes en ont suivi au moins une" : "personne en a suivi au moins une"}
      >
        {total > 0 && (
          <ul className="relative mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {chiffres.map((c) => (
              <li key={c.libelle} className="flex items-baseline gap-2">
                <span className="font-impact text-2xl leading-none tabular-nums">{c.n}</span>
                <span className="text-sm text-white/80">{c.libelle}</span>
              </li>
            ))}
          </ul>
        )}
      </BandeauEspace>
      <ListeComplementaires
        groupes={groupes}
        total={total}
        types={Object.entries(LIBELLES_COMPLEMENTAIRE).map(([valeur, l]) => ({ valeur, libelle: l.plusieurs }))}
        initiale={parametre(p.formation) ?? ""}
      />
    </div>
  );
}
