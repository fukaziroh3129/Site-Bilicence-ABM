import type { Metadata, Viewport } from "next";
import { Anton, Great_Vibes, Playfair_Display, Source_Sans_3 } from "next/font/google";
import { FournisseurAnimations } from "@/components/anime";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import { URL_SITE } from "@/lib/url";
import "./globals.css";

// Polices de la charte, téléchargées au moment du build et servies par notre propre
// serveur : aucun appel à Google depuis le navigateur des visiteurs (préférable pour le RGPD).
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: site.nom,
    template: `%s — ${site.sigle}`,
  },
  description: site.description,
  applicationName: site.nom,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: site.nom,
  },
  twitter: { card: "summary_large_image" },
};

// Couleur de la barre du navigateur sur téléphone
export const viewport: Viewport = {
  themeColor: "#5C1A1E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${anton.variable} ${greatVibes.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <FournisseurAnimations>
          {/* Lien d'évitement : visible seulement au clavier, pour sauter la navigation */}
          <a
            href="#contenu"
            className="sr-only z-50 bg-bordeaux-700 px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Aller au contenu
          </a>
          <SiteHeader />
          <main id="contenu" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
        </FournisseurAnimations>
      </body>
    </html>
  );
}
