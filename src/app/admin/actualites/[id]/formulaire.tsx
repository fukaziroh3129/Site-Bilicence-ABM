"use client";

import { CalendarDays, Newspaper } from "lucide-react";
import { useActionState, useState } from "react";
import { enregistrerArticle } from "@/actions/admin";
import { ChampImage } from "@/components/champ-image";
import { BoutonEnvoyer, CaseACocher, Champ, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import type { Article, TypePublication } from "@/generated/prisma/client";
import { LIBELLES_CATEGORIE_ARTICLE } from "@/lib/format";
import { versChampDateHeure } from "@/lib/formulaire";

const optionsCategorie = Object.entries(LIBELLES_CATEGORIE_ARTICLE).map(([valeur, libelle]) => ({ valeur, libelle }));

const classePanneau = "rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-6";

const TYPES = [
  { valeur: "ACTUALITE", libelle: "Actualité", aide: "Portrait, nouvelle, compte rendu", Icone: Newspaper },
  { valeur: "EVENEMENT", libelle: "Événement", aide: "Rendez-vous avec une date et un lieu", Icone: CalendarDays },
] as const;

// Mise en page d'outil de publication : le texte à gauche, les réglages de publication à droite.
// Un seul formulaire pour les actualités et les événements : choisir « Événement » ajoute la date
// et le lieu. Après l'événement, on peut revenir compléter le texte et ajouter une photo.
export function FormulaireArticle({ article, typeInitial }: { article: Article | null; typeInitial: TypePublication }) {
  const [etat, action] = useActionState(enregistrerArticle, null);
  const [type, setType] = useState<TypePublication>(typeInitial);
  const evenement = type === "EVENEMENT";

  return (
    <form action={action} className="space-y-6">
      <MessageFormulaire etat={etat} />
      {article && <input type="hidden" name="id" value={article.id} />}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className={`${classePanneau} space-y-5`}>
          <fieldset>
            <legend className="block text-sm font-semibold text-ink">Type de publication</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {TYPES.map(({ valeur: v, libelle, aide, Icone }) => (
                <label
                  key={v}
                  className="flex cursor-pointer items-center gap-3 rounded-abm-md border border-bordeaux-700/20 px-4 py-3 transition-colors hover:border-bordeaux-400 has-[:checked]:border-bordeaux-700 has-[:checked]:bg-bordeaux-100/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordeaux-700"
                >
                  <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />
                  <Icone size={22} strokeWidth={1.5} aria-hidden className="shrink-0 text-bordeaux-700" />
                  <span>
                    <span className="block font-semibold text-bordeaux-700">{libelle}</span>
                    <span className="block text-xs text-ink-soft">{aide}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Champ nom="titre" libelle="Titre" requis maxLength={160} defaultValue={article?.titre} etat={etat} />

          {evenement && (
            <div className="space-y-5 rounded-abm-md border border-bordeaux-700/15 bg-beige-papier/40 p-4 sm:p-5">
              <p className="eyebrow text-bordeaux-500">Date et lieu</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Champ nom="debut" libelle="Début" type="datetime-local" requis defaultValue={versChampDateHeure(article?.debut)} etat={etat} />
                <Champ nom="fin" libelle="Fin" type="datetime-local" aide="Facultatif" defaultValue={versChampDateHeure(article?.fin)} etat={etat} />
              </div>
              <Champ nom="lieu" libelle="Lieu" maxLength={160} defaultValue={article?.lieu} etat={etat} />
              <Champ
                nom="lien"
                libelle="Lien"
                type="url"
                placeholder="https://www.instagram.com/…"
                aide="Publication Instagram, billetterie…"
                defaultValue={article?.lien}
                etat={etat}
              />
            </div>
          )}

          <ZoneTexte
            nom="chapo"
            libelle="Chapô"
            aide={evenement ? "Une phrase de présentation, reprise dans l’agenda des visiteurs." : "Une ou deux phrases d’introduction, affichées dans la liste des actualités."}
            rows={2}
            maxLength={400}
            defaultValue={article?.chapo}
            etat={etat}
          />
          <ZoneTexte
            nom="contenu"
            maxLength={30000}
            libelle={evenement ? "Description" : "Texte"}
            aide={
              evenement
                ? "Facultatif. Après l’événement, vous pouvez revenir ici raconter comment il s’est passé. Laissez une ligne vide entre deux paragraphes."
                : "Laissez une ligne vide entre deux paragraphes."
            }
            rows={evenement ? 8 : 18}
            requis={!evenement}
            defaultValue={article?.contenu}
            etat={etat}
          />
        </div>
        <aside className={`${classePanneau} space-y-5 lg:sticky lg:top-28`}>
          <p className="eyebrow text-bordeaux-500">Publication</p>
          {evenement ? (
            // Un événement est présenté comme tel sur le site : sa catégorie ne s'affiche pas.
            <input type="hidden" name="categorie" value={article?.categorie ?? "ASSOCIATION"} />
          ) : (
            <Liste nom="categorie" libelle="Catégorie" requis options={optionsCategorie} defaultValue={article?.categorie} etat={etat} />
          )}
          <ChampImage libelle={evenement ? "Affiche ou photo" : "Image"} actuelle={article?.image} etat={etat} />
          <CaseACocher
            nom="aLaUne"
            libelle="À la une : grand format en tête de la page Actualités"
            aide="Pour les temps forts (concours d’éloquence, gala…). Prévoir une photo en paysage."
            defaultChecked={article?.aLaUne}
            etat={etat}
          />
          <CaseACocher nom="publie" libelle="Publier sur le site (sinon : brouillon, visible seulement ici)" defaultChecked={article?.publie} etat={etat} />
          <div className="border-t border-bordeaux-700/10 pt-4">
            <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
          </div>
        </aside>
      </div>
    </form>
  );
}
