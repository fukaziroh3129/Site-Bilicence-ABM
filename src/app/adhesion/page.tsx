import { ExternalLink, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Apparition, SceauFiligrane } from "@/components/anime";
import { AFaire, PageHeader, buttonClasses } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Adhésion",
  description: "Adhérer à l’association Alumni Bi-Licence Montpellier ou faire un don.",
};

/** Illustration : la carte de membre de l'association (élément graphique, pas une vraie carte). */
function CarteMembre() {
  return (
    <div className="group [perspective:1200px]">
      <div className="fond-bordeaux cadre-fin relative aspect-[1.586] w-full overflow-hidden rounded-abm-lg p-7 shadow-abm-raised transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:[transform:rotateY(-6deg)_rotateX(4deg)]">
        <SceauFiligrane className="-bottom-24 -right-20 size-72" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <Image src="/brand/logo-abm-seal-white.png" alt="" width={64} height={64} />
            <span className="eyebrow text-white/70">Carte de membre</span>
          </div>
          <div>
            <p className="font-impact text-4xl tracking-wide sm:text-5xl">MEMBRE</p>
            <p className="mt-1 font-display text-lg font-bold">{site.nom}</p>
            <p className="eyebrow mt-3 text-white/60">Économie · Sciences politiques</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Formulaire HelloAsso intégré, accepté seulement s'il vient bien de helloasso.com. */
const widget = site.liens.helloAssoWidget?.startsWith("https://www.helloasso.com/") ? site.liens.helloAssoWidget : null;

export default function Adhesion() {
  return (
    <>
      <PageHeader
        eyebrow="Adhésion"
        title="Adhérer à l’association"
        lead={"L’adhésion est gratuite. Elle fait vivre l’association : événements, voyage institutionnel, entraide entre promotions."}
      />

      <div className="mx-auto grid max-w-5xl items-center gap-14 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
        <Apparition className="space-y-8">
          <p className="max-w-[56ch] text-lg">
            L’adhésion se fait, comme les dons, sur HelloAsso, la plateforme
            en ligne utilisée par les associations.
          </p>
          <p className="flex items-start gap-3 text-sm text-ink-soft">
            <ShieldCheck size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-bordeaux-700" aria-hidden />
            Le paiement ne transite pas par ce site&nbsp;: aucune donnée bancaire n’y est saisie ni conservée.
          </p>

          {site.liens.helloAsso ? (
            <a href={site.liens.helloAsso} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
              Adhérer sur HelloAsso
              <ExternalLink size={16} aria-hidden />
            </a>
          ) : (
            !widget && <AFaire>lien vers la page HelloAsso de l’association (à renseigner dans src/lib/site.ts).</AFaire>
          )}
        </Apparition>

        <Apparition delai={0.15} className="mx-auto w-full max-w-md">
          <CarteMembre />
        </Apparition>
      </div>

      {widget && (
        <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-8" aria-labelledby="formulaire-adhesion">
          <h2 id="formulaire-adhesion" className="font-display text-2xl font-bold text-bordeaux-700">
            Adhérer sans quitter le site
          </h2>
          <p className="mt-2 text-sm text-ink-soft">Formulaire fourni par HelloAsso.</p>
          <iframe
            src={widget}
            title="Formulaire d’adhésion HelloAsso"
            loading="lazy"
            className="mt-6 h-[780px] w-full rounded-abm-md border border-bordeaux-700/20 bg-white"
          />
        </section>
      )}
    </>
  );
}
