"use client";

import { useActionState } from "react";
import { demanderReinitialisation } from "@/actions/compte";
import { BoutonEnvoyer, Champ, MessageFormulaire } from "@/components/formulaire";
import { CarteFormulaire } from "@/components/ui";

export default function MotDePasseOublie() {
  const [etat, action] = useActionState(demanderReinitialisation, null);

  return (
    <CarteFormulaire
      titre="Mot de passe oublié"
      intro="Indiquez l’adresse e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe."
    >
      {etat?.succes ? (
        <MessageFormulaire etat={etat} />
      ) : (
        <form action={action} className="space-y-5">
          <MessageFormulaire etat={etat} />
          <Champ nom="email" libelle="Adresse e-mail" type="email" autoComplete="email" requis etat={etat} />
          <BoutonEnvoyer>Recevoir le lien</BoutonEnvoyer>
        </form>
      )}
    </CarteFormulaire>
  );
}
