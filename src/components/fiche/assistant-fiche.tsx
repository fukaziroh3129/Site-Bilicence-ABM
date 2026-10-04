// « Ma fiche » en six étapes, avec barre de progression et aperçu de la carte publique.
// Les étapes à formulaire n'enregistrent que leurs champs ; les étapes à liste (études,
// expériences, Erasmus) renvoient vers les pages d'ajout, qui ramènent ensuite ici.

import { ArrowLeft, ArrowRight, Check, Clock, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { SceauFiligrane } from "@/components/anime";
import { EtapeAujourdhui, EtapeCarte, EtapeIdentite } from "@/components/fiche/formulaires-etapes";
import { ListeErasmus, ListeExperiences, ListeFormations } from "@/components/fiche/listes-fiche";
import { ApercuCarte } from "@/components/parcours/apercu-carte";
import type { CarteParcours } from "@/components/parcours/types";
import { buttonClasses, classeLien } from "@/components/ui";
import type { Erasmus, Experience, Formation, Personne, Etablissement } from "@/generated/prisma/client";
import { ETAPES_FICHE, completude, encouragement, type EtapeFiche } from "@/lib/completude";
import { MAX_DOMAINES_PAR_FICHE, optionsDomaines } from "@/lib/domaines";

type PersonneComplete = Personne & {
  formations: Formation[];
  experiences: Experience[];
  erasmus: (Erasmus & { universite: Etablissement })[];
};

const INTRODUCTIONS: Record<EtapeFiche, string> = {
  identite: "Commençons par l’essentiel. Vos coordonnées ne sont jamais publiques : vous choisissez celles que les membres connectés peuvent voir.",
  aujourdhui: "Ce que vous faites en ce moment : c’est la première chose que regardent les étudiants.",
  etudes: "Masters, écoles, doubles diplômes… Chaque formation s’ajoute à votre parcours, après la bi-licence.",
  experiences:
    "Stages, alternances, emplois, engagement associatif. Vos stages alimentent l’archive des stages, très consultée par les plus jeunes : missions, comment vous les avez obtenus, rapport…",
  erasmus: "Un semestre ou une année à l’étranger ? Votre retour aide celles et ceux qui hésitent à partir. Étape facultative.",
  carte: "Deux phrases pour vous présenter et un conseil : ce sont les mots que liront les étudiants.",
};

const LISTES: Partial<Record<EtapeFiche, { ajout: string; libelle: string }>> = {
  etudes: { ajout: "/espace/ma-fiche/formation", libelle: "Ajouter une formation" },
  experiences: { ajout: "/espace/ma-fiche/experience", libelle: "Ajouter une expérience" },
  erasmus: { ajout: "/espace/ma-fiche/erasmus", libelle: "Ajouter un Erasmus" },
};

export async function AssistantFiche({
  personne,
  etape,
  enregistre,
  carte,
  courts,
}: {
  personne: PersonneComplete;
  etape: EtapeFiche;
  /** Étape qui vient d'être enregistrée (message de confirmation). */
  enregistre: EtapeFiche | null;
  carte: CarteParcours;
  courts: Record<string, string>;
}) {
  const avancement = completude({ ...personne, nbFormations: personne.formations.length, nbExperiences: personne.experiences.length });
  const rang = ETAPES_FICHE.findIndex((e) => e.cle === etape);
  const courante = ETAPES_FICHE[rang];
  const precedente = ETAPES_FICHE[rang - 1];
  const suivante = ETAPES_FICHE[rang + 1];
  const liste = LISTES[etape];
  const nbListe = { etudes: personne.formations.length, experiences: personne.experiences.length, erasmus: personne.erasmus.length };
  const etapeFaite = (cle: EtapeFiche) =>
    !avancement.etapesIncompletes.has(cle) && (cle !== "erasmus" || personne.erasmus.length > 0);

  return (
    <div className="space-y-8">
      {/* Bandeau : avancement */}
      <div className="fond-bordeaux filigrane relative overflow-hidden rounded-abm-lg px-6 py-8 sm:px-10">
        <SceauFiligrane className="-right-20 -top-24 size-[320px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="apparait font-display text-4xl font-bold">Ma fiche</h1>
            <p className="apparait mt-2 max-w-[52ch] text-white/80" style={{ animationDelay: "80ms" }}>
              {encouragement(avancement.pourcentage)}
            </p>
          </div>
          <div className="apparait text-right" style={{ animationDelay: "160ms" }}>
            <p className="font-impact text-6xl leading-none">
              {avancement.pourcentage}
              <span className="text-3xl"> %</span>
            </p>
            <p className="mt-1 text-sm text-white/76">
              {avancement.minutesRestantes > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} aria-hidden /> encore {avancement.minutesRestantes} min environ
                </span>
              ) : (
                "fiche complète"
              )}
            </p>
          </div>
        </div>
        <div
          className="relative mt-6 h-2 overflow-hidden rounded-abm-pill bg-white/15"
          role="progressbar"
          aria-label="Avancement de votre fiche"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={avancement.pourcentage}
        >
          <div className="barre-progression h-full rounded-abm-pill bg-white" style={{ width: `${avancement.pourcentage}%` }} />
        </div>
      </div>

      {/* Les étapes */}
      <nav aria-label="Étapes de votre fiche" className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0">
        <ol className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-6">
          {ETAPES_FICHE.map((e, i) => {
            const active = e.cle === etape;
            const faite = etapeFaite(e.cle);
            return (
              <li key={e.cle}>
                <Link
                  href={`/espace/ma-fiche?etape=${e.cle}`}
                  aria-current={active ? "step" : undefined}
                  className={`group flex h-full items-center gap-3 rounded-abm-md border px-3 py-2.5 transition-colors duration-200 ${
                    active ? "border-bordeaux-700 bg-white shadow-abm-card" : "border-bordeaux-700/15 bg-white/60 hover:border-bordeaux-700/40 hover:bg-white"
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-abm-pill text-sm font-bold ${
                      active ? "bg-bordeaux-700 text-white" : faite ? "bg-bordeaux-100 text-bordeaux-700" : "border border-bordeaux-700/30 text-ink-soft"
                    }`}
                  >
                    {faite && !active ? <Check size={15} aria-label="complétée" /> : i + 1}
                  </span>
                  <span className="pr-1">
                    <span className={`block text-sm font-semibold ${active ? "text-bordeaux-700" : "text-ink"}`}>{e.titre}</span>
                    <span className="block text-xs text-ink-soft">{e.sousTitre}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Étape en cours */}
        <section aria-labelledby="titre-etape" className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-6 shadow-abm-card sm:p-8">
          <p className="eyebrow text-bordeaux-500">
            Étape {rang + 1} sur {ETAPES_FICHE.length}
          </p>
          <h2 id="titre-etape" className="mt-1 font-display text-3xl font-bold text-bordeaux-700">
            {courante.titre}
          </h2>
          <p className="mt-2 max-w-[62ch] text-sm text-ink-soft">{INTRODUCTIONS[etape]}</p>

          {enregistre && (
            <p role="status" className="apparait mt-5 inline-flex items-center gap-2 rounded-abm-sm bg-bordeaux-100 px-3 py-2 text-sm font-semibold text-bordeaux-700">
              <Check size={16} aria-hidden /> Étape « {ETAPES_FICHE.find((e) => e.cle === enregistre)?.titre} » enregistrée.
            </p>
          )}

          <div className="mt-8">
            {etape === "identite" && <EtapeIdentite personne={personne} />}
            {etape === "aujourdhui" && (
              <EtapeAujourdhui personne={personne} optionsDomaines={await optionsDomaines()} maxDomaines={MAX_DOMAINES_PAR_FICHE} />
            )}
            {etape === "carte" && <EtapeCarte personne={personne} />}

            {liste && (
              <div className="space-y-6">
                {etape === "etudes" && <ListeFormations personneId={personne.id} parametre="" elements={personne.formations} />}
                {etape === "experiences" && <ListeExperiences personneId={personne.id} parametre="" elements={personne.experiences} />}
                {etape === "erasmus" && <ListeErasmus personneId={personne.id} parametre="" elements={personne.erasmus} />}
                <div className="flex flex-wrap items-center gap-4 border-t border-bordeaux-700/10 pt-6">
                  <Link href={liste.ajout} className={buttonClasses("primary")}>
                    <Plus size={16} aria-hidden /> {liste.libelle}
                  </Link>
                  {suivante && (
                    <Link href={`/espace/ma-fiche?etape=${suivante.cle}`} className={`inline-flex items-center gap-1 text-sm font-semibold ${classeLien}`}>
                      {nbListe[etape as keyof typeof nbListe] > 0 ? "Continuer" : "Passer cette étape"} <ArrowRight size={15} aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {precedente && (
            <Link href={`/espace/ma-fiche?etape=${precedente.cle}`} className="mt-6 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-bordeaux-700">
              <ArrowLeft size={15} aria-hidden /> Étape précédente : {precedente.titre}
            </Link>
          )}
        </section>

        {/* Aperçu et éléments restants */}
        <aside className="space-y-6 lg:sticky lg:top-28">
          {avancement.restants.length > 0 && (
            <div className="rounded-abm-md border border-bordeaux-700/15 bg-white p-5">
              <p className="eyebrow text-bordeaux-500">Pour compléter votre fiche</p>
              <ul className="mt-3 space-y-2 text-sm">
                {avancement.restants.map((r) => (
                  <li key={r.libelle}>
                    <Link href={`/espace/ma-fiche?etape=${r.etape}`} className="group flex items-center justify-between gap-3 text-ink hover:text-bordeaux-700">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="size-1.5 rounded-abm-pill bg-bordeaux-300" />
                        {r.libelle}
                      </span>
                      <ArrowRight size={14} aria-hidden className="text-ink-soft transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="eyebrow text-bordeaux-500">Aperçu de votre carte</p>
            <p className="mb-4 mt-1 text-xs text-ink-soft">
              {personne.consentementPublic
                ? "Telle qu’elle apparaît sur la page publique « Que sont-ils devenus ? ». Mise à jour à chaque enregistrement."
                : "Elle n’apparaîtra sur la page publique que si vous l’acceptez (étape « Votre carte »). Mise à jour à chaque enregistrement."}
            </p>
            <ApercuCarte carte={carte} courts={courts} />
          </div>

          <Link href={`/espace/annuaire/${personne.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
            <Eye size={16} aria-hidden /> Voir ma fiche comme les autres membres
          </Link>
        </aside>
      </div>
    </div>
  );
}
