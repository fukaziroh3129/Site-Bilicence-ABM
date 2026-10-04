"use client";

import { useActionState } from "react";
import { reinitialiserMotDePasse } from "@/actions/compte";
import { BoutonEnvoyer, Champ, MessageFormulaire } from "@/components/formulaire";

export function FormulaireReinitialisation({ token }: { token: string }) {
  const [etat, action] = useActionState(reinitialiserMotDePasse, null);

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="token" value={token} />
      <Champ
        nom="motDePasse"
        libelle="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        aide="10 caractères minimum."
        minLength={10}
        requis
        etat={etat}
      />
      <Champ nom="confirmation" libelle="Confirmer" type="password" autoComplete="new-password" requis etat={etat} />
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
