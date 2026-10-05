"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { changerEmail, changerMotDePasse, supprimerMonCompte } from "@/actions/compte";
import { BoutonEnvoyer, Champ, MessageFormulaire } from "@/components/formulaire";

export function FormulaireMotDePasse() {
  const [etat, action] = useActionState(changerMotDePasse, null);
  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="max-w-sm">
        <Champ nom="actuel" libelle="Mot de passe actuel" type="password" autoComplete="current-password" requis etat={etat} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
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
      </div>
      <BoutonEnvoyer>Modifier le mot de passe</BoutonEnvoyer>
    </form>
  );
}

export function FormulaireEmail() {
  const [etat, action] = useActionState(changerEmail, null);
  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ nom="email" libelle="Nouvelle adresse e-mail" type="email" autoComplete="email" requis etat={etat} />
        <Champ nom="motDePasseEmail" libelle="Mot de passe actuel" type="password" autoComplete="current-password" requis etat={etat} />
      </div>
      <BoutonEnvoyer>Changer d’adresse</BoutonEnvoyer>
    </form>
  );
}

export function FormulaireSuppression() {
  const [etat, action] = useActionState(supprimerMonCompte, null);
  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="max-w-sm">
        <Champ nom="motDePasseSuppression" libelle="Mot de passe (pour confirmer)" type="password" autoComplete="current-password" requis etat={etat} />
      </div>
      <BoutonEnvoyer variante="danger" confirmation="Supprimer définitivement votre compte et votre fiche ?">
        <Trash2 size={16} aria-hidden /> Supprimer définitivement
      </BoutonEnvoyer>
    </form>
  );
}
