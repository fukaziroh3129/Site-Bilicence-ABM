import { Archive, ArrowRight, BriefcaseBusiness, CalendarDays, Globe, Users } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import {
  Apparition,
  CarteProjecteur,
  Compteur,
  ElementGroupe,
  Groupe,
  MotifCourbes,
  Ornement,
  SceauFiligrane,
  SceauHero,
  TitreAnime,
} from "@/components/anime";
import { buttonClasses } from "@/components/ui";
import { prisma } from "@/lib/db";
import { normaliser } from "@/lib/format";
import { site } from "@/lib/site";
import { URL_SITE } from "@/lib/url";
import { FICHE_VISIBLE } from "@/lib/visibilite";

/** Chiffres réels du réseau (aucune valeur inventée). */
async function chiffres() {
  const [personnes, promos, stages, erasmus, formations, etablissementsPublics] = await Promise.all([
    prisma.personne.count({ where: FICHE_VISIBLE }),
    prisma.personne.groupBy({ by: ["promoEntree"], where: FICHE_VISIBLE }),
    prisma.experience.count({ where: { type: { in: ["STAGE", "ALTERNANCE"] }, personne: FICHE_VISIBLE } }),
    prisma.erasmus.groupBy({ by: ["universiteId"], where: { personne: FICHE_VISIBLE }, _count: true }),
    prisma.formation.findMany({ where: { personne: FICHE_VISIBLE }, select: { etablissement: true } }),
    // Établissements des seules personnes ayant accepté l'affichage public
    prisma.formation.findMany({
      where: { personne: { consentementPublic: true, ...FICHE_VISIBLE } },
      select: { etablissement: true },
    }),
  ]);

  const distincts = (liste: { etablissement: string }[]) => {
    const vus = new Map<string, string>();
    for (const { etablissement } of liste) {
      const cle = normaliser(etablissement);
      if (!vus.has(cle)) vus.set(cle, etablissement.trim());
    }
    return [...vus.values()];
  };

  return {
    personnes,
    promos: promos.length,
    stages,
    erasmus: erasmus.reduce((n, u) => n + u._count, 0),
    etablissements: distincts(formations).length,
    destinations: distincts(etablissementsPublics),
  };
}

