"use client";

import { useActionState } from "react";
import { enregistrerMembreBureau } from "@/actions/admin";
import { ChampImage } from "@/components/champ-image";
import { BoutonEnvoyer, Champ, Liste, MessageFormulaire } from "@/components/formulaire";
import type { MembreBureau } from "@/generated/prisma/client";
import { site } from "@/lib/site";

const optionsPole = site.poles.map((p) => ({ valeur: p.code, libelle: `Pôle ${p.nom}` }));

export function FormulaireMembreBureau({ membre }: { membre: MembreBureau | null }) {
  const [etat, action] = useActionState(enregistrerMembreBureau, null);

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      {membre && <input type="hidden" name="id" value={membre.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ nom="prenom" libelle="Prénom" requis maxLength={80} defaultValue={membre?.prenom} etat={etat} />
        <Champ nom="nom" libelle="Nom" requis maxLength={80} defaultValue={membre?.nom} etat={etat} />
      </div>
      <Champ nom="role" libelle="Rôle" maxLength={120} aide="Ex. « Présidente », « Responsable du pôle Sport »" requis defaultValue={membre?.role} etat={etat} />
      <Liste
        nom="pole"
        libelle="Place dans la frise de la page Bureau"
        aide="Laissez « Bureau » pour la présidence, la trésorerie, le secrétariat… La personne la mieux placée dans l’ordre d’affichage du bureau apparaît en tête de la frise."
        options={optionsPole}
        videLibelle="Bureau (présidence, trésorerie, secrétariat…)"
        defaultValue={membre?.pole}
        etat={etat}
      />
      <Champ
        nom="ordre"
        libelle="Ordre d’affichage"
        type="number"
        inputMode="numeric"
        aide="Les plus petits nombres s’affichent en premier."
        defaultValue={membre?.ordre ?? 0}
        etat={etat}
      />
      <ChampImage libelle="Photo (format portrait)" actuelle={membre?.photo} etat={etat} />
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
