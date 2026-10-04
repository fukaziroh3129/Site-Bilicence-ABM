"use client";

import Link from "next/link";
import { useActionState } from "react";
import { activerInvitation } from "@/actions/invitations";
import { BoutonEnvoyer, CaseACocher, Champ, MessageFormulaire } from "@/components/formulaire";
import { classeLien } from "@/components/ui";

export function FormulaireActivation({ jeton, email }: { jeton: string; email: string }) {
  const [etat, action] = useActionState(activerInvitation, null);

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="jeton" value={jeton} />
      {/* Aide les gestionnaires de mots de passe à associer le mot de passe au bon compte. */}
      <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
      <Champ
        nom="motDePasse"
        libelle="Choisissez votre mot de passe"
        type="password"
        autoComplete="new-password"
        aide="10 caractères minimum."
        minLength={10}
        requis
        etat={etat}
      />
      <Champ nom="confirmation" libelle="Confirmer le mot de passe" type="password" autoComplete="new-password" requis etat={etat} />
      <CaseACocher
        nom="confidentialite"
        libelle="J’ai lu la politique de confidentialité et j’accepte que mes informations soient utilisées pour gérer mon compte."
        requis
        etat={etat}
      />
      <p className="text-xs text-ink-soft">
        <Link href="/confidentialite" className={classeLien} target="_blank">
          Lire la politique de confidentialité
        </Link>
      </p>
      <BoutonEnvoyer>Activer mon compte</BoutonEnvoyer>
    </form>
  );
}
