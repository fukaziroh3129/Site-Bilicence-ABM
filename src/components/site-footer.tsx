import Image from "next/image";
import Link from "next/link";
import { navigation, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="fond-bordeaux-profond filigrane relative overflow-hidden">
      <div className="filet-degrade absolute inset-x-0 top-0 opacity-60 [background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div className="flex items-center gap-5">
          <Image src="/brand/logo-abm-seal-white.png" alt="" width={84} height={84} />
          <div>
            <p className="font-display text-xl font-bold">{site.nom}</p>
            <p className="mt-1 max-w-[40ch] text-sm text-white/76">
              Association des étudiants et diplômés de la {site.formation}, {site.universite}
            </p>
          </div>
        </div>

        <nav aria-label="Liens du pied de page">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="lien-anime eyebrow text-white/76 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="lien-anime eyebrow text-white/76 hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/espace" className="lien-anime eyebrow text-white/76 hover:text-white">
                Espace membres
              </Link>
            </li>
            {site.liens.instagram && (
              <li>
                <a href={site.liens.instagram} className="lien-anime eyebrow text-white/76 hover:text-white">
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="relative border-t border-white/12">
        <p className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-1 px-4 py-5 text-xs text-white/60 sm:px-8">
          <Link href="/mentions-legales" className="lien-anime hover:text-white">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="lien-anime hover:text-white">
            Politique de confidentialité
          </Link>
          <Link href="/vos-donnees" className="lien-anime hover:text-white">
            Vos données (RGPD)
          </Link>
          <span className="ml-auto">
            © {new Date().getFullYear()} {site.nom}
          </span>
        </p>
      </div>
    </footer>
  );
}
