import Image from "next/image";
import Link from "next/link";
import { BoutonMembres } from "@/components/bouton-membres";
import { LienNav } from "@/components/lien-nav";
import { MobileMenu } from "@/components/mobile-menu";
import { navigationEntete, site } from "@/lib/site";

export function SiteHeader() {
  return (
    // Reste visible en haut de l'écran pendant le défilement (fond plein, sans flou : charte).
    // Liens visibles dès 1 024 px (libellés courts jusqu'à 1 279 px), bouton membres dès 768 px, menu ☰ en dessous de 1 024 px.
    <header className="sticky top-0 z-40 border-b border-bordeaux-700/15 bg-paper shadow-[0_8px_24px_-18px_rgba(43,13,15,0.25)]">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3 text-bordeaux-700">
          <Image
            src="/brand/logo-abm-seal-bordeaux.png"
            alt=""
            width={48}
            height={48}
            priority
            className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:-rotate-12"
          />
          <span className="font-display text-lg font-bold leading-tight max-sm:text-base">
            {site.nom}
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav aria-label="Navigation principale" className="hidden items-center gap-5 lg:flex xl:gap-6">
            {navigationEntete.map((item) => (
              <LienNav key={item.href} href={item.href}>
                {item.court ? (
                  <>
                    <span className="xl:hidden">{item.court}</span>
                    <span className="hidden xl:inline">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </LienNav>
            ))}
          </nav>
          <BoutonMembres />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
