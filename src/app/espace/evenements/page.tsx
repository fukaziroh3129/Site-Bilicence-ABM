import { CalendarDays, CalendarPlus, Download, ExternalLink, MapPin } from "lucide-react";
import { BoutonFenetre } from "@/components/fenetre/fenetre";
import { CompteARebours } from "@/components/evenements/compte-a-rebours";
import { SceauFiligrane } from "@/components/anime";
import { TitreSection, Vide, buttonClasses, classeLien } from "@/components/ui";
import type { Evenement } from "@/generated/prisma/client";
import { lienGoogleAgenda } from "@/lib/calendrier";
import { prisma } from "@/lib/db";
import { dateLongue, heure } from "@/lib/format";
import { exigerMembreActif } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata = { title: "Événements" };

// Mise en page validée par Guillaume (PATCHS.md, MEM-08, maquette B + affiches de la maquette A) :
// le prochain rendez-vous en grand avec un compte à rebours, la frise des suivants mois par mois,
// puis les événements passés en « affiches » qui défilent. Un clic ouvre la fiche détaillée.

/** Jour, jour de la semaine et mois d'une date, en heure de Paris. */
function morceaux(date: Date) {
  const f = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "Europe/Paris" }).format(date);
  return { jour: f({ day: "numeric" }), jourSemaine: f({ weekday: "short" }), mois: f({ month: "long", year: "numeric" }), moisCourt: f({ month: "short" }) };
}

function Detail({ e }: { e: Evenement }) {
  return (
    <div className="space-y-6">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
          <CalendarDays size={17} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
          <div>
            <dt className="eyebrow text-[0.68rem] text-ink-soft">Date</dt>
            <dd className="text-sm">
              {dateLongue(e.debut)} à {heure(e.debut)}
              {e.fin && ` — jusqu’à ${heure(e.fin)}`}
            </dd>
          </div>
        </div>
        {e.lieu && (
          <div className="flex items-start gap-3 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
            <MapPin size={17} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
            <div>
              <dt className="eyebrow text-[0.68rem] text-ink-soft">Lieu</dt>
              <dd className="text-sm">{e.lieu}</dd>
            </div>
          </div>
        )}
      </dl>
      {e.description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed">{e.description}</p>
      ) : (
        <p className="text-sm italic text-ink-soft">Pas encore de description.</p>
      )}
    </div>
  );
}

function Pied({ e, aVenir }: { e: Evenement; aVenir: boolean }) {
  return (
    <>
      {aVenir && (
        <>
          <a href={lienGoogleAgenda(e)} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
            <CalendarPlus size={16} aria-hidden /> Ajouter à Google Agenda
          </a>
          <a href={`/espace/evenements/${e.id}/ics`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
            <Download size={14} aria-hidden /> Autre agenda (.ics)
          </a>
        </>
      )}
      {e.lien && (
        <a href={e.lien} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
          <ExternalLink size={14} aria-hidden /> En savoir plus
        </a>
      )}
    </>
  );
}

/** Fenêtre détaillée d'un événement, ouverte par le bouton fourni. */
function Fiche({ e, aVenir, libelle, classeBouton }: { e: Evenement; aVenir: boolean; libelle: React.ReactNode; classeBouton: string }) {
  return (
    <BoutonFenetre
      libelle={libelle}
      classeBouton={classeBouton}
      surtitre={`${dateLongue(e.debut)} · ${heure(e.debut)}`}
      titre={e.titre}
      pied={aVenir || e.lien ? <Pied e={e} aVenir={aVenir} /> : undefined}
    >
      <Detail e={e} />
    </BoutonFenetre>
  );
}

export default async function Evenements() {
  await exigerMembreActif();
  const maintenant = new Date();
  const [aVenir, passes] = await Promise.all([
    prisma.evenement.findMany({ where: { debut: { gte: maintenant } }, orderBy: { debut: "asc" } }),
    prisma.evenement.findMany({ where: { debut: { lt: maintenant } }, orderBy: { debut: "desc" }, take: 20 }),
  ]);
  const [prochain, ...suivants] = aVenir;

  // Les événements suivants, regroupés par mois pour la frise.
  const parMois: { mois: string; evenements: Evenement[] }[] = [];
  for (const e of suivants) {
    const mois = morceaux(e.debut).mois;
    if (parMois.at(-1)?.mois === mois) parMois.at(-1)!.evenements.push(e);
    else parMois.push({ mois, evenements: [e] });
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-bordeaux-700">Événements</h1>
        <p className="mt-2 text-ink-soft">
          Les rendez-vous de l’association.
          {site.liens.instagram && (
            <>
              {" "}
              Photos et ambiance sur{" "}
              <a href={site.liens.instagram} className={classeLien} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              .
            </>
          )}
        </p>
      </div>

      {!prochain ? (
        <Vide>Aucun événement à venir pour le moment.</Vide>
      ) : (
        <section aria-label="À venir" className="space-y-10">
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
                <Fiche e={prochain} aVenir libelle="Voir le détail" classeBouton={buttonClasses("inverse")} />
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
                            <Fiche
                              e={e}
                              aVenir
                              classeBouton="grid w-full grid-cols-[64px_1fr] items-center gap-4 rounded-abm-md border border-bordeaux-700/15 bg-white px-4 py-3.5 text-left transition-[border-color,transform] duration-200 hover:translate-x-1 hover:border-bordeaux-400 sm:grid-cols-[64px_1fr_auto]"
                              libelle={
                                <>
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
                                </>
                              }
                            />
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
      )}

      {/* Les événements passés, en affiches qui défilent */}
      {passes.length > 0 && (
        <section className="space-y-4">
          <TitreSection>Passés</TitreSection>
          <ul className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 pt-2">
            {passes.map((e) => {
              const m = morceaux(e.debut);
              return (
                <li key={e.id} className="w-[260px] shrink-0 snap-start">
                  <Fiche
                    e={e}
                    aVenir={false}
                    classeBouton="block h-full w-full overflow-hidden rounded-abm-md border border-bordeaux-700/15 bg-white text-left shadow-abm-card transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5"
                    libelle={
                      <>
                        <span className="relative block min-h-[150px] overflow-hidden bg-beige-papier px-5 pb-5 pt-5 text-bordeaux-700">
                          <span aria-hidden className="absolute -right-10 -top-10 size-36 rounded-abm-pill border border-bordeaux-700/10" />
                          <span className="block font-display text-6xl font-extrabold leading-none">{m.jour}</span>
                          <span className="mt-1.5 block text-xs font-bold uppercase tracking-[0.2em]">{m.mois}</span>
                        </span>
                        <span className="block px-5 pb-5 pt-4">
                          <span className="block font-display text-lg font-bold leading-snug text-bordeaux-700">{e.titre}</span>
                          {e.lieu && <span className="mt-1 block text-sm text-ink-soft">{e.lieu}</span>}
                        </span>
                      </>
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
