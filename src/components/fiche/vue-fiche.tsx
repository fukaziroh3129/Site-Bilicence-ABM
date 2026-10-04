// Affichage d'une fiche complète dans l'annuaire (membres connectés uniquement).
// En-tête façon carte publique (bande bordeaux + médaillon d'initiales), puis deux colonnes :
// parcours et expériences à gauche, encadré « Contacter » collant à droite.

import { MapPin, Mail, Phone, SquareUser } from "lucide-react";
import { SceauFiligrane } from "@/components/anime";
import { DetailExperience, partages } from "@/components/fiche/detail-experience";
import { Initiales, Panneau, Pastille, TitreSection, Vide, classeLien } from "@/components/ui";
import type { Erasmus, Experience, Formation, Personne, Etablissement } from "@/generated/prisma/client";
import { dictionnaireDomaines } from "@/lib/domaines";
import {
  LIBELLES_NIVEAU,
  LIBELLES_STATUT_ACTUEL,
  LIBELLES_TYPE_EXPERIENCE,
  anneesFormation,
  dateCourte,
  formationEnCours,
  libellePromo,
  periode,
} from "@/lib/format";
import { LIBELLES_DUREE_ERASMUS, nomPays } from "@/lib/pays";

type PersonneComplete = Personne & {
  formations: Formation[];
  experiences: Experience[];
  erasmus?: (Erasmus & { universite: Etablissement })[];
};

const classePoint =
  "relative pb-6 last:pb-0 before:absolute before:-left-[37px] before:top-1.5 before:size-3.5 before:rounded-full before:border-2 before:shadow-[0_0_0_4px_var(--abm-paper)]";

