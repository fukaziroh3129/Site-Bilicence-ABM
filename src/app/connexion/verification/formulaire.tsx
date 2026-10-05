"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verifierCodeConnexion } from "@/actions/compte";
import { BoutonEnvoyer, CaseACocher, Champ, MessageFormulaire } from "@/components/formulaire";
import { classeLien } from "@/components/ui";

export function FormulaireCode({ suite }: { suite: string }) {
  const [etat, action] = useActionState(verifierCodeConnexion, null);

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="suite" value={suite} />
      <div className="max-w-xs">
        <Champ nom="code" libelle="Code" autoComplete="one-time-code" maxLength={20} requis autoFocus etat={etat} />
      </div>
      <CaseACocher nom="secours" libelle="J’utilise un code de secours" etat={etat} />
      <CaseACocher
        nom="confiance"
        libelle="Faire confiance à cet appareil pendant 30 jours"
        aide="Seulement sur votre ordinateur ou téléphone personnel."
        etat={etat}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BoutonEnvoyer>Valider</BoutonEnvoyer>
        <Link href="/connexion" className={`text-sm ${classeLien}`}>
          Revenir à la connexion
        </Link>
      </div>
    </form>
  );
}
