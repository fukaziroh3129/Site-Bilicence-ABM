"use client";

import { useActionState } from "react";
import { enregistrerFormation } from "@/actions/fiche";
import { ChampMotif } from "@/components/fiche/champ-motif";
import { BoutonEnvoyer, Champ, MessageFormulaire } from "@/components/formulaire";
import type { Formation } from "@/generated/prisma/client";

export function FormulaireFormation({
  personneId,
  formation,
  etablissements,
  demanderMotif = false,
}: {
  personneId: string;
  formation?: Formation | null;
  /** Noms de la liste commune, proposés pendant la saisie (la saisie libre reste possible). */
  etablissements: string[];
  /** Le bureau modifie la fiche d'un membre : motif obligatoire (ADM-02). */
  demanderMotif?: boolean;
}) {
  const [etat, action] = useActionState(enregistrerFormation, null);

  return (
    <form action={action} className="space-y-8">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="personneId" value={personneId} />
      {formation && <input type="hidden" name="id" value={formation.id} />}

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 text-bordeaux-500">La formation</legend>
        <Champ
          nom="intitule"
          libelle="Diplôme ou mention"
          aide="Ex. « Master Relations internationales »"
          requis
          defaultValue={formation?.intitule}
          etat={etat}
        />
        <Champ nom="parcours" libelle="Parcours" defaultValue={formation?.parcours} etat={etat} />
        <Champ
          nom="etablissement"
          libelle="Établissement"
          aide="Commencez à taper puis choisissez dans la liste. S’il n’y est pas, écrivez son nom complet : il sera ajouté à la liste commune."
          requis
          maxLength={160}
          list="etablissements-connus"
          autoComplete="off"
          defaultValue={formation?.etablissement}
          etat={etat}
        />
        <datalist id="etablissements-connus">
          {etablissements.map((nom) => (
            <option key={nom} value={nom} />
          ))}
        </datalist>
      </fieldset>
      <fieldset className="space-y-5 border-t border-bordeaux-700/10 pt-6">
        <legend className="eyebrow float-left mb-4 w-full text-bordeaux-500">Les années</legend>
        <div className="clear-left grid gap-5 sm:grid-cols-2">
          <Champ nom="anneeDebut" libelle="Année de début" type="number" inputMode="numeric" defaultValue={formation?.anneeDebut} etat={etat} />
          <Champ nom="anneeFin" libelle="Année de fin" type="number" inputMode="numeric" defaultValue={formation?.anneeFin} etat={etat} />
        </div>
      </fieldset>
      {demanderMotif && <ChampMotif etat={etat} />}
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
