import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { URL_SITE } from "@/lib/url";

// Plan du site pour les moteurs de recherche : pages publiques et actualités publiées.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/la-formation", "/actualites", "/promotions", "/erasmus", "/bureau", "/adhesion", "/contact", "/mentions-legales", "/confidentialite", "/vos-donnees"];

  const articles = await prisma.article
    .findMany({ where: { publie: true }, select: { slug: true, modifieLe: true } })
    .catch(() => []);

  return [
    ...pages.map((chemin) => ({ url: `${URL_SITE}${chemin}`, changeFrequency: "monthly" as const, priority: chemin === "" ? 1 : 0.6 })),
    ...articles.map((a) => ({ url: `${URL_SITE}/actualites/${a.slug}`, lastModified: a.modifieLe, priority: 0.5 })),
  ];
}
