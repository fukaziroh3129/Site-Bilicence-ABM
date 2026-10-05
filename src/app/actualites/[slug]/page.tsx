import { ArrowLeft, CalendarDays, CalendarPlus, Download, ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Ornement } from "@/components/anime";
import { Pastille, buttonClasses, classeLien } from "@/components/ui";
import { estEvenement, lienGoogleAgenda, type Evenement } from "@/lib/calendrier";
import { prisma } from "@/lib/db";
import { LIBELLES_CATEGORIE_ARTICLE, dateLongue, heure } from "@/lib/format";

const trouverArticle = cache(async (slug: string) => {
  return prisma.article.findFirst({ where: { slug, publie: true } });
});

export async function generateMetadata({ params }: PageProps<"/actualites/[slug]">): Promise<Metadata> {
  const article = await trouverArticle((await params).slug);
  if (!article) return {};
  return {
    title: article.titre,
    description: article.chapo ?? undefined,
    openGraph: {
      type: "article",
      title: article.titre,
      description: article.chapo ?? undefined,
      publishedTime: article.publieLe?.toISOString(),
      ...(article.image ? { images: [{ url: article.image }] } : {}),
    },
  };
}

/** Encart d'un événement : date, lieu et, s'il est à venir, ajout à l'agenda. */
function EncartEvenement({ e }: { e: Evenement }) {
  const aVenir = e.debut >= new Date();
  return (
    <div className="mt-8 space-y-5 rounded-abm-md border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-6">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <CalendarDays size={18} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
          <div>
            <dt className="eyebrow text-[0.68rem] text-ink-soft">Date</dt>
            <dd>
              {dateLongue(e.debut)} à {heure(e.debut)}
              {e.fin && ` — jusqu’à ${heure(e.fin)}`}
            </dd>
          </div>
        </div>
        {e.lieu && (
          <div className="flex items-start gap-3">
            <MapPin size={18} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
            <div>
              <dt className="eyebrow text-[0.68rem] text-ink-soft">Lieu</dt>
              <dd>{e.lieu}</dd>
            </div>
          </div>
        )}
      </dl>
      {(aVenir || e.lien) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-bordeaux-700/10 pt-5">
          {aVenir && (
            <>
              <a href={lienGoogleAgenda(e)} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
                <CalendarPlus size={16} aria-hidden /> Ajouter à Google Agenda
              </a>
              <a href={`/actualites/${e.slug}/ics`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
                <Download size={14} aria-hidden /> Autre agenda (.ics)
              </a>
            </>
          )}
          {e.lien && (
            <a href={e.lien} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
              <ExternalLink size={14} aria-hidden /> En savoir plus
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default async function Article({ params }: PageProps<"/actualites/[slug]">) {
  const article = await trouverArticle((await params).slug);
  if (!article) notFound();
  const evenement = estEvenement(article) ? article : null;

  // Paragraphes séparés par une ligne vide.
  const paragraphes = (article.contenu ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
      <Link href={evenement ? "/actualites?type=evenements" : "/actualites"} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
        <ArrowLeft size={16} aria-hidden /> {evenement ? "Tous les événements" : "Toutes les actualités"}
      </Link>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {article.aLaUne && <Pastille accent>À la une</Pastille>}
        <Pastille>{evenement ? "Événement" : LIBELLES_CATEGORIE_ARTICLE[article.categorie]}</Pastille>
        {!evenement && article.publieLe && <span className="text-sm text-ink-soft">{dateLongue(article.publieLe)}</span>}
      </div>
      <h1 className={`mt-3 font-display font-bold leading-tight text-bordeaux-700 ${article.aLaUne ? "text-4xl sm:text-5xl" : "text-4xl"}`}>{article.titre}</h1>
      {article.chapo && <p className="mt-4 text-xl text-ink-soft">{article.chapo}</p>}
      {evenement && <EncartEvenement e={evenement} />}
      {article.image &&
        (article.aLaUne ? (
          // « À la une » : grande photo, plus large que la colonne de texte.
          <div className="relative left-1/2 mt-10 w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2">
            <Image src={article.image} alt="" width={1800} height={1000} unoptimized priority className="aspect-[16/9] w-full rounded-abm-md object-cover shadow-abm-raised" />
          </div>
        ) : (
          <Image src={article.image} alt="" width={1200} height={750} unoptimized className="mt-8 w-full object-cover" />
        ))}
      {paragraphes.length > 0 && (
        <div className="lettrine mt-10 max-w-[62ch] space-y-5 text-lg leading-relaxed">
          {paragraphes.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      )}
      <Ornement className="mt-16" />
    </article>
  );
}
