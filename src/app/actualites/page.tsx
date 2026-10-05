import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ElementGroupe, Groupe } from "@/components/anime";
import { Agenda, morceaux } from "@/components/evenements/agenda";
import { PageHeader, Pastille, TitreSection, Vide } from "@/components/ui";
import type { Article } from "@/generated/prisma/client";
import { estEvenement } from "@/lib/calendrier";
import { prisma } from "@/lib/db";
import { LIBELLES_CATEGORIE_ARTICLE, dateCourte } from "@/lib/format";

export const metadata: Metadata = {
  title: "Actualités et événements",
  description: "Les prochains rendez-vous de l’association, portraits d’anciens et d’étudiants, vie de la bi-licence.",
};

// Page unique des publications : actualités ET événements (une seule table, un seul formulaire).
// En tête, les événements à venir (prochain rendez-vous + frise) ; dessous, le fil des actualités
// et des événements passés, du plus récent au plus ancien, filtrable par type et par année.

/** Nombre de publications par page du fil. */
const PAR_PAGE = 10;

const TYPES = { actualites: "ACTUALITE", evenements: "EVENEMENT" } as const;
type FiltreType = keyof typeof TYPES;

/** Adresse d'une page du fil (sans paramètre inutile). */
function adresse(page: number, annee: number | null, type: FiltreType | null) {
  const p = new URLSearchParams();
  if (type) p.set("type", type);
  if (annee) p.set("annee", String(annee));
  if (page > 1) p.set("page", String(page));
  const q = p.toString();
  return q ? `/actualites?${q}` : "/actualites";
}

/** Date qui situe une publication dans le fil : celle de l'événement, sinon celle de publication. */
function dateDe(a: Article) {
  return (a.type === "EVENEMENT" ? a.debut : null) ?? a.publieLe ?? a.creeLe;
}

/** Pastilles et date au-dessus du titre. */
function Surtitre({ article: a, une = false }: { article: Article; une?: boolean }) {
  const evenement = a.type === "EVENEMENT";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {une && <Pastille accent>À la une</Pastille>}
      <Pastille>{evenement ? "Événement" : LIBELLES_CATEGORIE_ARTICLE[a.categorie]}</Pastille>
      <span className="text-xs text-ink-soft">{dateCourte(dateDe(a))}</span>
    </div>
  );
}

/** Affiche d'un événement sans photo : grand jour et mois sur fond papier (maquette A). */
function Affiche({ date, grande = false }: { date: Date; grande?: boolean }) {
  const m = morceaux(date);
  return (
    <div className={`relative overflow-hidden bg-beige-papier px-6 py-6 text-bordeaux-700 ${grande ? "flex h-full min-h-[220px] flex-col justify-end" : "aspect-[16/10] flex flex-col justify-end"}`}>
      <span aria-hidden className="absolute -right-10 -top-10 size-40 rounded-abm-pill border border-bordeaux-700/10" />
      <span className="block font-display text-7xl font-extrabold leading-none">{m.jour}</span>
      <span className="mt-2 block text-xs font-bold uppercase tracking-[0.2em]">{m.mois}</span>
    </div>
  );
}

