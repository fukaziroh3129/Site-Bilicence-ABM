"use client";

import { useActionState } from "react";
import { enregistrerEvenement } from "@/actions/admin";
import { BoutonEnvoyer, Champ, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import type { Evenement } from "@/generated/prisma/client";
import { versChampDateHeure } from "@/lib/formulaire";

export function FormulaireEvenement({ evenement }: { evenement: Evenement | null }) {
  const [etat, action] = useActionState(enregistrerEvenement, null);

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      {evenement && <input type="hidden" name="id" value={evenement.id} />}
      <Champ nom="titre" libelle="Titre" requis maxLength={160} defaultValue={evenement?.titre} etat={etat} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ nom="debut" libelle="Début" type="datetime-local" requis defaultValue={versChampDateHeure(evenement?.debut)} etat={etat} />
        <Champ nom="fin" libelle="Fin" type="datetime-local" aide="Facultatif" defaultValue={versChampDateHeure(evenement?.fin)} etat={etat} />
      </div>
      <Champ nom="lieu" libelle="Lieu" maxLength={160} defaultValue={evenement?.lieu} etat={etat} />
      <ZoneTexte nom="description" libelle="Description" rows={6} maxLength={5000} defaultValue={evenement?.description} etat={etat} />
      <Champ
        nom="lien"
        libelle="Lien"
        type="url"
        placeholder="https://www.instagram.com/…"
        aide="Publication Instagram, billetterie…"
        defaultValue={evenement?.lien}
        etat={etat}
      />
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
