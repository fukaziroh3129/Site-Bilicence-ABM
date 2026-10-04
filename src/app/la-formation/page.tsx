import { ArrowRight, Building2, Globe2, GraduationCap, Layers, Mic, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Apparition, Compteur, ElementGroupe, Groupe, Ornement } from "@/components/anime";
import { OuvrirCursus } from "@/components/formation/carte-cursus";
import { StatsDevenir } from "@/components/statistiques/stats-devenir";
import { AFaire, ImageAFaire, PageHeader, classeLien } from "@/components/ui";
import { PARCOURSUP, RESPONSABLES, SOURCES } from "@/lib/formation";
import { site } from "@/lib/site";
import { statistiquesDevenir } from "@/lib/statistiques";

export const metadata: Metadata = {
  title: "La formation",
  description: `Présentation de la ${site.formation} de l’${site.universite} : cursus, matières, admission, grand oral et débouchés.`,
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

const atouts = [
  {
    icone: Layers,
    titre: "Deux licences en une",
    texte: "Les enseignements fondamentaux de la licence d’économie et de la licence de science politique, menés de front pendant trois ans.",
  },
  {
    icone: Building2,
    titre: "Deux facultés, un diplôme",
    texte: "Les cours ont lieu à la Faculté d’Économie (site Richter) et à la Faculté de Droit et de Science politique, qui délivrent un diplôme commun.",
  },
  {
    icone: Sparkles,
    titre: "Une formation rare",
    texte: "Une bi-licence présentée par l’université comme unique en France, ouverte depuis 2021, avec une promotion de trente étudiants.",
  },
];

export default async function LaFormation() {
  await connection(); // statistiques lues dans la base à chaque visite
  const stats = await statistiquesDevenir();
  const derniere = PARCOURSUP.sessions.at(-1)!;
  const maxVoeux = Math.max(...PARCOURSUP.sessions.map((s) => s.voeux));

  return (
    <>
      <PageHeader
        eyebrow="La formation"
        title="La bi-licence Économie / Science politique"
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

      {/* ─── Présentation générale ─── */}
      <section aria-labelledby="presentation" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Titre surtitre="Le cursus dans son ensemble" id="presentation">
              Une double compétence pour comprendre le monde contemporain
            </Titre>
            <Apparition delai={0.1} className="mt-6 max-w-[60ch] space-y-4 text-lg leading-relaxed">
              <p>
                La bi-licence forme, en six semestres, des étudiants capables d’analyser ensemble les enjeux économiques,
                politiques et institutionnels : comprendre une politique publique, lire des données, mettre en perspective un
                débat, éclairer une décision publique ou privée.
              </p>
              <p className="text-base text-ink-soft">
                Elle prépare aux masters sélectifs de chacune des deux disciplines ou aux masters qui les associent, comme le
                master Économie – Science politique «&nbsp;Gouvernance des sociétés et des territoires en transition&nbsp;» de
                l’université. Selon l’université, environ neuf étudiants sur dix poursuivent en master.
              </p>
            </Apparition>
          </div>
          <Apparition delai={0.15}>
            <ImageAFaire label="Photo à ajouter — la formation (promotion, campus ou cours)" ratio="4 / 3" />
          </Apparition>
        </div>

        <Groupe className="mt-16 grid gap-6 md:grid-cols-3">
          {atouts.map(({ icone: Icone, titre, texte }) => (
            <ElementGroupe key={titre} className="border-t-2 border-bordeaux-700 pt-5">
              <Icone size={26} strokeWidth={1.5} aria-hidden className="text-bordeaux-700" />
              <h3 className="mt-3 font-display text-xl font-bold text-bordeaux-700">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{texte}</p>
            </ElementGroupe>
          ))}
        </Groupe>
      </section>

      {/* ─── Les matières : carte du cursus en fenêtre ─── */}
      <section aria-labelledby="matieres" className="border-y border-bordeaux-700/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <Titre surtitre="Les matières" id="matieres">
            Économie et science politique, à parts presque égales
          </Titre>
          <Apparition delai={0.1}>
            <p className="mt-4 max-w-[62ch] text-ink-soft">
              Chaque année, les cours se partagent entre les deux disciplines, avec un socle commun (anglais, informatique,
              préparation au grand oral). Ouvrez la carte pour voir toutes les matières, année par année.
            </p>
          </Apparition>
          <Apparition delai={0.15} className="mt-10">
            <OuvrirCursus />
          </Apparition>
          <p className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
            <Globe2 size={18} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
            <span>
              Dès la deuxième année, il est possible de partir étudier à l’étranger dans l’une des universités partenaires de
              la Faculté d’Économie.{" "}
              <Link href="/erasmus" className={classeLien}>
                Voir où sont partis les étudiants
              </Link>
              .
            </span>
          </p>
        </div>
      </section>

      {/* ─── Le grand oral ─── */}
      <section aria-labelledby="grand-oral" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <Apparition>
          <div className="fond-bordeaux filigrane cadre-fin relative grid gap-8 overflow-hidden rounded-abm-lg p-8 sm:p-12 lg:grid-cols-[auto_1fr]">
            <span className="flex size-20 items-center justify-center rounded-full border border-white/35">
              <Mic size={34} strokeWidth={1.3} aria-hidden />
            </span>
            <div>
              <p className="eyebrow text-white/70">Fin de troisième année</p>
              <h2 id="grand-oral" className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                Le grand oral pluridisciplinaire
              </h2>
              <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-white/85">
                Pour obtenir le diplôme, chaque étudiant passe un grand oral qui mobilise à la fois l’économie et la science
                politique pour analyser une question contemporaine. L’épreuve évalue la synthèse, l’argumentation, la mise en
                perspective entre les deux disciplines et l’aisance à l’oral. Elle se prépare pendant les deux semestres de
                troisième année.
              </p>
              <p className="mt-6 inline-block rounded-abm-sm border border-dashed border-white/45 px-4 py-2 text-sm text-white/80">
                <span className="font-semibold text-white">À compléter — </span>
                modalités précises (durée, jury, sujets), présentation provisoire pour la version de démonstration.
              </p>
            </div>
          </div>
        </Apparition>
      </section>

      {/* ─── Admission ─── */}
      <section aria-labelledby="admission" className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
        <Titre surtitre="Admission" id="admission">
          Une formation très demandée
        </Titre>

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
          </Apparition>

          <Apparition delai={0.1} className="space-y-6">
            <div className="rounded-abm-md border border-bordeaux-700/15 bg-white p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold text-bordeaux-700">Comment candidater</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed">
                <li>
                  <b>En première année</b>&nbsp;: sur Parcoursup, de janvier à mars&nbsp;; les réponses arrivent de juin à
                  juillet.
                </li>
                <li>
                  <b>En deuxième ou troisième année</b>&nbsp;: par équivalence, sur la plateforme eCandidat de l’université.
                </li>
                <li>
                  <b>Ce qui est examiné</b>&nbsp;: les notes de première et de terminale, les épreuves du baccalauréat, la
                  fiche Avenir et la cohérence du projet.
                </li>
              </ul>
              <h3 className="mt-6 font-display text-xl font-bold text-bordeaux-700">Ce qui est attendu</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed marker:text-bordeaux-400">
                <li>un vif intérêt pour les questions économiques, politiques et sociales&nbsp;;</li>
                <li>une vraie aisance à l’écrit et à l’oral&nbsp;;</li>
                <li>de solides bases en mathématiques et en statistiques&nbsp;;</li>
                <li>la capacité d’analyser des documents et de travailler en autonomie.</li>
              </ul>
              <a href={PARCOURSUP.fiche} target="_blank" rel="noopener noreferrer" className={`mt-6 inline-flex items-center gap-1 text-sm font-semibold ${classeLien}`}>
                Fiche de la formation sur Parcoursup <ArrowRight size={14} aria-hidden />
              </a>
            </div>
            <p className="text-xs text-ink-soft">
              Session {derniere.annee}&nbsp;: {nombre(derniere.voeux)} vœux, {derniere.propositions} propositions d’admission,{" "}
              {derniere.admis} admis. Parmi les néo-bacheliers admis&nbsp;: {PARCOURSUP.profil2025.boursiers}&nbsp;% de
              boursiers, {PARCOURSUP.profil2025.memeAcademie}&nbsp;% venant de l’académie de Montpellier. Source&nbsp;: données
              ouvertes Parcoursup.
            </p>
          </Apparition>
        </div>
      </section>

      {/* ─── Les responsables ─── */}
      <section aria-labelledby="responsables" className="border-t border-bordeaux-700/10">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <Titre surtitre="L’équipe pédagogique" id="responsables">
            Les responsables de la formation
          </Titre>
          <Groupe className="mt-10 grid gap-8 sm:grid-cols-2">
            {RESPONSABLES.map((r) => (
              <ElementGroupe key={r.nom} className="grid grid-cols-[120px_1fr] items-start gap-5 sm:grid-cols-[150px_1fr]">
                <ImageAFaire label={`Photo à ajouter — ${r.nom}`} />
                <div>
                  <p className="font-display text-2xl font-bold text-bordeaux-700">{r.nom}</p>
                  <p className="eyebrow mt-1 text-ink-soft">{r.fonction}</p>
                  <div className="mt-4">
                    <AFaire>courte présentation (discipline, fonction à l’université), à faire valider par l’intéressé.</AFaire>
                  </div>
                </div>
              </ElementGroupe>
            ))}
          </Groupe>
        </div>
      </section>

      {/* ─── Et après ? ─── */}
      <section aria-labelledby="apres" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <Titre surtitre="Et après ?" id="apres">
          Que deviennent les diplômés&nbsp;?
        </Titre>
        <Apparition delai={0.1}>
          <p className="mt-4 max-w-[62ch] text-ink-soft">
            Calculé à partir des fiches des anciens de l’association, toujours à jour. Cliquez sur une ligne pour découvrir
            les parcours correspondants.
          </p>
        </Apparition>
        <div className="mt-10">
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
      </section>

      <Ornement className="pb-10" />

      <footer className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <p className="text-xs font-semibold text-ink-soft">Sources</p>
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
