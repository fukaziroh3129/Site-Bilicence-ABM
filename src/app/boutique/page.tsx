import { ExternalLink, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Apparition } from "@/components/anime";
import { WidgetHelloAsso } from "@/components/boutique/widget-helloasso";
import { AFaire, PageHeader, buttonClasses } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Les goodies de la bi-licence Économie / Sciences politiques, vendus par l’association sur HelloAsso.",
};

// Adresses de la boutique en cours (src/lib/site.ts), acceptées seulement si elles viennent de helloasso.com.
const widgetSur = (adresse: string | null | undefined) => (adresse?.startsWith("https://www.helloasso.com/") ? adresse : null);
const widget = widgetSur(site.liens.boutique?.widget);
const vignette = widgetSur(site.liens.boutique?.vignette);

export default function Boutique() {
  return (
    <>
      <PageHeader
        eyebrow="Boutique"
        title="La boutique de la bi-licence"
        lead="Les goodies aux couleurs de la bi-licence. Chaque achat soutient les projets de l’association."
      />

      <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <Apparition className="space-y-7">
          <p className="max-w-[56ch] text-lg">
            La boutique est hébergée par HelloAsso, la plateforme de paiement en ligne des associations. Vous pouvez
            commander directement sur cette page, ou retrouver toutes nos boutiques sur HelloAsso.
          </p>
          <p className="flex items-start gap-3 text-sm text-ink-soft">
            <ShieldCheck size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-bordeaux-700" aria-hidden />
            Le paiement se fait chez HelloAsso&nbsp;: aucune donnée bancaire ne transite par ce site ni n’y est conservée.
          </p>
          {site.liens.helloAsso ? (
            <a href={site.liens.helloAsso} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
              Toutes les boutiques sur HelloAsso
              <ExternalLink size={16} aria-hidden />
            </a>
          ) : (
            <AFaire>lien vers la page HelloAsso de l’association (à renseigner dans src/lib/site.ts).</AFaire>
          )}
        </Apparition>

        {vignette && (
          <Apparition delai={0.15} className="mx-auto w-full max-w-sm">
            <iframe
              src={vignette}
              title="Aperçu de la boutique de l’année sur HelloAsso"
              loading="lazy"
              className="block h-[513px] w-full border-0"
            />
          </Apparition>
        )}
      </div>

      {widget ? (
        <section className="border-t border-bordeaux-700/15 bg-white" aria-labelledby="commander">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8 sm:py-20">
            <h2 id="commander" className="font-display text-3xl font-bold text-bordeaux-700">
              Commander sans quitter le site
            </h2>
            <p className="mt-2 text-sm text-ink-soft">Boutique et paiement fournis par HelloAsso.</p>
            <div className="mt-8 overflow-hidden rounded-abm-md border border-bordeaux-700/20 shadow-abm-card">
              <WidgetHelloAsso src={widget} titre="Boutique de la bi-licence sur HelloAsso" />
            </div>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-8">
          <p className="text-ink-soft">Pas de boutique en cours pour le moment&nbsp;: revenez bientôt.</p>
        </div>
      )}
    </>
  );
}
