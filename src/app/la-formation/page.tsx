import { ArrowRight, BookOpen, Building2, Download, ExternalLink, Globe2, GraduationCap, Layers, Mail, Mic, Microscope, Phone, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Apparition, Compteur, ElementGroupe, Groupe, Ornement } from "@/components/anime";
import { OuvrirCursus } from "@/components/formation/carte-cursus";
import { StatsDevenir } from "@/components/statistiques/stats-devenir";
import { ImageAFaire, PageHeader, classeLien } from "@/components/ui";
import { PARCOURSUP, RESPONSABLES, SOURCES } from "@/lib/formation";
import { CONTACTS_ADMINISTRATIFS, DOCUMENTS, PLAQUETTE } from "@/lib/plaquette";
import { site } from "@/lib/site";
import { statistiquesDevenir } from "@/lib/statistiques";

export const metadata: Metadata = {
  title: "La formation",
  description: `Présentation de la ${site.formation} de l’${site.universite} : présentation, admission, programme, organisation, débouchés et contacts.`,
};

const nombre = (n: number) => n.toLocaleString("fr-FR");

/** Titre de section de la page (registre institutionnel). */
function Titre({ surtitre, children, id }: { surtitre: string; children: React.ReactNode; id: string }) {
  return (
    <Apparition>
      <p className="eyebrow text-bordeaux-600">{surtitre}</p>
      <h2 id={id} className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight text-bordeaux-700 sm:text-4xl">
        {children}
      </h2>
    </Apparition>
  );
}

