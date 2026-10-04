"use client";

import { useActionState } from "react";
import { importerEtablissements } from "@/actions/etablissements";
import { BoutonEnvoyer, MessageFormulaire } from "@/components/formulaire";

export function ImportEtablissements() {
  const [etat, action] = useActionState(importerEtablissements, null);
  return (
    <form action={action} className="space-y-4">
      <MessageFormulaire etat={etat} />
      <p className="text-sm text-ink-soft">
        Fichier CSV (dans Excel : « Enregistrer sous → CSV UTF-8 »), avec une première ligne de titres :{" "}
        <b>nom</b> (obligatoire), <b>ville</b>, <b>pays</b> (code à deux lettres comme « ES » ou nom français comme
        « Espagne » ; France si vide), <b>type</b> (IEP, Université, École ou Autre ; deviné d’après le nom si vide).
        Les établissements déjà présents sont ignorés : vous pouvez relancer l’import sans créer de doublons.
      </p>
      <div>
        <label htmlFor="fichier-etablissements" className="block text-sm font-semibold text-ink">
          Fichier<span className="text-bordeaux-500"> *</span>
        </label>
        <input id="fichier-etablissements" name="fichier" type="file" accept=".csv,text/csv" required className="mt-1 block text-sm file:mr-3 file:cursor-pointer file:rounded-abm-sm file:border-0 file:bg-bordeaux-100 file:px-3 file:py-2 file:font-semibold file:text-bordeaux-700 hover:file:bg-bordeaux-200" />
      </div>
      <BoutonEnvoyer>Importer</BoutonEnvoyer>
    </form>
  );
}
