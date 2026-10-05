import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Apparition } from "@/components/anime";
import { CarrouselParcours } from "@/components/parcours/carrousel-parcours";
import { StatsDevenir } from "@/components/statistiques/stats-devenir";
import type { CarteParcours, DomaineFiltre } from "@/components/parcours/types";
import { PageHeader, Vide, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { dictionnaireDomaines } from "@/lib/domaines";
import { CLE_IEP, decrireEtablissement } from "@/lib/etablissements";
import { SELECTION_CARTE, versCarteParcours } from "@/lib/parcours";
import { statistiquesDevenir } from "@/lib/statistiques";
import { FICHE_VISIBLE } from "@/lib/visibilite";

export const metadata: Metadata = {
  title: "Que sont-ils devenus ?",
  description: "Masters, écoles, premiers postes : où la bi-licence Économie / Science politique de Montpellier a mené ses étudiants.",
};

/** Mélange au hasard (à chaque visite, personne n'est toujours en tête). */
function melanger<T>(liste: T[]) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste;
}

export default async function QueSontIlsDevenus({ searchParams }: PageProps<"/promotions">) {
  await connection(); // lecture de la base à chaque visite
  const p = await searchParams;

  // Uniquement les personnes ayant donné leur accord explicite (RGPD), et uniquement les champs
  // couverts par cet accord : jamais de coordonnées, de retour d'expérience ni de contact de tuteur.
  const [personnes, domaines, stats] = await Promise.all([
    prisma.personne.findMany({
      where: { consentementPublic: true, ...FICHE_VISIBLE },
      select: SELECTION_CARTE,
    }),
    dictionnaireDomaines(),
    statistiquesDevenir(),
  ]);

  const cartes: CarteParcours[] = melanger(
    personnes.map(versCarteParcours),
  );

  const filtres: DomaineFiltre[] = domaines.domaines.map((d) => ({
    code: d.code,
    libelle: d.libelle,
    court: d.court,
    nombre: cartes.filter((c) => c.domaines.includes(d.code)).length,
  }));

  // Filtres reçus dans l'adresse (lien « Voir ces parcours » depuis une autre page).
  const domaineDemande = typeof p.domaine === "string" && domaines.domaines.some((d) => d.code === p.domaine) ? p.domaine : null;
  const etabDemande = typeof p.etablissement === "string" ? p.etablissement : null;
  const etablissementInitial = etabDemande
    ? etabDemande === CLE_IEP
      ? { cle: CLE_IEP, libelle: "Instituts d’études politiques" }
      : (stats.etablissements.find((e) => e.cle === etabDemande) ??
        personnes
          .flatMap((x) => x.formations.map((f) => decrireEtablissement(f)))
          .map((r) => ({ cle: r.cle, libelle: r.nom }))
          .find((r) => r.cle === etabDemande) ??
        null)
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Le réseau des anciens"
        title="Que sont-ils devenus ?"
        lead="Masters, écoles, premiers postes : découvrez où la bi-licence Économie / Science politique a mené celles et ceux qui l’ont suivie."
      />

      <div className="py-8">
        {cartes.length === 0 ? (
          <div className="mx-auto max-w-5xl px-4 sm:px-8">
            <Vide>Les parcours des anciens seront bientôt publiés ici.</Vide>
          </div>
        ) : (
          <CarrouselParcours
            cartes={cartes}
            domaines={filtres}
            domaineInitial={domaineDemande}
            etablissementInitial={etablissementInitial && { cle: etablissementInitial.cle, libelle: etablissementInitial.libelle }}
          />
        )}
      </div>

      {/* Second écran : les statistiques, calculées sur toutes les fiches (sans nom) */}
      <section aria-labelledby="titre-stats" className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
        <Apparition>
          <p className="eyebrow text-bordeaux-600">En chiffres</p>
          <h2 id="titre-stats" className="mt-2 font-display text-3xl font-bold text-bordeaux-700 sm:text-4xl">
            Que deviennent-ils&nbsp;?
          </h2>
          <p className="mt-3 max-w-[60ch] text-ink-soft">
            Les domaines où travaillent et se forment les anciens, et les établissements qui les accueillent le plus après la
            bi-licence.
          </p>
        </Apparition>
        <div className="mt-8">
          <StatsDevenir stats={stats} />
        </div>
      </section>

      <p className="mx-auto mb-16 max-w-5xl border-t border-bordeaux-700/20 px-4 pt-6 text-sm text-ink-soft sm:px-8">
        Chaque personne a choisi d’apparaître sur cette page et peut retirer son accord à tout moment
        depuis son espace membre. Vous êtes un ancien et souhaitez y figurer&nbsp;?{" "}
        <Link href="/adhesion" className={classeLien}>
          Créez votre compte
        </Link>
        .
      </p>
    </>
  );
}
