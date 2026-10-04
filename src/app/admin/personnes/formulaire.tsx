"use client";

import { useActionState } from "react";
import { creerPersonne } from "@/actions/admin";
import { BoutonEnvoyer, Champ, Liste, MessageFormulaire } from "@/components/formulaire";
import { libellePromo, listePromos } from "@/lib/format";

export function FormulaireNouvellePersonne() {
  const [etat, action] = useActionState(creerPersonne, null);
  return (
    <form action={action} className="space-y-4">
      <MessageFormulaire etat={etat} />
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Champ nom="prenom" libelle="Prénom" requis etat={etat} />
        <Champ nom="nom" libelle="Nom" requis etat={etat} />
        <Liste
          nom="promoEntree"
          libelle="Promotion"
          requis
          videLibelle="— Choisir —"
          options={listePromos().map((a) => ({ valeur: String(a), libelle: libellePromo(a) }))}
          etat={etat}
        />
        <BoutonEnvoyer>Créer</BoutonEnvoyer>
      </div>
    </form>
  );
}
