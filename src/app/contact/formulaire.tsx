"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { envoyerContact } from "@/actions/contact";
import { BoutonEnvoyer, Champ, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";

export function FormulaireContact({ objets, objetInitial }: { objets: { valeur: string; libelle: string }[]; objetInitial?: string }) {
  const [etat, action] = useActionState(envoyerContact, null);

  if (etat?.succes) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle2 size={44} strokeWidth={1.5} className="text-bordeaux-700" aria-hidden />
        <p className="font-display text-2xl font-bold text-bordeaux-700">Message envoyé</p>
        <p className="max-w-[40ch] text-ink-soft">{etat.succes}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ nom="nom" libelle="Nom" autoComplete="name" requis etat={etat} />
        <Champ nom="email" libelle="Adresse e-mail" type="email" autoComplete="email" requis etat={etat} />
      </div>
      <Liste nom="objet" libelle="Objet" requis options={objets} defaultValue={objetInitial ?? "question"} etat={etat} />
      <ZoneTexte nom="message" libelle="Message" rows={7} requis etat={etat} />
      {/* Champ piège pour les robots : invisible et ignoré par les humains */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="site">Ne pas remplir</label>
        <input id="site" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-xs text-ink-soft">
        Votre message est transmis par e-mail au bureau de l’association, qui vous répond directement. Il n’est
        pas conservé sur le site.
      </p>
      <BoutonEnvoyer>Envoyer</BoutonEnvoyer>
    </form>
  );
}
