"use client";

import { useActionState } from "react";
import { enregistrerArticle } from "@/actions/admin";
import { ChampImage } from "@/components/champ-image";
import { BoutonEnvoyer, CaseACocher, Champ, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import type { Article } from "@/generated/prisma/client";
import { LIBELLES_CATEGORIE_ARTICLE } from "@/lib/format";

const optionsCategorie = Object.entries(LIBELLES_CATEGORIE_ARTICLE).map(([valeur, libelle]) => ({ valeur, libelle }));

const classePanneau = "rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-6";

// Mise en page d'outil de publication : le texte à gauche, les réglages de publication à droite.
export function FormulaireArticle({ article }: { article: Article | null }) {
  const [etat, action] = useActionState(enregistrerArticle, null);

  return (
    <form action={action} className="space-y-6">
      <MessageFormulaire etat={etat} />
      {article && <input type="hidden" name="id" value={article.id} />}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className={`${classePanneau} space-y-5`}>
          <Champ nom="titre" libelle="Titre" requis maxLength={160} defaultValue={article?.titre} etat={etat} />
          <ZoneTexte
            nom="chapo"
            libelle="Chapô"
            aide="Une ou deux phrases d’introduction, affichées dans la liste des actualités."
            rows={2}
            maxLength={400}
            defaultValue={article?.chapo}
            etat={etat}
          />
          <ZoneTexte
            nom="contenu"
            maxLength={30000}
            libelle="Texte"
            aide="Laissez une ligne vide entre deux paragraphes."
            rows={18}
            requis
            defaultValue={article?.contenu}
            etat={etat}
          />
        </div>
        <aside className={`${classePanneau} space-y-5 lg:sticky lg:top-28`}>
          <p className="eyebrow text-bordeaux-500">Publication</p>
          <Liste nom="categorie" libelle="Catégorie" requis options={optionsCategorie} defaultValue={article?.categorie} etat={etat} />
          <ChampImage libelle="Image" actuelle={article?.image} etat={etat} />
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
