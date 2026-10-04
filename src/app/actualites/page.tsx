import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ElementGroupe, Groupe } from "@/components/anime";
import { PageHeader, Pastille, Vide } from "@/components/ui";
import type { Article } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { LIBELLES_CATEGORIE_ARTICLE, dateCourte } from "@/lib/format";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Portraits d’anciens et d’étudiants, vie de la bi-licence et de l’association.",
};

/** Nombre d'articles par page de l'archive. */
const PAR_PAGE = 10;

/** Adresse d'une page de l'archive (sans paramètre inutile). */
function adresse(page: number, annee: number | null) {
  const p = new URLSearchParams();
  if (annee) p.set("annee", String(annee));
  if (page > 1) p.set("page", String(page));
  const q = p.toString();
  return q ? `/actualites?${q}` : "/actualites";
}

/** Article « à la une » : grande photo et grand titre, sur toute la largeur. */
function ArticleALaUne({ article: a }: { article: Article }) {
  return (
    <Link href={`/actualites/${a.slug}`} className="group grid overflow-hidden rounded-abm-md border border-bordeaux-700/20 bg-white shadow-abm-card lg:grid-cols-[1.35fr_1fr]">
      {a.image ? (
        <div className="zoom-image">
          <Image src={a.image} alt="" width={1400} height={875} unoptimized priority className="aspect-[16/10] h-full w-full object-cover" />
        </div>
      ) : (
        <div aria-hidden className="fond-bordeaux filigrane hidden lg:block" />
      )}
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <Pastille accent>À la une</Pastille>
          <Pastille>{LIBELLES_CATEGORIE_ARTICLE[a.categorie]}</Pastille>
          {a.publieLe && <span className="text-xs text-ink-soft">{dateCourte(a.publieLe)}</span>}
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-bordeaux-700 group-hover:text-bordeaux-500 sm:text-4xl">
          {a.titre}
        </h2>
        {a.chapo && <p className="mt-4 text-lg text-ink-soft">{a.chapo}</p>}
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-bordeaux-700">
          Lire l’article <ArrowRight size={16} className="fleche" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Article au format standard (demi-colonne). */
function ArticleStandard({ article: a }: { article: Article }) {
  return (
    <Link href={`/actualites/${a.slug}`} className="group block">
      {a.image && (
        <div className="zoom-image rounded-abm-md">
          <Image src={a.image} alt="" width={800} height={500} unoptimized className="aspect-[16/10] w-full object-cover" />
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pastille>{LIBELLES_CATEGORIE_ARTICLE[a.categorie]}</Pastille>
        {a.publieLe && <span className="text-xs text-ink-soft">{dateCourte(a.publieLe)}</span>}
      </div>
      <h2 className="mt-2 font-display text-2xl font-bold text-bordeaux-700 group-hover:text-bordeaux-500">{a.titre}</h2>
      {a.chapo && <p className="mt-2 text-ink-soft">{a.chapo}</p>}
    </Link>
  );
}

export default async function Actualites({ searchParams }: PageProps<"/actualites">) {
  await connection();
  const p = await searchParams;
  const anneeDemandee = Number(p.annee);
  const pageDemandee = Number(p.page);

  // Années ayant au moins un article publié (filtre de l'archive).
  const dates = await prisma.article.findMany({ where: { publie: true }, select: { publieLe: true } });
  const annees = [...new Set(dates.map((d) => d.publieLe?.getFullYear()).filter((a): a is number => !!a))].sort((a, b) => b - a);
  const annee = annees.includes(anneeDemandee) ? anneeDemandee : null;

  // Sans filtre d'année, le dernier article « à la une » passe en tête de la première page ;
  // il est alors retiré de la liste paginée (pour ne pas l'afficher deux fois).
  const une = annee ? null : await prisma.article.findFirst({ where: { publie: true, aLaUne: true }, orderBy: { publieLe: "desc" } });
  const filtre = {
    publie: true,
    ...(annee ? { publieLe: { gte: new Date(annee, 0, 1), lt: new Date(annee + 1, 0, 1) } } : {}),
    ...(une ? { id: { not: une.id } } : {}),
  };
  const total = await prisma.article.count({ where: filtre });
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));
  const page = Number.isInteger(pageDemandee) && pageDemandee >= 1 && pageDemandee <= pages ? pageDemandee : 1;
  const tete = page === 1 ? une : null;
  const articles = await prisma.article.findMany({
    where: filtre,
    orderBy: { publieLe: "desc" },
    skip: (page - 1) * PAR_PAGE,
    take: PAR_PAGE,
  });

  return (
    <>
      <PageHeader
        eyebrow="Actualités"
        title="Portraits et vie de la licence"
        lead="Ce que deviennent les anciens, ce que vivent les étudiants, et les nouvelles de l’association."
      />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        {total === 0 && !une ? (
          <Vide>Les premières actualités arrivent bientôt.</Vide>
        ) : (
          <>
            {annees.length > 1 && (
              <nav aria-label="Archive par année" className="mb-12 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-sm font-semibold text-ink-soft">Archive&nbsp;:</span>
                {[null, ...annees].map((a) => (
                  <Link
                    key={a ?? "toutes"}
                    href={adresse(1, a)}
                    aria-current={a === annee ? "page" : undefined}
                    className="rounded-abm-pill border border-bordeaux-700/30 px-3 py-1 text-sm font-semibold text-bordeaux-700 hover:bg-bordeaux-100 aria-[current=page]:border-bordeaux-700 aria-[current=page]:bg-bordeaux-700 aria-[current=page]:text-white"
                  >
                    {a ?? "Toutes"}
                  </Link>
                ))}
              </nav>
            )}

            {tete && (
              <div className="apparait mb-14">
                <ArticleALaUne article={tete} />
              </div>
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
                  <Link href={adresse(page - 1, annee)} className="inline-flex items-center gap-2 text-sm font-semibold text-bordeaux-700 hover:text-bordeaux-500">
                    <ArrowLeft size={16} aria-hidden /> Plus récentes
                  </Link>
                ) : (
                  <span />
                )}
                <ol className="flex items-center gap-1">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <li key={n}>
                      <Link
                        href={adresse(n, annee)}
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
                  <Link href={adresse(page + 1, annee)} className="inline-flex items-center gap-2 text-sm font-semibold text-bordeaux-700 hover:text-bordeaux-500">
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
