import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Ornement } from "@/components/anime";
import { Pastille, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_CATEGORIE_ARTICLE, dateLongue } from "@/lib/format";

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

export default async function Article({ params }: PageProps<"/actualites/[slug]">) {
  const article = await trouverArticle((await params).slug);
  if (!article) notFound();

  // Paragraphes séparés par une ligne vide.
  const paragraphes = article.contenu.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
      <Link href="/actualites" className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
        <ArrowLeft size={16} aria-hidden /> Toutes les actualités
      </Link>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {article.aLaUne && <Pastille accent>À la une</Pastille>}
        <Pastille>{LIBELLES_CATEGORIE_ARTICLE[article.categorie]}</Pastille>
        {article.publieLe && <span className="text-sm text-ink-soft">{dateLongue(article.publieLe)}</span>}
      </div>
      <h1 className={`mt-3 font-display font-bold leading-tight text-bordeaux-700 ${article.aLaUne ? "text-4xl sm:text-5xl" : "text-4xl"}`}>{article.titre}</h1>
      {article.chapo && <p className="mt-4 text-xl text-ink-soft">{article.chapo}</p>}
      {article.image &&
        (article.aLaUne ? (
          // « À la une » : grande photo, plus large que la colonne de texte.
          <div className="relative left-1/2 mt-10 w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2">
            <Image src={article.image} alt="" width={1800} height={1000} unoptimized priority className="aspect-[16/9] w-full rounded-abm-md object-cover shadow-abm-raised" />
          </div>
        ) : (
          <Image src={article.image} alt="" width={1200} height={750} unoptimized className="mt-8 w-full object-cover" />
        ))}
      <div className="lettrine mt-10 max-w-[62ch] space-y-5 text-lg leading-relaxed">
        {paragraphes.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
      <Ornement className="mt-16" />
    </article>
  );
}
