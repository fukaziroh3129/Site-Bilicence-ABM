import { Download } from "lucide-react";
import Link from "next/link";
import { Filtres, parametre } from "@/components/filtres";
import { EnTeteConsole, Initiales, Panneau, Pastille, Vide, buttonClasses, classesTableau } from "@/components/ui";
import { prisma } from "@/lib/db";
import { correspond, libellePromo, listePromos } from "@/lib/format";
import { LIBELLES_STATUT_COMPTE, estAdministrateur } from "@/lib/roles";
import { exigerBureau } from "@/lib/session";
import { FormulaireNouvellePersonne } from "./formulaire";

export const metadata = { title: "Fiches" };

export default async function Personnes({ searchParams }: PageProps<"/admin/personnes">) {
  const { user } = await exigerBureau();
  const admin = estAdministrateur(user.role);
  const p = await searchParams;
  const q = parametre(p.q);
  const promo = parametre(p.promo);
  const compte = parametre(p.compte);

  const personnes = await prisma.personne.findMany({
    where: {
      ...(promo ? { promoEntree: Number(promo) } : {}),
      ...(compte === "avec" ? { compte: { isNot: null } } : compte === "sans" ? { compte: null } : {}),
    },
    include: {
      compte: { select: { statut: true } },
      _count: { select: { formations: true, experiences: true } },
    },
    orderBy: [{ promoEntree: "asc" }, { nom: "asc" }, { prenom: "asc" }],
  });
  const resultats = q ? personnes.filter((pe) => correspond(q, [pe.prenom, pe.nom, pe.situationActuelle])) : personnes;

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Fiches"
        phrase={
          <>
            Toutes les personnes de la bi-licence, avec ou sans compte.{" "}
            {admin
              ? "Vous pouvez compléter la fiche de quelqu’un qui ne s’est pas inscrit ; quand vous modifiez la fiche d’un membre, un motif lui est transmis."
              : "En tant qu’animateur, vous consultez les fiches ; leur modification est réservée aux administrateurs."}
          </>
        }
        action={
          admin && (
            <a href="/admin/personnes/export" download className={buttonClasses("outline")}>
              <Download size={16} aria-hidden /> Exporter (Excel)
            </a>
          )
        }
      />

      {admin && (
        <Panneau titre="Ajouter une fiche">
          <FormulaireNouvellePersonne />
        </Panneau>
      )}

      <Panneau titre="Liste" compte={resultats.length} corps={false}>
        <div className="border-b border-bordeaux-700/10 px-5 py-4 sm:px-6">
          <Filtres
            action="/admin/personnes"
            recherche={q}
            placeholder="Nom, prénom…"
            filtres={[
              { nom: "promo", libelle: "Promotion", valeur: promo, options: listePromos().map((a) => ({ valeur: String(a), libelle: libellePromo(a) })) },
              {
                nom: "compte",
                libelle: "Compte",
                valeur: compte,
                options: [
                  { valeur: "avec", libelle: "Avec compte" },
                  { valeur: "sans", libelle: "Sans compte" },
                ],
              },
            ]}
          />
        </div>
        {resultats.length === 0 ? (
          <Vide>Aucune fiche.</Vide>
        ) : (
          <div className={classesTableau.conteneur}>
            <table className={classesTableau.table}>
              <thead className={classesTableau.tete}>
                <tr>
                  <th scope="col" className={classesTableau.th}>
                    Nom
                  </th>
                  <th scope="col" className={classesTableau.th}>
                    Promotion
                  </th>
                  <th scope="col" className={classesTableau.th}>
                    Compte
                  </th>
                  <th scope="col" className={classesTableau.th}>
                    Public
                  </th>
                  <th scope="col" className={classesTableau.th}>
                    Formations / expériences
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((pe) => (
                  <tr key={pe.id} className={classesTableau.ligne}>
                    <td className={`${classesTableau.td} py-2.5`}>
                      <Link href={`/admin/personnes/${pe.id}`} className="group flex items-center gap-3">
                        <Initiales prenom={pe.prenom} nom={pe.nom} taille="petit" />
                        <span className="font-semibold text-bordeaux-700 underline-offset-4 group-hover:underline">
                          {pe.nom} {pe.prenom}
                        </span>
                      </Link>
                    </td>
                    <td className={`${classesTableau.td} align-middle`}>{libellePromo(pe.promoEntree)}</td>
                    <td className={`${classesTableau.td} align-middle`}>
                      {pe.compte ? (
                        <Pastille accent={pe.compte.statut === "ACTIF"}>{LIBELLES_STATUT_COMPTE[pe.compte.statut]}</Pastille>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className={`${classesTableau.td} align-middle`}>{pe.consentementPublic ? "Oui" : <span className="text-ink-soft">Non</span>}</td>
                    <td className={`${classesTableau.td} align-middle tabular-nums`}>
                      {pe._count.formations} / {pe._count.experiences}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panneau>
    </div>
  );
}
