"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inscrire } from "@/actions/compte";
import { BoutonEnvoyer, CaseACocher, Champ, Liste, MessageFormulaire } from "@/components/formulaire";
import { classeLien } from "@/components/ui";
import { libellePromo, listePromos } from "@/lib/format";

export function FormulaireInscription() {
  const [etat, action] = useActionState(inscrire, null);

  if (etat?.succes) return <MessageFormulaire etat={etat} />;

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ nom="prenom" libelle="Prénom" autoComplete="given-name" requis etat={etat} />
        <Champ nom="nom" libelle="Nom" autoComplete="family-name" requis etat={etat} />
      </div>
      <Liste
        nom="promoEntree"
        libelle="Promotion"
        requis
        etat={etat}
        videLibelle="— Choisir —"
        options={listePromos().map((a) => ({ valeur: String(a), libelle: libellePromo(a) }))}
      />
      <Champ nom="email" libelle="Adresse e-mail" type="email" autoComplete="email" requis etat={etat} />
      <Champ
        nom="motDePasse"
        libelle="Mot de passe"
        type="password"
        autoComplete="new-password"
        aide="10 caractères minimum."
        minLength={10}
        requis
        etat={etat}
      />
      <Champ
        nom="confirmation"
        libelle="Confirmer le mot de passe"
        type="password"
        autoComplete="new-password"
        requis
        etat={etat}
      />
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
      <BoutonEnvoyer>Créer mon compte</BoutonEnvoyer>
    </form>
  );
}
