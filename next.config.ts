import type { NextConfig } from "next";

const developpement = process.env.NODE_ENV !== "production";

// Politique de sécurité du contenu : le navigateur ne charge que des ressources du site lui-même (scripts,
// images, polices, connexions), plus le cadre de la boutique HelloAsso. Un script injecté ne pourrait donc
// ni charger de code extérieur ni envoyer de données ailleurs.
// 'unsafe-inline' reste nécessaire aux petits scripts que Next.js insère dans chaque page ; 'unsafe-eval'
// sert seulement au rechargement à chaud en développement.
const politiqueContenu = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${developpement ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${developpement ? " ws:" : ""}`,
  "frame-src https://www.helloasso.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(developpement ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// En-têtes de sécurité envoyés avec chaque page.
const entetesSecurite = [
  // Interdit d'afficher le site dans une page tierce (protection contre le « clickjacking »)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: politiqueContenu },
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
  async redirects() {
    // L'ancienne page « Créer un compte » est devenue la page d'adhésion (octobre 2026).
    return [{ source: "/inscription", destination: "/adhesion", permanent: true }];
  },
  async headers() {
    return [{ source: "/:path*", headers: entetesSecurite }];
  },
};

export default nextConfig;