export async function VueFiche({
  personne,
  voitTout = false,
  niveauTitre = "h1",
}: {
  personne: PersonneComplete;
  voitTout?: boolean;
  /** « h2 » quand la page a déjà son propre titre (fiche consultée depuis l'administration). */
  niveauTitre?: "h1" | "h2";
}) {
  const domaines = await dictionnaireDomaines();
  const Titre = niveauTitre;
  const contacts = [
    personne.afficherEmail &&
      personne.emailContact && { icone: Mail, libelle: personne.emailContact, lien: `mailto:${personne.emailContact}`, principal: true },
    personne.afficherTelephone &&
      personne.telephone && { icone: Phone, libelle: personne.telephone, lien: `tel:${personne.telephone.replace(/\s/g, "")}`, principal: false },
    personne.afficherLinkedin && personne.linkedin && { icone: SquareUser, libelle: "Profil LinkedIn", lien: personne.linkedin, principal: false },
  ].filter((c) => !!c);

  const situation = [personne.situationActuelle, personne.structureActuelle].filter(Boolean).join(", ");
  const erasmus = personne.erasmus ?? [];

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-abm-lg border border-bordeaux-700/15 bg-white shadow-abm-card">
        <div className="fond-bordeaux filigrane relative h-[52px] overflow-hidden">
          <SceauFiligrane className="-right-8 -top-16 size-[180px]" />
        </div>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 px-5 pb-6 sm:px-7">
          <Initiales prenom={personne.prenom} nom={personne.nom} taille="grand" className="-mt-9" />
          <div className="min-w-0 flex-[1_1_260px] pt-3">
            <p className="flex flex-wrap items-center gap-2.5">
              <span className="eyebrow text-bordeaux-500">Promotion {libellePromo(personne.promoEntree)}</span>
              {personne.statutActuel && <Pastille accent>{LIBELLES_STATUT_ACTUEL[personne.statutActuel]}</Pastille>}
            </p>
            <Titre className="mt-1.5 font-display text-3xl font-bold leading-tight text-bordeaux-700 sm:text-4xl">
              {personne.prenom} {personne.nom}
            </Titre>
            {situation && <p className="mt-1 text-lg text-ink">{situation}</p>}
            {(personne.ville || personne.secteurs.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {personne.ville && (
                  <span className="mr-1 inline-flex items-center gap-1 text-sm text-ink-soft">
                    <MapPin size={14} aria-hidden /> {personne.ville}
                  </span>
                )}
                {personne.secteurs.map((s) => (
                  <Pastille key={s}>{domaines.libelle(s)}</Pastille>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-10">
          {personne.presentation && (
            <p className="max-w-[62ch] font-display text-lg italic leading-relaxed text-ink-soft">« {personne.presentation} »</p>
          )}

          {personne.conseil && (
            <section className="space-y-4">
              <TitreSection>Son conseil aux étudiants</TitreSection>
              <blockquote className="relative rounded-abm-md bg-beige-papier py-4 pl-14 pr-5 font-display text-lg italic leading-relaxed text-bordeaux-700">
                <span aria-hidden className="absolute left-4 top-0 font-display text-6xl not-italic leading-none text-bordeaux-300">
                  “
                </span>
                {personne.conseil}
              </blockquote>
            </section>
          )}

          <section className="space-y-5">
            <TitreSection>Parcours</TitreSection>
            <ol className="ml-2 border-l-2 border-bordeaux-200 pl-7">
              {personne.formations.map((f) => {
                const enCours = formationEnCours(f);
                return (
                  <li
                    key={f.id}
                    className={`${classePoint} ${enCours ? "before:border-bordeaux-700 before:bg-bordeaux-700" : "before:border-bordeaux-400 before:bg-white"}`}
                  >
                    <p className="font-semibold">
                      {f.intitule}
                      {enCours && <span className="ml-2 text-sm font-semibold text-bordeaux-600">en cours</span>}
                    </p>
                    <p className="text-sm text-ink-soft">{[f.parcours, f.etablissement, anneesFormation(f)].filter(Boolean).join(" · ")}</p>
                  </li>
                );
              })}
              <li className={`${classePoint} before:rounded-[3px] before:border-bordeaux-400 before:bg-bordeaux-100`}>
                <p className="font-semibold">Bi-licence Économie – Science politique</p>
                <p className="text-sm text-ink-soft">Université de Montpellier · {libellePromo(personne.promoEntree)}</p>
              </li>
            </ol>
          </section>

          <section className="space-y-5">
            <TitreSection>Expériences</TitreSection>
            {erasmus.length === 0 && personne.experiences.length === 0 ? (
              <Vide>Aucune expérience renseignée.</Vide>
            ) : (
              <ul className="space-y-4">
                {erasmus.map((e) => (
                  <li key={e.id} id={e.id} className="fond-bordeaux scroll-mt-28 rounded-abm-lg p-5 shadow-abm-card sm:p-6">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <span className="inline-block rounded-abm-pill border border-white/50 px-2.5 py-0.5 text-xs font-semibold">Erasmus</span>
                      {e.universite.nom}
                      {e.universite.ville && <span className="font-normal text-white/80">— {e.universite.ville}</span>}
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      {[nomPays(e.universite.pays), e.niveau && LIBELLES_NIVEAU[e.niveau], e.annee, e.duree && LIBELLES_DUREE_ERASMUS[e.duree]]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {e.descriptif && <p className="mt-3">{e.descriptif}</p>}
                    {e.retour && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-semibold underline underline-offset-4">Lire le retour d’expérience</summary>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/90">{e.retour}</p>
                      </details>
                    )}
                  </li>
                ))}
                {personne.experiences.map((e) => (
                  <li key={e.id} id={e.id} className="scroll-mt-28 rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-6">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {e.organisation}
                      <Pastille>{LIBELLES_TYPE_EXPERIENCE[e.type]}</Pastille>
                      {e.niveau && <Pastille>{LIBELLES_NIVEAU[e.niveau]}</Pastille>}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">{[e.poste, e.ville, periode(e.debut, e.fin)].filter(Boolean).join(" · ")}</p>
                    {e.secteurs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {e.secteurs.map((s) => (
                          <span key={s} title={domaines.libelle(s)}>
                            <Pastille>{domaines.court(s)}</Pastille>
                          </span>
                        ))}
                      </div>
                    )}
                    {e.resume && <p className="mt-3">{e.resume}</p>}
                    {(e.missions || e.obtention || partages(e, voitTout).contact || partages(e, voitTout).rapport) && (
                      <details className="mt-3">
                        <summary className={`cursor-pointer text-sm font-semibold ${classeLien}`}>Voir le détail</summary>
                        <div className="mt-4">
                          <DetailExperience e={{ ...e, resume: null }} domaines={[]} voitTout={voitTout} avecInfos={false} />
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <Panneau titre="Contacter">
            {contacts.length === 0 ? (
              <p className="text-sm text-ink-soft">{personne.prenom} n’a pas rendu ses coordonnées visibles.</p>
            ) : (
              <ul className="space-y-2">
                {contacts.map(({ icone: Icone, libelle, lien, principal }) => (
                  <li key={lien}>
                    <a
                      href={lien}
                      {...(lien.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`flex w-full items-center gap-2.5 rounded-abm-sm px-3.5 py-3 text-[15px] font-semibold transition-colors ${
                        principal
                          ? "bg-[image:var(--degrade-bouton)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-abm-card"
                          : "border border-bordeaux-700/30 bg-white text-bordeaux-700 hover:border-bordeaux-700 hover:bg-bordeaux-100/50"
                      }`}
                    >
                      <Icone size={17} aria-hidden className="shrink-0" />
                      <span className="min-w-0 break-all">{libelle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>
          <Panneau>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-ink-soft">Promotion</dt>
                <dd className="font-semibold">{libellePromo(personne.promoEntree)}</dd>
              </div>
              {personne.ville && (
                <div>
                  <dt className="text-ink-soft">Ville</dt>
                  <dd className="font-semibold">{personne.ville}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink-soft">Fiche mise à jour</dt>
                <dd className="font-semibold">le {dateCourte(personne.modifieLe)}</dd>
              </div>
            </dl>
          </Panneau>
        </aside>
      </div>
    </div>
  );
}
