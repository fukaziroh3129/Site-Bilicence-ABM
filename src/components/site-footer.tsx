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
                <a
                  href={site.liens.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lien-anime eyebrow text-white/76 hover:text-white"
                >
                  Instagram
                </a>
              </li>
            )}
            {site.liens.linkedin && (
              <li>
                <a
                  href={site.liens.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lien-anime eyebrow text-white/76 hover:text-white"
                >
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </nav>

        {/* Les deux facultés de la bi-licence : versions blanches des logos, fond transparent (comme le sceau de l'ABM) */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5 border-t border-white/12 pt-8 md:col-span-2">
          <p className="eyebrow text-white/70">Une formation portée par</p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <li>
              <a
                href="https://economie.edu.umontpellier.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="block opacity-85 transition-opacity hover:opacity-100"
              >
                <Image src="/brand/logo-universite-faculte-economie-blanc.png" alt="Faculté d’Économie, Université de Montpellier" width={800} height={174} className="h-11 w-auto" />
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </li>
            <li>
              <a
                href="https://droit.edu.umontpellier.fr/science-politique/"
                target="_blank"
                rel="noopener noreferrer"
                className="block opacity-85 transition-opacity hover:opacity-100"
              >
                <Image src="/brand/logo-faculte-droit-science-politique-blanc.png" alt="Faculté de Droit et de Science politique, Montpellier" width={320} height={320} className="size-14" />
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </li>
          </ul>
        </div>
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