/** Liste à puces de la charte (marqueurs bordeaux). */
function Puces({ liste, className = "" }: { liste: string[]; className?: string }) {
  return (
    <ul className={`list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-bordeaux-400 ${className}`}>
      {liste.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/** Lien vers un site de l'université : nouvel onglet, avec l'indication pour les lecteurs d'écran. */
function LienUM({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${classeLien} ${className}`}>
      {children}
      <span className="sr-only"> (nouvel onglet)</span>
    </a>
  );
}

const sommaire = [
  { id: "presentation", libelle: "Présentation" },
  { id: "admission", libelle: "Admission" },
  { id: "programme", libelle: "Programme" },
  { id: "organisation", libelle: "Organisation" },
  { id: "apres", libelle: "Et après ?" },
  { id: "contacts", libelle: "Contacts" },
  { id: "documents", libelle: "Documents officiels" },
];

const atouts = [Layers, Sparkles, Building2];

export default async function LaFormation() {
  await connection(); // statistiques lues dans la base à chaque visite
  const stats = await statistiquesDevenir();
  const derniere = PARCOURSUP.sessions.at(-1)!;
  const maxVoeux = Math.max(...PARCOURSUP.sessions.map((s) => s.voeux));

  return (
    <>
      <PageHeader
        eyebrow="La formation"
        title="Bi-licence Économie et Science politique"
        lead={`Un double cursus sélectif de l’${site.universite}, qui associe en trois ans les fondamentaux de l’économie et de la science politique.`}
        aside={
          <dl className="grid grid-cols-3 gap-6 border-l border-white/30 pl-6 lg:grid-cols-1 lg:gap-4">
            {[
              { valeur: "30", libelle: "places par an" },
              { valeur: "180", libelle: "crédits ECTS" },
              { valeur: "3", libelle: "ans · bac +3" },
            ].map((c) => (
              <div key={c.libelle} className="flex flex-col-reverse">
                <dt className="text-sm text-white/76">{c.libelle}</dt>
                <dd className="font-impact text-5xl leading-none">{c.valeur}</dd>
              </div>
            ))}
          </dl>
        }
      />

      {/* ─── Sommaire de la page ─── */}
      <nav aria-label="Sur cette page" className="border-b border-bordeaux-700/10 bg-white">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 sm:px-8">
          {sommaire.map((s) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="inline-flex items-center rounded-abm-pill px-3.5 py-2 text-sm font-semibold text-bordeaux-700 transition-colors hover:bg-bordeaux-100/60">
                {s.libelle}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ─── Présentation (plaquette) ─── */}
      <section aria-labelledby="presentation" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Titre surtitre="Présentation de la formation" id="presentation">
              Une formation résolument pluridisciplinaire
            </Titre>
            <Apparition delai={0.1} className="mt-6 max-w-[62ch] space-y-4 leading-relaxed">
              {PLAQUETTE.presentation.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </Apparition>
            <Apparition delai={0.15}>
              <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-bordeaux-700">
                <GraduationCap size={20} strokeWidth={1.5} aria-hidden />
                Diplôme national de licence, contrôlé par l’État
              </p>
            </Apparition>
          </div>

          {/* Les deux facultés : un diplôme commun */}
          <Apparition delai={0.15} className="grid content-start gap-5 self-start sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                src: "/images/faculte-economie.webp",
                hauteur: 1101,
                legende: "Faculté d’Économie · site Richter",
                alt: "Des étudiants discutent dans la cour de la Faculté d’Économie, vue d’en haut, devant l’entrée vitrée et de grandes fresques colorées.",
              },
              {
                src: "/images/faculte-droit-science-politique.webp",
                hauteur: 1280,
                legende: "Faculté de Droit et de Science politique",
                alt: "Le cloître de la Faculté de Droit et de Science politique : galerie à arcades, clocheton, oliviers et fontaine sous un ciel bleu, avec des étudiants au fond.",
              },
            ].map((p) => (
              <figure key={p.src} className="overflow-hidden rounded-abm-md bg-white shadow-abm-card">
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={1920}
                  height={p.hauteur}
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 45vw, 100vw"
                  className="aspect-[16/10] w-full object-cover"
                />
                <figcaption className="eyebrow px-4 py-3 text-bordeaux-700">{p.legende}</figcaption>
              </figure>
            ))}
          </Apparition>
        </div>

        <Groupe className="mt-16 grid gap-6 md:grid-cols-3">
          {PLAQUETTE.atouts.map((texte, i) => {
            const Icone = atouts[i];
            return (
              <ElementGroupe key={texte} className="border-t-2 border-bordeaux-700 pt-5">
                <Icone size={26} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
                <h3 className="mt-3 font-display text-xl font-bold text-bordeaux-700">{texte}</h3>
              </ElementGroupe>
            );
          })}
        </Groupe>

        {/* Objectifs, savoir-faire, compétences (fiche de l'université) */}
        <div className="mt-20 grid gap-10 lg:grid-cols-3">
          {[
            { titre: "Objectifs", liste: PLAQUETTE.objectifs },
            { titre: "Savoir-faire", liste: PLAQUETTE.savoirFaire },
            { titre: "Compétences", liste: PLAQUETTE.competences },
          ].map((b, i) => (
            <Apparition key={b.titre} delai={i * 0.08}>
              <h3 className="border-b border-bordeaux-700/25 pb-3 font-display text-2xl font-bold text-bordeaux-700">{b.titre}</h3>
              <Puces liste={b.liste} className="mt-4" />
            </Apparition>
          ))}
        </div>
      </section>

      {/* ─── Admission : conditions de la plaquette + chiffres Parcoursup ─── */}
      <section aria-labelledby="admission" className="border-y border-bordeaux-700/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <Titre surtitre="Admission" id="admission">
            Prérequis et conditions d’accès
          </Titre>
          <Apparition delai={0.1}>
            <p className="mt-4 max-w-[62ch] text-ink-soft">
              Les vœux d’admission en première année sont examinés par une commission d’examen. La formation est très demandée&nbsp;:{" "}
              {nombre(derniere.voeux)} candidatures en {derniere.annee} pour {derniere.places} places.
            </p>
          </Apparition>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <Apparition className="space-y-8">
              <dl className="grid grid-cols-2 gap-6">
                {[
                  { valeur: derniere.voeux, libelle: `candidatures en ${derniere.annee}` },
                  { valeur: derniere.places, libelle: "places" },
                  { valeur: derniere.tauxAcces ?? 0, libelle: "taux d’accès", suffixe: " %" },
                  { valeur: PARCOURSUP.profil2025.mentionTresBien, libelle: "des admis avec mention très bien", suffixe: " %" },
                ].map((c) => (
                  <div key={c.libelle} className="flex flex-col-reverse border-t border-bordeaux-700/20 pt-3">
                    <dt className="mt-1 text-sm text-ink-soft">{c.libelle}</dt>
                    <dd className="font-impact text-5xl leading-none text-bordeaux-700">
                      <Compteur valeur={c.valeur} />
                      {c.suffixe && <span className="text-3xl">&nbsp;{c.suffixe.trim()}</span>}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Évolution des candidatures depuis l'ouverture */}
              <figure>
                <figcaption className="text-sm font-semibold text-ink">Candidatures sur Parcoursup depuis l’ouverture</figcaption>
                <ol className="mt-4 flex h-44 items-end gap-3" aria-label="Nombre de candidatures par année">
                  {PARCOURSUP.sessions.map((s) => (
                    <li key={s.annee} className="flex h-full flex-1 flex-col justify-end text-center">
                      <span className="text-xs font-semibold text-bordeaux-700">{nombre(s.voeux)}</span>
                      <span
                        aria-hidden
                        className="mt-1 block rounded-t-abm-sm bg-[image:var(--degrade-bouton)]"
                        style={{ height: `${(s.voeux / maxVoeux) * 100}%` }}
                      />
                      <span className="mt-2 text-xs text-ink-soft">{s.annee}</span>
                      <span className="sr-only">
                        {nombre(s.voeux)} candidatures{s.tauxAcces ? `, taux d’accès ${s.tauxAcces} %` : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              </figure>
              <p className="text-xs text-ink-soft">
                Session {derniere.annee}&nbsp;: {nombre(derniere.voeux)} vœux, {derniere.propositions} propositions d’admission,{" "}
                {derniere.admis} admis. Parmi les néo-bacheliers admis&nbsp;: {PARCOURSUP.profil2025.boursiers}&nbsp;% de boursiers,{" "}
                {PARCOURSUP.profil2025.memeAcademie}&nbsp;% venant de l’académie de Montpellier. Source&nbsp;: données ouvertes
                Parcoursup.
              </p>
            </Apparition>

            <Apparition delai={0.1} className="space-y-6">
              <div className="rounded-abm-md border border-bordeaux-700/15 bg-white p-6 shadow-abm-card sm:p-8">
                <h3 className="font-display text-xl font-bold text-bordeaux-700">Ce qui est attendu</h3>
                <Puces liste={PLAQUETTE.attendus} className="mt-3" />

                <h3 className="mt-8 font-display text-xl font-bold text-bordeaux-700">Ce que la commission examine</h3>
                <Puces liste={PLAQUETTE.examens} className="mt-3" />

                <h3 className="mt-8 font-display text-xl font-bold text-bordeaux-700">Comment candidater</h3>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                  <li>
                    <b>En première année</b>&nbsp;: sur Parcoursup, de janvier à mars&nbsp;; les propositions d’admission et les
                    réponses se font au fil de l’eau, entre juin et juillet.
                  </li>
                  <li>
                    <b>En deuxième ou troisième année</b>&nbsp;: la procédure eCandidat est obligatoire (accès par équivalence).
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                  <a href={PARCOURSUP.fiche} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${classeLien}`}>
                    Fiche de la formation sur Parcoursup <ArrowRight size={14} aria-hidden />
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                  <a href={DOCUMENTS.candidatures.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${classeLien}`}>
                    Candidatures et admissions (Faculté d’Économie) <ArrowRight size={14} aria-hidden />
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </div>
              </div>
            </Apparition>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <Apparition>
              <h3 className="font-display text-xl font-bold text-bordeaux-700">À qui s’adresse la bi-licence</h3>
              <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">{PLAQUETTE.publicCible}</p>
            </Apparition>
            <Apparition delai={0.08}>
              <h3 className="font-display text-xl font-bold text-bordeaux-700">Droits de scolarité</h3>
              <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">{PLAQUETTE.droits}</p>
            </Apparition>
          </div>
        </div>
      </section>

      {/* ─── Programme : la maquette de la plaquette ─── */}
      <section aria-labelledby="programme" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <Titre surtitre="Programme" id="programme">
          Les matières, année par année
        </Titre>
        <Apparition delai={0.1}>
          <p className="mt-4 max-w-[62ch] text-ink-soft">
            Chaque année, les cours se partagent entre les deux disciplines, avec un socle commun (anglais, informatique,
            préparation au grand oral). Ouvrez la carte pour voir toutes les matières, année par année, avec leurs crédits et
            leurs heures. Les responsables des bi-licences 1, 2 et 3 sont Thomas Cortade et Éric Savarese.
          </p>
        </Apparition>

        <div className="mt-10">
          <OuvrirCursus />
        </div>

        <Groupe as="div" className="mt-14 grid gap-8 md:grid-cols-2">
          <ElementGroupe as="div" className="border-t-2 border-bordeaux-700 pt-5">
            <h3 className="font-display text-xl font-bold text-bordeaux-700">Options facultatives</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{PLAQUETTE.optionsFacultatives}</p>
          </ElementGroupe>
          <ElementGroupe as="div" className="border-t-2 border-bordeaux-700 pt-5">
            <h3 className="font-display text-xl font-bold text-bordeaux-700">Stage facultatif</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{PLAQUETTE.stageFacultatif}</p>
          </ElementGroupe>
        </Groupe>

        <p className="mt-10 flex items-start gap-2 text-sm text-ink-soft">
          <Globe2 size={18} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
          <span>
            {PLAQUETTE.international}{" "}
            <Link href="/erasmus" className={classeLien}>
              Voir où sont partis les étudiants
            </Link>
            .
          </span>
        </p>
      </section>

      {/* ─── Organisation : grand oral, contrôle des connaissances, aménagements, stage ─── */}
      <section aria-labelledby="organisation" className="border-t border-bordeaux-700/10">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <Titre surtitre="Organisation" id="organisation">
            Évaluations, grand oral et stage
          </Titre>

          <Apparition className="mt-10">
            <div className="fond-bordeaux filigrane cadre-fin relative grid gap-8 overflow-hidden rounded-abm-lg p-8 sm:p-12 lg:grid-cols-[auto_1fr]">
              <span className="flex size-20 items-center justify-center rounded-full border border-white/35">
                <Mic size={34} strokeWidth={1.3} aria-hidden />
              </span>
              <div>
                <p className="eyebrow text-white/70">Fin de troisième année</p>
                <h3 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Le grand oral bi-disciplinaire</h3>
                <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-white/85">{PLAQUETTE.grandOral}</p>
                <p className="mt-6 text-sm text-white/80">
                  Elle se prépare pendant les deux semestres de troisième année. Les modalités détaillées de l’épreuve (durée,
                  jury, calendrier) sont communiquées aux étudiants par la faculté.
                </p>
              </div>
            </div>
          </Apparition>

          <Groupe as="div" className="mt-12 grid gap-10 lg:grid-cols-3">
            <ElementGroupe as="div" className="border-t-2 border-bordeaux-700 pt-5">
              <h3 className="font-display text-xl font-bold text-bordeaux-700">Contrôle des connaissances</h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
                {PLAQUETTE.controle.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            </ElementGroupe>
            <ElementGroupe as="div" className="border-t-2 border-bordeaux-700 pt-5">
              <h3 className="font-display text-xl font-bold text-bordeaux-700">Stage</h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
                {PLAQUETTE.stage.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
                <p>
                  <LienUM href={DOCUMENTS.stages.url}>Partir en stage (Faculté d’Économie)</LienUM>
                </p>
              </div>
            </ElementGroupe>
            <ElementGroupe as="div" className="border-t-2 border-bordeaux-700 pt-5">
              <h3 className="font-display text-xl font-bold text-bordeaux-700">Aménagements particuliers</h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
                <p>{PLAQUETTE.amenagements}</p>
                <p>
                  <LienUM href={DOCUMENTS.scolarite.url}>Scolarité (Faculté d’Économie)</LienUM>
                </p>
              </div>
            </ElementGroupe>
          </Groupe>
        </div>
      </section>

      {/* ─── Et après ? ─── */}
      <section aria-labelledby="apres" className="border-y border-bordeaux-700/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <Titre surtitre="Et après ?" id="apres">
            Poursuite d’études et débouchés
          </Titre>
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            <Apparition delai={0.1} className="space-y-8">
              <div className="max-w-[62ch] space-y-4">
                <p className="text-lg leading-relaxed">{PLAQUETTE.poursuite}</p>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Elle prépare notamment au master bi-disciplinaire Économie – Science politique «&nbsp;Gouvernance des Sociétés et
                  des Territoires en Transition&nbsp;» (GSTT) de l’université.
                </p>
              </div>
              <p className="border-t border-bordeaux-700/20 pt-4">
                <span className="block font-impact text-6xl leading-none text-bordeaux-700">
                  <Compteur valeur={90} />
                  <span className="text-4xl">&nbsp;%</span>
                </span>
                <span className="mt-1 block max-w-[34ch] text-sm text-ink-soft">
                  des étudiants poursuivent leurs études après la licence, essentiellement en master
                </span>
              </p>
            </Apparition>
            <Apparition delai={0.15}>
              <figure className="overflow-hidden rounded-abm-md bg-white shadow-abm-card">
                <Image
                  src="/images/remise-des-diplomes.webp"
                  alt="Des diplômés en écharpe dorée lancent leur toque en l’air sur la scène d’un amphithéâtre, devant un écran annonçant la cérémonie de remise des diplômes de la Faculté d’Économie."
                  width={1920}
                  height={1280}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="aspect-[3/2] w-full object-cover"
                />
                <figcaption className="px-4 py-3 text-xs text-ink-soft">
                  Cérémonie de remise des diplômes de la Faculté d’Économie, promotions 2020 et 2021.
                </figcaption>
              </figure>
            </Apparition>
          </div>

          <Apparition delai={0.1}>
            <p className="mt-14 max-w-[62ch] text-ink-soft">
              Du côté des anciens&nbsp;: les chiffres ci-dessous sont calculés à partir des fiches des anciens de l’association,
              toujours à jour. Cliquez sur une ligne pour découvrir les parcours correspondants.
            </p>
          </Apparition>
          <div className="mt-8">
            <StatsDevenir stats={stats} mode="lien" />
          </div>
          <Apparition>
            <Link href="/promotions" className="group mt-12 flex items-center justify-between gap-4 border-t-2 border-bordeaux-700 py-6">
              <span className="flex items-center gap-3 font-display text-2xl font-bold text-bordeaux-700">
                <GraduationCap size={26} strokeWidth={1.5} aria-hidden />
                Tous les parcours des anciens
              </span>
              <ArrowRight size={22} className="fleche shrink-0 text-bordeaux-700" aria-hidden />
            </Link>
          </Apparition>
        </div>
      </section>

      {/* ─── Contacts : responsables et scolarités ─── */}
      <section aria-labelledby="contacts" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <Titre surtitre="L’équipe pédagogique" id="contacts">
          Responsables et contacts
        </Titre>
        <Groupe className="mt-10 grid gap-8 sm:grid-cols-2">
          {RESPONSABLES.map((r) => (
            <ElementGroupe key={r.nom} className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
              <ImageAFaire label={`Photo à ajouter — ${r.nom}`} />
              <div>
                <p className="font-display text-2xl font-bold text-bordeaux-700">{r.nom}</p>
                <p className="eyebrow mt-1 text-ink-soft">{r.fonction}</p>
                <ul className="mt-4 space-y-2 text-sm font-semibold leading-snug">
                  <li className="flex gap-2">
                    <BookOpen size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
                    <span>Enseignant · {r.enseignant}</span>
                  </li>
                  <li className="flex gap-2">
                    <Microscope size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
                    <span>Chercheur · {r.chercheur}</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">{r.presentation}</p>
                <a href={`mailto:${r.email}`} className={`mt-4 inline-flex items-center gap-2 break-all text-sm font-semibold ${classeLien}`}>
                  <Mail size={16} strokeWidth={1.5} aria-hidden />
                  {r.email}
                </a>
              </div>
            </ElementGroupe>
          ))}
        </Groupe>

        <Apparition className="mt-14 grid gap-8 border-t border-bordeaux-700/20 pt-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-bold text-bordeaux-700">Contacts administratifs</h3>
            <p className="mt-2 text-sm text-ink-soft">Pour les inscriptions, la scolarité et les questions pratiques.</p>
          </div>
          {CONTACTS_ADMINISTRATIFS.map((c) => (
            <div key={c.email} className="text-sm">
              <p className="font-semibold">{c.nom}</p>
              <p className="mt-2 flex items-center gap-2">
                <Mail size={16} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
                <a href={`mailto:${c.email}`} className={`break-all ${classeLien}`}>
                  {c.email}
                </a>
              </p>
              {c.telephone && (
                <p className="mt-1 flex items-center gap-2">
                  <Phone size={16} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
                  <a href={`tel:${c.telephone.replaceAll(" ", "")}`} className={classeLien}>
                    {c.telephone}
                  </a>
                </p>
              )}
            </div>
          ))}
        </Apparition>
        <p className="mt-8 text-sm text-ink-soft">
          Lieux&nbsp;: Faculté d’Économie (site Richter) et Faculté de Droit et de Science politique, à Montpellier.
        </p>
      </section>

      {/* ─── Documents officiels (fin de page) ─── */}
      <section aria-labelledby="documents" className="fond-bordeaux filigrane relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <Apparition>
            <p className="eyebrow text-white/70">Pour aller plus loin</p>
            <h2 id="documents" className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl">
              Les documents officiels de l’université
            </h2>
            <p className="mt-4 max-w-[62ch] text-white/80">
              Cette page reprend la plaquette de la bi-licence et la fiche de la formation, rédigées par les services de la
              faculté, avec la mise en forme de l’association. Seuls les documents de l’université font foi.
            </p>
          </Apparition>

          <Groupe as="div" className="mt-10 grid gap-6 md:grid-cols-2">
            {[DOCUMENTS.plaquette, DOCUMENTS.fiche].map((d) => (
              <ElementGroupe key={d.url} as="div">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start gap-4 border border-white/30 p-6 transition-colors hover:border-white hover:bg-white/10"
                >
                  <Download size={28} strokeWidth={1.4} aria-hidden className="mt-1 shrink-0" />
                  <span>
                    <span className="block font-display text-2xl font-bold">
                      Télécharger {d.titre.toLowerCase()}
                      <span className="sr-only"> (nouvel onglet)</span>
                    </span>
                    <span className="mt-2 block text-sm text-white/76">{d.detail}</span>
                  </span>
                </a>
              </ElementGroupe>
            ))}
          </Groupe>

          <Apparition delai={0.1} className="mt-8">
            <a
              href={DOCUMENTS.pageUM.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-4 border-t-2 border-white/70 py-6"
            >
              <span className="font-display text-2xl font-bold">
                {DOCUMENTS.pageUM.titre}
                <span className="sr-only"> (nouvel onglet)</span>
              </span>
              <ExternalLink size={22} strokeWidth={1.5} aria-hidden className="shrink-0" />
            </a>
            <ul className="flex flex-wrap gap-x-8 gap-y-2 border-t border-white/25 pt-5 text-sm font-semibold">
              {[DOCUMENTS.facEco, DOCUMENTS.facDroit, DOCUMENTS.international].map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-white/80">
                    {l.titre} <ExternalLink size={14} aria-hidden />
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Apparition>
        </div>
      </section>

      <Ornement className="pb-10 pt-10" />

      <footer className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <p className="text-xs font-semibold text-ink-soft">Sources</p>
        <p className="mt-1 text-xs text-ink-soft">
          Informations non contractuelles, d’après les documents de l’université (fiche mise à jour le 19 février 2026).
        </p>
        <ul className="mt-2 space-y-1 text-xs text-ink-soft">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-bordeaux-700">
                {s.libelle}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </>
  );
}
