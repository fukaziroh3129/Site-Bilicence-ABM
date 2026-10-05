import Link from "next/link";
import { SceauFiligrane } from "@/components/anime";
import { CompteARebours } from "@/components/evenements/compte-a-rebours";
import { TitreSection, buttonClasses } from "@/components/ui";
import type { Evenement } from "@/lib/calendrier";
import { dateLongue, heure } from "@/lib/format";

// Mise en page validée par Guillaume (PATCHS.md, MEM-08, maquette B) : le prochain rendez-vous
// en grand avec un compte à rebours, puis la frise des suivants mois par mois. Depuis la fusion
// des actualités et des événements, ce bloc ouvre la page publique /actualites ; un clic mène
// à la page de l'événement.

/** Jour, jour de la semaine et mois d'une date, en heure de Paris. */
export function morceaux(date: Date) {
  const f = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "Europe/Paris" }).format(date);
  return { jour: f({ day: "numeric" }), jourSemaine: f({ weekday: "short" }), mois: f({ month: "long", year: "numeric" }) };
}

/** Les événements à venir (triés du plus proche au plus lointain). */
export function Agenda({ evenements }: { evenements: Evenement[] }) {
  const [prochain, ...suivants] = evenements;
  if (!prochain) return null;

  // Les événements suivants, regroupés par mois pour la frise.
  const parMois: { mois: string; evenements: Evenement[] }[] = [];
  for (const e of suivants) {
    const mois = morceaux(e.debut).mois;
    if (parMois.at(-1)?.mois === mois) parMois.at(-1)!.evenements.push(e);
    else parMois.push({ mois, evenements: [e] });
  }

  return (
    <section aria-label="Événements à venir" className="space-y-10">
      {/* Le prochain rendez-vous */}
      <div className="fond-bordeaux filigrane relative grid items-end gap-8 overflow-hidden rounded-abm-lg px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto]">
        <SceauFiligrane className="-right-20 -top-24 size-[340px]" />
        <div className="relative">
          <p className="apparait eyebrow text-white/76">Prochain rendez-vous</p>
          <h2 className="apparait mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl" style={{ animationDelay: "80ms" }}>
            {prochain.titre}
          </h2>
          <p className="apparait mt-2 text-white/85" style={{ animationDelay: "140ms" }}>
            {dateLongue(prochain.debut)} à {heure(prochain.debut)}
            {prochain.lieu && ` · ${prochain.lieu}`}
          </p>
          <div className="apparait mt-6" style={{ animationDelay: "200ms" }}>
            <Link href={`/actualites/${prochain.slug}`} className={buttonClasses("inverse")}>
              Voir le détail
            </Link>
          </div>
        </div>
        <div className="apparait relative" style={{ animationDelay: "260ms" }}>
          <CompteARebours debut={prochain.debut.toISOString()} />
        </div>
      </div>

      {/* La frise des suivants */}
      {parMois.length > 0 && (
        <div>
          <TitreSection>Ensuite</TitreSection>
          <ol className="ml-2.5 mt-6 border-l-2 border-bordeaux-200 pl-8">
            {parMois.map(({ mois, evenements }) => (
              <li key={mois} className="pb-4">
                <p className="eyebrow relative mb-3 mt-2 text-bordeaux-500 before:absolute before:-left-[41px] before:top-0 before:size-3.5 before:rounded-abm-pill before:bg-bordeaux-700 before:shadow-[0_0_0_5px_var(--abm-paper)]">
                  {mois}
                </p>
                <ul className="space-y-2.5">
                  {evenements.map((e) => {
                    const m = morceaux(e.debut);
                    return (
                      <li key={e.id}>
                        <Link
                          href={`/actualites/${e.slug}`}
                          className="grid w-full grid-cols-[64px_1fr] items-center gap-4 rounded-abm-md border border-bordeaux-700/15 bg-white px-4 py-3.5 transition-[border-color,transform] duration-200 hover:translate-x-1 hover:border-bordeaux-400 sm:grid-cols-[64px_1fr_auto]"
                        >
                          <span className="text-center">
                            <span className="block font-display text-3xl font-extrabold leading-none text-bordeaux-700">{m.jour}</span>
                            <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-soft">{m.jourSemaine}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block font-display text-lg font-bold text-ink">{e.titre}</span>
                            <span className="block text-sm text-ink-soft">
                              {heure(e.debut)}
                              {e.lieu && ` · ${e.lieu}`}
                            </span>
                          </span>
                          <span className="hidden text-sm font-semibold text-bordeaux-700 underline underline-offset-4 sm:block">Détail</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
