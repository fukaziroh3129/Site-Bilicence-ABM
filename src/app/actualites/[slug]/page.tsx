import { ArrowLeft, CalendarDays, CalendarPlus, Clock, Download, ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Ornement } from "@/components/anime";
import { BoutonPartager } from "@/components/article/bouton-partager";
import { CorpsArticle, SommaireArticle } from "@/components/article/corps-article";
import { Pastille, buttonClasses, classeLien } from "@/components/ui";
import { lireArticle } from "@/lib/article-texte";
import { estEvenement, lienGoogleAgenda, type Evenement } from "@/lib/calendrier";
import { prisma } from "@/lib/db";
import { LIBELLES_CATEGORIE_ARTICLE, dateLongue, heure } from "@/lib/format";

const trouverArticle = cache(async (slug: string) => {
  return prisma.article.findFirst({ where: { slug, publie: true } });
});

const CADRAGE = { haut: "object-top", centre: "object-center", bas: "object-bottom" } as const;
const cadrageDe = (valeur: string) => CADRAGE[valeur as keyof typeof CADRAGE] ?? "object-center";

/** Trois autres publications à lire ensuite, de la même catégorie en priorité. */
async function aLireAussi(article: { id: string; categorie: string }) {
  const recentes = await prisma.article.findMany({
    where: { publie: true, id: { not: article.id } },
    orderBy: { publieLe: "desc" },
    take: 12,
    select: { id: true, slug: true, titre: true, image: true, imageCadrage: true, type: true, categorie: true },
  });
  const rang = (a: { categorie: string }) => (a.categorie === article.categorie ? 0 : 1);
  return [...recentes].sort((a, b) => rang(a) - rang(b)).slice(0, 3);
}

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

  const texte = lireArticle(article.contenu);
  const suite = await aLireAussi(article);
  // « Mis à jour » seulement si la modification est nettement postérieure à la publication.
  const misAJour = article.publieLe && article.modifieLe.getTime() - article.publieLe.getTime() > 24 * 3600_000 ? article.modifieLe : null;
  const cadrage = cadrageDe(article.imageCadrage);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
      <Link href={evenement ? "/actualites?type=evenements" : "/actualites"} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
        <ArrowLeft size={16} aria-hidden /> {evenement ? "Tous les événements" : "Toutes les actualités"}
      </Link>
      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        {article.aLaUne && <Pastille accent>À la une</Pastille>}
        <Pastille>{evenement ? "Événement" : LIBELLES_CATEGORIE_ARTICLE[article.categorie]}</Pastille>
        {!evenement && article.publieLe && <span className="text-sm text-ink-soft">{dateLongue(article.publieLe)}</span>}
        {texte.mots > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
            <Clock size={14} aria-hidden /> {texte.minutes} min de lecture
          </span>
        )}
      </div>
      <h1 className={`mt-3 font-display font-bold leading-tight text-bordeaux-700 ${article.aLaUne ? "text-4xl sm:text-5xl" : "text-4xl"}`}>{article.titre}</h1>
      {article.chapo && <p className="mt-4 text-xl text-ink-soft">{article.chapo}</p>}
      {(article.auteur || misAJour) && (
        <p className="mt-4 text-sm text-ink-soft">
          {article.auteur && (
            <>
              Rédigé par <span className="font-semibold text-ink">{article.auteur}</span>
            </>
          )}
          {article.auteur && misAJour && " · "}
          {misAJour && `Mis à jour le ${dateLongue(misAJour)}`}
        </p>
      )}
      {evenement && <EncartEvenement e={evenement} />}
      {article.image && (
        <figure className={article.aLaUne ? "relative left-1/2 mt-10 w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2" : "mt-8"}>
          {article.aLaUne ? (
            // « À la une » : grande photo, plus large que la colonne de texte.
            <Image src={article.image} alt="" width={1800} height={1000} unoptimized priority className={`aspect-[16/9] w-full rounded-abm-md object-cover shadow-abm-raised ${cadrage}`} />
          ) : (
            <Image src={article.image} alt="" width={1200} height={750} unoptimized className={`aspect-[16/10] w-full object-cover ${cadrage}`} />
          )}
          {article.imageLegende && <figcaption className="mt-2 text-sm italic text-ink-soft">{article.imageLegende}</figcaption>}
        </figure>
      )}
      {article.sommaire && texte.sommaire.length >= 2 && (
        <div className="mt-10 max-w-[44rem]">
          <SommaireArticle entrees={texte.sommaire} />
        </div>
      )}
      {texte.blocs.length > 0 && (
        <div className="mt-10 max-w-[44rem]">
          <CorpsArticle article={texte} />
        </div>
      )}
      <Ornement className="mt-16" />
      <div className="mt-8 flex justify-center">
        <BoutonPartager titre={article.titre} />
      </div>
      {suite.length > 0 && (
        <section aria-labelledby="a-lire-aussi" className="mt-14">
          <h2 id="a-lire-aussi" className="font-display text-2xl font-bold text-bordeaux-700">
            À lire aussi
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-3">
            {suite.map((a) => (
              <li key={a.id}>
                <Link href={`/actualites/${a.slug}`} className="group block">
                  {a.image ? (
                    <Image src={a.image} alt="" width={600} height={375} unoptimized className={`aspect-[16/10] w-full object-cover ${cadrageDe(a.imageCadrage)}`} />
                  ) : (
                    <div aria-hidden className="aspect-[16/10] w-full bg-beige-papier" />
                  )}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    {a.type === "EVENEMENT" ? "Événement" : LIBELLES_CATEGORIE_ARTICLE[a.categorie]}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold leading-snug text-bordeaux-700 group-hover:underline group-hover:underline-offset-4">{a.titre}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
