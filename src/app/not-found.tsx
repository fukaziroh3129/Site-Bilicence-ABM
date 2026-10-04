import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui";

export const metadata = { title: "Page introuvable" };

export default function PageIntrouvable() {
  return (
    <section className="fond-bordeaux filigrane relative overflow-hidden p-[14px]">
      <div className="flex min-h-[70dvh] flex-col items-center justify-center border border-white/30 px-6 py-20 text-center">
        <Image src="/brand/logo-abm-seal-white.png" alt="" width={110} height={110} className="apparait opacity-90" />
        <p className="apparait mt-8 font-impact text-7xl tracking-wide" style={{ animationDelay: "80ms" }}>
          404
        </p>
        <h1 className="apparait mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ animationDelay: "140ms" }}>
          Cette page n’existe pas ou plus
        </h1>
        <p className="apparait mt-4 max-w-[44ch] text-white/80" style={{ animationDelay: "200ms" }}>
          Le lien est peut-être ancien, ou la page a été déplacée.
        </p>
        <div className="apparait mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "260ms" }}>
          <Link href="/" className={buttonClasses("inverse")}>
            Retour à l’accueil <ArrowRight size={16} className="fleche" aria-hidden />
          </Link>
          <Link href="/contact" className={buttonClasses("outline-inverse")}>
            Signaler un problème
          </Link>
        </div>
      </div>
    </section>
  );
}