export default async function Accueil() {
  await connection();
  const c = await chiffres();

  const tuilesChiffres = [
    { valeur: c.personnes, libelle: "étudiants et diplômés" },
    { valeur: c.promos, libelle: c.promos > 1 ? "promotions" : "promotion" },
    { valeur: c.etablissements, libelle: "établissements de master" },
    { valeur: c.stages, libelle: "stages partagés" },
  ].filter((t) => t.valeur > 0);

  // Données structurées (schema.org) : aident les moteurs de recherche à présenter l'association.
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.nom,
    alternateName: site.sigle,
    url: URL_SITE,
    logo: `${URL_SITE}/brand/logo-abm-seal.png`,
    description: site.description,
    ...(site.liens.instagram ? { sameAs: [site.liens.instagram] } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Contenu fixe défini ci-dessus ; « < » échappé par précaution.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />
      {/* ─── Bandeau d'accueil : registre institutionnel, cadre fin blanc (charte §4) ─── */}
      <section className="fond-bordeaux relative overflow-hidden p-[14px]">
        <MotifCourbes />
        <div className="relative overflow-hidden border border-white/30">
          <div className="relative mx-auto grid min-h-[calc(100dvh-72px-28px)] max-w-6xl items-center gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1.3fr_1fr] lg:py-20">
            <div className="order-2 lg:order-1">
              <p className="apparait eyebrow text-white/76">{site.nom}</p>
              <TitreAnime
                texte="Le réseau des anciens de la bi-licence"
                className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] sm:text-5xl lg:text-6xl"
              />
              <p className="apparait mt-7 max-w-[44ch] text-lg text-white/80" style={{ animationDelay: "600ms" }}>
                Économie et sciences politiques à l’Université de Montpellier&nbsp;: se retrouver,
                s’entraider et se projeter après la licence.
              </p>
              <div className="apparait" style={{ animationDelay: "750ms" }}>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link href="/adhesion" className={buttonClasses("inverse")}>
                    Adhérer
                    <ArrowRight size={16} className="fleche" aria-hidden />
                  </Link>
                  <Link href="/la-formation" className={buttonClasses("outline-inverse")}>
                    Découvrir la formation
                  </Link>
                </div>
              </div>
            </div>
            <div className="order-1 mx-auto w-52 sm:w-72 lg:order-2 lg:w-full">
              <SceauHero />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Le réseau en chiffres (données réelles de la base) ─── */}
      {tuilesChiffres.length > 0 && (
        <section className="fond-papier">
          <Groupe as="div" className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-4 py-16 sm:px-8 lg:grid-cols-4">
            {tuilesChiffres.map((t, i) => (
              <ElementGroupe
                as="div"
                key={t.libelle}
                className={`px-4 text-center ${i > 0 ? "lg:border-l lg:border-bordeaux-700/15" : ""} ${i % 2 === 1 ? "max-lg:border-l max-lg:border-bordeaux-700/15" : ""}`}
              >
                <Compteur valeur={t.valeur} className="block font-impact text-5xl text-bordeaux-700 sm:text-6xl" />
                <span className="mt-2 block text-sm text-ink-soft">{t.libelle}</span>
              </ElementGroupe>
            ))}
          </Groupe>
          <div className="filet-degrade mx-auto max-w-6xl" />
        </section>
      )}

      {/* ─── L'espace membres : quatre outils, une grille asymétrique ─── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <Apparition>
          <h2 className="max-w-[20ch] font-display text-4xl font-bold leading-[1.1] text-bordeaux-700 sm:text-5xl">
            Un réseau, pas seulement une association
          </h2>
          <p className="mt-5 max-w-[56ch] text-lg text-ink-soft">
            Des outils pour garder le fil entre les promotions, réservés aux membres dont le compte a été
            validé par le bureau. La carte des Erasmus, elle, est ouverte à tous.
          </p>
        </Apparition>

        <Groupe className="mt-12 grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
          <ElementGroupe className="md:col-span-2 md:row-span-2">
            <CarteProjecteur className="fond-bordeaux filigrane carte-premium h-full overflow-hidden rounded-abm-lg">
              <Link href="/espace/annuaire" className="group flex h-full min-h-72 flex-col justify-between p-8 sm:p-10">
                <Users size={36} strokeWidth={1.5} aria-hidden className="text-white/80" />
                <div>
                  <h3 className="font-display text-3xl font-bold sm:text-4xl">L’annuaire des anciens</h3>
                  <p className="mt-3 max-w-[40ch] text-white/76">
                    Masters, secteurs, premiers postes&nbsp;: retrouver un ancien et le contacter, avec
                    une recherche qui comprend «&nbsp;mairie Paris&nbsp;» comme «&nbsp;Sciences Po&nbsp;».
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]">
                    Ouvrir l’annuaire <ArrowRight size={16} className="fleche" aria-hidden />
                  </span>
                </div>
              </Link>
            </CarteProjecteur>
          </ElementGroupe>

          <ElementGroupe>
            <CarteProjecteur className="carte-premium h-full rounded-abm-lg border border-bordeaux-700/20 bg-white">
              <Link href="/espace/stages" className="group flex h-full flex-col gap-4 p-7">
                <Archive size={26} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
                <h3 className="font-display text-xl font-bold text-bordeaux-700">L’archive des stages</h3>
                <p className="text-sm text-ink-soft">Chaque stage effectué, avec le contact et le retour d’expérience.</p>
                {c.stages > 0 && (
                  <p className="mt-auto font-impact text-3xl text-bordeaux-700">
                    {c.stages} <span className="font-body text-sm font-normal text-ink-soft">déjà partagés</span>
                  </p>
                )}
              </Link>
            </CarteProjecteur>
          </ElementGroupe>

          <ElementGroupe>
            <CarteProjecteur className="carte-premium h-full rounded-abm-lg border border-bordeaux-700/20 bg-white">
              <Link href="/erasmus" className="group flex h-full flex-col gap-4 p-7">
                <Globe size={26} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
                <h3 className="font-display text-xl font-bold text-bordeaux-700">Erasmus</h3>
                <p className="text-sm text-ink-soft">
                  La carte des universités où sont partis les étudiants, et les retours de ceux qui y sont allés.
                </p>
                {c.erasmus > 0 && (
                  <p className="mt-auto font-impact text-3xl text-bordeaux-700">
                    {c.erasmus} <span className="font-body text-sm font-normal text-ink-soft">départs</span>
                  </p>
                )}
              </Link>
            </CarteProjecteur>
          </ElementGroupe>

          <ElementGroupe>
            <CarteProjecteur className="carte-premium h-full rounded-abm-lg border border-bordeaux-700/20 bg-white">
              <Link href="/espace/offres" className="group flex h-full flex-col gap-4 p-7">
                <BriefcaseBusiness size={26} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
                <h3 className="font-display text-xl font-bold text-bordeaux-700">Offres de stage et d’emploi</h3>
                <p className="text-sm text-ink-soft">Transmises par le réseau, relues par le bureau.</p>
              </Link>
            </CarteProjecteur>
          </ElementGroupe>

          <ElementGroupe>
            <CarteProjecteur className="carte-premium h-full rounded-abm-lg border border-bordeaux-700/20 bg-white">
              <Link href="/espace/evenements" className="group flex h-full flex-col gap-4 p-7">
                <CalendarDays size={26} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
                <h3 className="font-display text-xl font-bold text-bordeaux-700">Événements</h3>
                <p className="text-sm text-ink-soft">Les rendez-vous de l’année, à ajouter à son agenda.</p>
              </Link>
            </CarteProjecteur>
          </ElementGroupe>
        </Groupe>
      </section>

      {/* ─── Où sont partis les anciens (personnes ayant accepté l'affichage public) ─── */}
      {c.destinations.length >= 4 && (
        <section className="border-y border-bordeaux-700/15 bg-white py-14">
          <Apparition className="mx-auto max-w-6xl px-4 sm:px-8">
            <h2 className="font-display text-2xl font-bold text-bordeaux-700">Après la licence, ils ont rejoint</h2>
          </Apparition>
          <div className="defilement mt-8 overflow-hidden" aria-label={`Établissements rejoints : ${c.destinations.join(", ")}`}>
            <div className="defilement-piste" aria-hidden>
              {[0, 1].map((copie) => (
                <ul key={copie} className="flex shrink-0 items-center">
                  {c.destinations.map((d) => (
                    <li key={d} className="flex items-center whitespace-nowrap font-display text-2xl italic text-ink sm:text-3xl">
                      <span className="px-8">{d}</span>
                      <span className="text-sm not-italic text-bordeaux-400">◆</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
          <Apparition className="mx-auto mt-8 max-w-6xl px-4 sm:px-8">
            <Link href="/promotions" className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-bordeaux-700">
              Voir ce qu’ils sont devenus <ArrowRight size={16} className="fleche" aria-hidden />
            </Link>
          </Apparition>
        </section>
      )}

      <Ornement className="pt-4" />

      {/* ─── La formation et le bureau ─── */}
      <section className="mx-auto grid max-w-6xl gap-px px-4 py-20 sm:px-8 md:grid-cols-2 md:py-28">
        {[
          {
            href: "/la-formation",
            titre: "La formation",
            texte: `Lycéens et futurs candidats : découvrez le double cursus Économie / Sciences politiques de l’${site.universite}.`,
            action: "Découvrir le cursus",
          },
          {
            href: "/bureau",
            titre: "Le bureau",
            texte: "Les étudiants qui font vivre l’association et ses pôles au fil de l’année.",
            action: "Rencontrer le bureau",
          },
        ].map((bloc, i) => (
          <Apparition key={bloc.href} delai={i * 0.1}>
            <Link
              href={bloc.href}
              className="group block border-t-2 border-bordeaux-700 py-8 transition-colors md:mr-10"
            >
              <h2 className="font-display text-4xl font-bold text-bordeaux-700 transition-colors group-hover:text-bordeaux-500">
                {bloc.titre}
              </h2>
              <p className="mt-4 max-w-[44ch] text-ink-soft">{bloc.texte}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-bordeaux-700">
                {bloc.action} <ArrowRight size={16} className="fleche" aria-hidden />
              </span>
            </Link>
          </Apparition>
        ))}
      </section>

      {/* ─── Appel final : rejoindre l'espace membres ─── */}
      <section className="fond-bordeaux filigrane relative overflow-hidden">
        <SceauFiligrane className="-right-40 -top-40 size-[520px]" />
        <Apparition className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-8 sm:py-24">
          <h2 className="font-display text-4xl font-bold leading-[1.1] sm:text-5xl">Ancien ou étudiant de la bi-licence&nbsp;?</h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg text-white/80">
            Créez votre compte : le bureau le valide, et vous rejoignez l’annuaire du réseau.
          </p>
          <Link href="/inscription" className={`${buttonClasses("inverse")} mt-10`}>
            Créer mon compte
            <ArrowRight size={16} className="fleche" aria-hidden />
          </Link>
        </Apparition>
      </section>
    </>
  );
}
