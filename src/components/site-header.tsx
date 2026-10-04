import Image from "next/image";
import Link from "next/link";
import { LienNav } from "@/components/lien-nav";
import { MobileMenu } from "@/components/mobile-menu";
import { buttonClasses } from "@/components/ui";
import { navigation, site } from "@/lib/site";

export function SiteHeader() {
  return (
    // Reste visible en haut de l'écran pendant le défilement (fond plein, sans flou : charte).
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

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 xl:flex">
          {navigation.map((item) => (
            <LienNav key={item.href} href={item.href}>
              {item.label}
            </LienNav>
          ))}
          <Link href="/espace" className={buttonClasses("primary")}>
            Espace membres
          </Link>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
