"use client";

import Link from "next/link";
import { useActionState } from "react";
import { connecter } from "@/actions/compte";
import { BoutonEnvoyer, Champ, MessageFormulaire } from "@/components/formulaire";
import { classeLien } from "@/components/ui";

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action] = useActionState(connecter, null);

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="suite" value={suite} />
      <Champ nom="email" libelle="Adresse e-mail" type="email" autoComplete="email" requis etat={etat} />
      <Champ nom="motDePasse" libelle="Mot de passe" type="password" autoComplete="current-password" requis etat={etat} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BoutonEnvoyer>Se connecter</BoutonEnvoyer>
        <Link href="/mot-de-passe-oublie" className={`text-sm ${classeLien}`}>
          Mot de passe oublié
        </Link>
      </div>
    </form>
  );
}
