import type { NextConfig } from "next";

// En-têtes de sécurité envoyés avec chaque page.
const entetesSecurite = [
  // Interdit d'afficher le site dans une page tierce (protection contre le « clickjacking »)
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // Le navigateur ne doit pas deviner le type d'un fichier (ex. image piégée)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ne transmet que le nom du site (pas l'adresse complète) aux sites externes
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Le site n'utilise ni caméra, ni micro, ni géolocalisation
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Toujours en HTTPS (ignoré par les navigateurs tant que le site est en HTTP local)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Photos téléversées (actualités, bureau) : 5 Mo ; rapports de stage (PDF) : 10 Mo.
      bodySizeLimit: "11mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: entetesSecurite }];
  },
};

export default nextConfig;
