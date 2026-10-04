"use client";

import Link from "next/link";
import { useActionState } from "react";
import { proposerOffre } from "@/actions/offres";
import { BoutonEnvoyer, Champ, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import { classeLien } from "@/components/ui";
import { LIBELLES_TYPE_OFFRE } from "@/lib/format";

const optionsType = Object.entries(LIBELLES_TYPE_OFFRE).map(([valeur, libelle]) => ({ valeur, libelle }));

export function FormulaireOffre({ publicationDirecte = false }: { publicationDirecte?: boolean }) {
  const [etat, action] = useActionState(proposerOffre, null);

  if (etat?.succes) {
    return (
      <div className="space-y-4">
        <MessageFormulaire etat={etat} />
        <Link href="/espace/offres" className={classeLien}>
          Retour aux offres
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      <MessageFormulaire etat={etat} />
      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 text-bordeaux-500">Le poste</legend>
        <Champ nom="titre" libelle="Intitulé du poste" requis maxLength={160} etat={etat} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ nom="organisation" libelle="Structure" requis maxLength={160} etat={etat} />
          <Liste nom="type" libelle="Type" requis options={optionsType} videLibelle="— Choisir —" etat={etat} />
        </div>
        <ZoneTexte nom="description" libelle="Description" rows={8} requis maxLength={5000} etat={etat} />
      </fieldset>
      <fieldset className="space-y-5 border-t border-bordeaux-700/10 pt-6">
        <legend className="eyebrow float-left mb-4 w-full text-bordeaux-500">Candidature</legend>
        <div className="clear-left grid gap-5 sm:grid-cols-2">
          <Champ nom="lieu" libelle="Lieu" maxLength={120} etat={etat} />
          <Champ nom="dateLimite" libelle="Date limite de candidature" type="date" etat={etat} />
        </div>
        <Champ nom="lien" libelle="Lien vers l’offre complète" type="url" placeholder="https://…" etat={etat} />
        <Champ nom="contact" libelle="Contact pour candidater" maxLength={200} aide="Nom, e-mail… si l’offre n’a pas de lien." etat={etat} />
      </fieldset>
      <BoutonEnvoyer>{publicationDirecte ? "Publier l’offre" : "Envoyer au bureau"}</BoutonEnvoyer>
    </form>
  );
}
