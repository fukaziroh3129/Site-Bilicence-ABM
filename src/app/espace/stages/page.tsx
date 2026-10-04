import { FileText, UserRound } from "lucide-react";
import Link from "next/link";
import { BoutonFenetre } from "@/components/fenetre/fenetre";
import { DetailExperience, LienRapport, partages } from "@/components/fiche/detail-experience";
import { parametre } from "@/components/filtres";
import { StagesInteractifs, type LigneStage } from "@/components/stages/stages-interactifs";
import { BandeauEspace, Initiales, Pastille, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_NIVEAU, LIBELLES_TYPE_EXPERIENCE, libellePromo, periode } from "@/lib/format";
import { dictionnaireDomaines } from "@/lib/domaines";
import { exigerMembreActif } from "@/lib/session";
import { FICHE_VISIBLE } from "@/lib/visibilite";

export const metadata = { title: "Archive des stages" };

const NIVEAUX = ["LICENCE", "MASTER"] as const;

export default async function ArchiveStages({ searchParams }: PageProps<"/espace/stages">) {
  await exigerMembreActif();
  const p = await searchParams;

  const domaines = await dictionnaireDomaines();
  // Quelques centaines de stages au plus : tout est chargé, le filtre se fait dans le navigateur.
  const stages = await prisma.experience.findMany({
    where: { type: { in: ["STAGE", "ALTERNANCE"] }, personne: FICHE_VISIBLE },
    include: { personne: { select: { id: true, prenom: true, nom: true, promoEntree: true } } },
    orderBy: [{ debut: { sort: "desc", nulls: "last" } }, { organisation: "asc" }],
  });

  const lignes: LigneStage[] = stages.map((s) => {
    const visible = partages(s);
    const auteur = `${s.personne.prenom} ${s.personne.nom}`;
    return {
      id: s.id,
      secteurs: s.secteurs,
      niveau: s.niveau,
      texte: [s.organisation, s.poste, s.ville, s.resume, s.missions, s.personne.prenom, s.personne.nom, ...s.secteurs.map(domaines.libelle)]
        .filter(Boolean)
        .join(" "),
      noeud: (
        <div className="grid gap-4 p-5 transition-colors duration-200 hover:bg-bordeaux-100/25 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-bordeaux-700">
              {s.organisation}
              {s.type !== "STAGE" && <Pastille>{LIBELLES_TYPE_EXPERIENCE[s.type]}</Pastille>}
              {s.niveau && <Pastille>{LIBELLES_NIVEAU[s.niveau]}</Pastille>}
            </p>
            <p className="text-sm text-ink-soft">{[s.poste, s.ville, periode(s.debut, s.fin)].filter(Boolean).join(" · ")}</p>
            {s.resume && <p className="mt-2 text-[15px]">{s.resume}</p>}
            {(s.secteurs.length > 0 || visible.contact || visible.rapport) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {s.secteurs.map((code) => (
                  <span key={code} title={domaines.libelle(code)}>
                    <Pastille>{domaines.court(code)}</Pastille>
                  </span>
                ))}
                {visible.contact && (
                  <span className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-bordeaux-700">
                    <UserRound size={13} aria-hidden /> Contact partagé
                  </span>
                )}
                {visible.rapport && (
                  <span className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-bordeaux-700">
                    <FileText size={13} aria-hidden /> Rapport de stage
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 md:flex-col md:items-end md:justify-between">
            <Link href={`/espace/annuaire/${s.personne.id}#${s.id}`} className="group flex items-center gap-2.5 text-sm md:flex-row-reverse md:text-right">
              <Initiales prenom={s.personne.prenom} nom={s.personne.nom} taille="petit" />
              <span>
                <span className="block font-semibold text-bordeaux-700 underline-offset-4 group-hover:underline">{auteur}</span>
                <span className="text-ink-soft">Promotion {libellePromo(s.personne.promoEntree)}</span>
              </span>
            </Link>
            <BoutonFenetre
              libelle="Voir le détail"
              classeBouton={buttonClasses("outline", "petit")}
              surtitre={[LIBELLES_TYPE_EXPERIENCE[s.type], periode(s.debut, s.fin)].filter(Boolean).join(" · ")}
              titre={
                <>
                  {s.poste ?? s.organisation}
                  {s.poste && <span className="mt-1 block text-base font-normal text-white/80">{s.organisation}</span>}
                </>
              }
              pied={
                <>
                  {visible.rapport && <LienRapport id={s.id} className={buttonClasses("primary")} />}
                  <Link href={`/espace/annuaire/${s.personne.id}`} className={`text-sm ${classeLien}`}>
                    Voir la fiche de {auteur} (promotion {libellePromo(s.personne.promoEntree)})
                  </Link>
                </>
              }
            >
              <DetailExperience e={s} domaines={s.secteurs.map(domaines.libelle)} avecRapport={false} />
            </BoutonFenetre>
          </div>
        </div>
      ),
    };
  });

  const niveau = parametre(p.niveau);

  return (
    <div className="space-y-8">
      <BandeauEspace
        titre="Archive des stages"
        phrase="Les stages et alternances des membres : missions, comment le stage a été obtenu, contact et rapport quand leur auteur les a partagés."
        chiffre={stages.length}
        libelleChiffre={`stage${stages.length > 1 ? "s" : ""} et alternance${stages.length > 1 ? "s" : ""}`}
      />
      <StagesInteractifs
        lignes={lignes}
        domaines={domaines.domaines.map((d) => ({ valeur: d.code, libelle: d.libelle }))}
        niveaux={NIVEAUX.map((n) => ({ valeur: n, libelle: LIBELLES_NIVEAU[n] }))}
        initial={{
          q: parametre(p.q) ?? "",
          domaine: parametre(p.secteur) ?? "",
          niveau: NIVEAUX.find((n) => n === niveau) ?? "",
        }}
      />
    </div>
  );
}
