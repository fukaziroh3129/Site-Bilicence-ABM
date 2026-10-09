"use client";

import { useActionState, useState } from "react";
import { enregistrerFonction } from "@/actions/fonctions";
import { BoutonEnvoyer, Champ, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import type { Fonction } from "@/generated/prisma/client";
import { NIVEAUX, PICTOGRAMMES } from "@/lib/fonctions-bureau";

const optionsPictogramme = PICTOGRAMMES.map((p) => ({ valeur: p.cle, libelle: p.libelle }));

export function FormulaireFonction({ fonction }: { fonction: Fonction | null }) {
  const [etat, action] = useActionState(enregistrerFonction, null);
  const [niveau, setNiveau] = useState<string>(fonction?.niveau ?? "POLE");

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      {fonction && <input type="hidden" name="id" value={fonction.id} />}
      <Champ nom="nom" libelle="Nom de l’étiquette" requis maxLength={80} aide="Ex. « Présidence », « Trésorerie », « Sport »" defaultValue={fonction?.nom} etat={etat} />
      <Liste
        nom="niveau"
        libelle="Type"
        aide="Les fonctions du bureau sont affichées ensemble en haut de la page ; les pôles sont affichés en grand en dessous."
        options={NIVEAUX}
        defaultValue={fonction?.niveau ?? "POLE"}
        onChange={setNiveau}
        requis
        etat={etat}
      />
      {niveau === "POLE" && (
        <>
          <Liste
            nom="icone"
            libelle="Pictogramme du pôle"
            options={optionsPictogramme}
            videLibelle="Groupe de personnes (par défaut)"
            defaultValue={fonction?.icone}
            etat={etat}
          />
          <ZoneTexte
            nom="description"
            libelle="Présentation du pôle (facultatif)"
            aide="Une phrase affichée sous le nom du pôle sur la page publique."
            maxLength={300}
            rows={3}
            defaultValue={fonction?.description}
            etat={etat}
          />
        </>
      )}
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
