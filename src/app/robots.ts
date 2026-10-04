import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/url";

// Indique aux moteurs de recherche ce qu'ils peuvent indexer : jamais l'espace membres ni l'administration.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/espace", "/admin", "/api", "/compte-en-attente", "/reinitialiser-mot-de-passe", "/invitation"],
    },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
