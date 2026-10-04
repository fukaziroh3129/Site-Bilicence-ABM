import { CalendarDays, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { libellesObjets } from "@/actions/contact";
import { Apparition } from "@/components/anime";
import { PageHeader, classeLien } from "@/components/ui";
import { site } from "@/lib/site";
import { FormulaireContact } from "./formulaire";

export const metadata: Metadata = {
  title: "Contact",
  description: "Écrire au bureau de l’association Alumni Bi-Licence Montpellier.",
};

export default async function Contact({ searchParams }: PageProps<"/contact">) {
  const { objet } = await searchParams;
  const objets = await libellesObjets();

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Écrire au bureau"
        lead="Une question sur l’association, la formation, vos données ou un partenariat : le bureau vous répond par e-mail."
      />
      <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1.4fr]">
        <Apparition className="space-y-8">
          <div className="flex items-start gap-4">
            <Mail size={22} strokeWidth={1.5} className="mt-1 shrink-0 text-bordeaux-700" aria-hidden />
            <div>
              <h2 className="font-display text-xl font-bold text-bordeaux-700">Par e-mail</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {site.association.email ? (
                  <a href={`mailto:${site.association.email}`} className={classeLien}>
                    {site.association.email}
                  </a>
                ) : (
                  "Utilisez le formulaire : il arrive directement dans la boîte du bureau."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ShieldCheck size={22} strokeWidth={1.5} className="mt-1 shrink-0 text-bordeaux-700" aria-hidden />
            <div>
              <h2 className="font-display text-xl font-bold text-bordeaux-700">Vos données</h2>
              <p className="mt-1 text-sm text-ink-soft">
                La plupart des demandes se règlent seul, depuis la page{" "}
                <Link href="/vos-donnees" className={classeLien}>
                  Vos données
                </Link>
                .
              </p>
            </div>
          </div>
          {site.liens.instagram && (
            <div className="flex items-start gap-4">
              <CalendarDays size={22} strokeWidth={1.5} className="mt-1 shrink-0 text-bordeaux-700" aria-hidden />
              <div>
                <h2 className="font-display text-xl font-bold text-bordeaux-700">Les événements</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Photos et annonces sur{" "}
                  <a href={site.liens.instagram} className={classeLien} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </Apparition>

        <Apparition delai={0.1}>
          <div className="relative cadre-fin rounded-abm-md border border-bordeaux-700/20 bg-white p-6 shadow-abm-card sm:p-10">
            <FormulaireContact objets={objets} objetInitial={typeof objet === "string" ? objet : undefined} />
          </div>
        </Apparition>
      </div>
    </>
  );
}