/** Publication « à la une » : grande photo et grand titre, sur toute la largeur. */
function ArticleALaUne({ article: a, prioritaire = false }: { article: Article; prioritaire?: boolean }) {
  return (
    <Link href={`/actualites/${a.slug}`} className="group grid overflow-hidden rounded-abm-md border border-bordeaux-700/20 bg-white shadow-abm-card lg:grid-cols-[1.35fr_1fr]">
      {a.image ? (
        <div className="zoom-image">
          <Image src={a.image} alt="" width={1400} height={875} unoptimized priority={prioritaire} className="aspect-[16/10] h-full w-full object-cover" />
        </div>
      ) : estEvenement(a) ? (
        <Affiche date={a.debut} grande />
      ) : (
        <div aria-hidden className="fond-bordeaux filigrane hidden lg:block" />
      )}
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <Surtitre article={a} une />
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-bordeaux-700 group-hover:text-bordeaux-500 sm:text-4xl">
          {a.titre}
        </h2>
        {a.chapo && <p className="mt-4 text-lg text-ink-soft">{a.chapo}</p>}
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-bordeaux-700">
          {a.type === "EVENEMENT" ? "Voir l’événement" : "Lire l’article"} <ArrowRight size={16} className="fleche" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Publication au format standard (demi-colonne). */
function ArticleStandard({ article: a }: { article: Article }) {
  return (
    <Link href={`/actualites/${a.slug}`} className="group block">
      {a.image ? (
        <div className="zoom-image rounded-abm-md">
          <Image src={a.image} alt="" width={800} height={500} unoptimized className="aspect-[16/10] w-full object-cover" />
        </div>
      ) : (
        estEvenement(a) && (
          <div className="overflow-hidden rounded-abm-md border border-bordeaux-700/15">
            <Affiche date={a.debut} />
          </div>
        )
      )}
      <div className="mt-4">
        <Surtitre article={a} />
      </div>
      <h2 className="mt-2 font-display text-2xl font-bold text-bordeaux-700 group-hover:text-bordeaux-500">{a.titre}</h2>
      {a.chapo ? <p className="mt-2 text-ink-soft">{a.chapo}</p> : a.lieu && <p className="mt-2 text-ink-soft">{a.lieu}</p>}
    </Link>
  );
}

/** Pastille de filtre (type ou année). */
function Filtre({ href, actif, children }: { href: string; actif: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className="rounded-abm-pill border border-bordeaux-700/30 px-3 py-1 text-sm font-semibold text-bordeaux-700 hover:bg-bordeaux-100 aria-[current=page]:border-bordeaux-700 aria-[current=page]:bg-bordeaux-700 aria-[current=page]:text-white"
    >
      {children}
    </Link>
  );
}

export default async function Actualites({ searchParams }: PageProps<"/actualites">) {
  await connection();
  const p = await searchParams;
  const type: FiltreType | null = p.type === "actualites" || p.type === "evenements" ? p.type : null;
  const anneeDemandee = Number(p.annee);
  const pageDemandee = Number(p.page);
  const maintenant = new Date();

  // Quelques dizaines de publications par an : on charge tout, puis on trie et on pagine ici.
  const publiees = await prisma.article.findMany({ where: { publie: true } });

  // Les événements à venir vont dans l'agenda en tête ; tout le reste forme le fil.
  const aVenir = publiees.filter(estEvenement).filter((e) => e.debut >= maintenant).sort((a, b) => a.debut.getTime() - b.debut.getTime());
  const idsAVenir = new Set(aVenir.map((e) => e.id));
  const fil = publiees.filter((a) => !idsAVenir.has(a.id)).sort((a, b) => dateDe(b).getTime() - dateDe(a).getTime());
  const filType = type ? fil.filter((a) => a.type === TYPES[type]) : fil;

  // Années ayant au moins une publication dans le fil (filtre de l'archive).
  const annees = [...new Set(filType.map((a) => dateDe(a).getFullYear()))].sort((a, b) => b - a);
  const annee = annees.includes(anneeDemandee) ? anneeDemandee : null;
  const filAnnee = annee ? filType.filter((a) => dateDe(a).getFullYear() === annee) : filType;

  // Sans filtre d'année, la dernière publication « à la une » passe en tête de la première page ;
  // elle est alors retirée de la liste paginée (pour ne pas l'afficher deux fois).
  const une = annee ? undefined : filAnnee.find((a) => a.aLaUne);
  const liste = filAnnee.filter((a) => a !== une);
  const pages = Math.max(1, Math.ceil(liste.length / PAR_PAGE));
  const page = Number.isInteger(pageDemandee) && pageDemandee >= 1 && pageDemandee <= pages ? pageDemandee : 1;
  const tete = page === 1 ? une : undefined;
  const articles = liste.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  // L'agenda s'affiche en tête de la première page, sauf si l'on ne regarde que les actualités ou une année.
  const agenda = page === 1 && !annee && type !== "actualites" ? aVenir : [];
  const rien = publiees.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Actualités"
        title="Actualités et événements"
        lead="Les prochains rendez-vous de l’association, ce que deviennent les anciens et ce que vivent les étudiants."
      />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        {rien ? (
          <Vide>Les premières actualités arrivent bientôt.</Vide>
        ) : (
          <>
            <nav aria-label="Filtrer les publications" className="mb-12 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Filtre href={adresse(1, null, null)} actif={!type}>
                  Tout
                </Filtre>
                <Filtre href={adresse(1, null, "actualites")} actif={type === "actualites"}>
                  Actualités
                </Filtre>
                <Filtre href={adresse(1, null, "evenements")} actif={type === "evenements"}>
                  Événements
                </Filtre>
              </div>
              {annees.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-semibold text-ink-soft">Archive&nbsp;:</span>
                  {[null, ...annees].map((a) => (
                    <Filtre key={a ?? "toutes"} href={adresse(1, a, type)} actif={a === annee}>
                      {a ?? "Toutes"}
                    </Filtre>
                  ))}
                </div>
              )}
            </nav>

            {agenda.length > 0 && (
              <div className="mb-16">
                <Agenda evenements={agenda} />
              </div>
            )}

            {agenda.length > 0 && (tete || articles.length > 0) && (
              <div className="mb-10">
                <TitreSection>{type === "evenements" ? "Événements passés" : "Dernières publications"}</TitreSection>
              </div>
            )}

            {tete && (
              <div className="apparait mb-14">
                <ArticleALaUne article={tete} prioritaire />
              </div>
            )}

            {!tete && articles.length === 0 && agenda.length === 0 && (
              <Vide>{type === "evenements" ? "Aucun événement pour le moment." : "Aucune publication pour le moment."}</Vide>
            )}

            <Groupe className="grid gap-x-8 gap-y-12 md:grid-cols-2">
              {articles.map((a) => (
                <ElementGroupe key={a.id} className={a.aLaUne ? "md:col-span-2" : undefined}>
                  {a.aLaUne ? <ArticleALaUne article={a} /> : <ArticleStandard article={a} />}
                </ElementGroupe>
              ))}
            </Groupe>

            {pages > 1 && (
              <nav aria-label="Pages de l’archive" className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-bordeaux-700/15 pt-6">
                {page > 1 ? (
                  <Link href={adresse(page - 1, annee, type)} className="inline-flex items-center gap-2 text-sm font-semibold text-bordeaux-700 hover:text-bordeaux-500">
                    <ArrowLeft size={16} aria-hidden /> Plus récentes
                  </Link>
                ) : (
                  <span />
                )}
                <ol className="flex items-center gap-1">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <li key={n}>
                      <Link
                        href={adresse(n, annee, type)}
                        aria-current={n === page ? "page" : undefined}
                        aria-label={`Page ${n}`}
                        className="flex size-9 items-center justify-center rounded-abm-sm text-sm font-semibold text-bordeaux-700 hover:bg-bordeaux-100 aria-[current=page]:bg-bordeaux-700 aria-[current=page]:text-white"
                      >
                        {n}
                      </Link>
                    </li>
                  ))}
                </ol>
                {page < pages ? (
                  <Link href={adresse(page + 1, annee, type)} className="inline-flex items-center gap-2 text-sm font-semibold text-bordeaux-700 hover:text-bordeaux-500">
                    Plus anciennes <ArrowRight size={16} aria-hidden />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
