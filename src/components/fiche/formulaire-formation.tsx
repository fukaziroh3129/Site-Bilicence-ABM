"use client";

import { useActionState, useMemo, useState } from "react";
import { enregistrerFormation } from "@/actions/fiche";
import { ChampMotif } from "@/components/fiche/champ-motif";
import { BoutonEnvoyer, Champ, MessageFormulaire } from "@/components/formulaire";
import type { Formation } from "@/generated/prisma/client";
import { detecterMention, estBiLicence } from "@/lib/mentions";

/** Mentions proposées dans le menu, groupées par grand domaine d'études (voir groupesMentions). */
export type GroupeMentions = { libelle: string; mentions: { id: string; libelle: string; variantes: string[] }[] };

export function FormulaireFormation({
  personneId,
  formation,
  etablissements,
  mentions,
  demanderMotif = false,
}: {
  personneId: string;
  formation?: Formation | null;
  /** Noms de la liste commune, proposés pendant la saisie (la saisie libre reste possible). */
  etablissements: string[];
  mentions: GroupeMentions[];
  /** Le bureau modifie la fiche d'un membre : motif obligatoire (ADM-02). */
  demanderMotif?: boolean;
}) {
  const [etat, action] = useActionState(enregistrerFormation, null);

  // Mention proposée pendant la saisie de l'intitulé ; la personne peut en choisir une autre.
  // Le serveur refait la reconnaissance si elle n'a rien choisi elle-même.
  const toutes = useMemo(() => mentions.flatMap((g) => g.mentions), [mentions]);
  const [intitule, setIntitule] = useState(formation?.intitule ?? "");
  const [parcours, setParcours] = useState(formation?.parcours ?? "");
  const [manuelle, setManuelle] = useState(formation ? !formation.mentionAuto : false);
  const [choix, setChoix] = useState(formation?.mentionId ?? "");
  const reconnue = detecterMention(intitule, parcours, toutes);
  const valeurMention = manuelle ? choix : (reconnue?.mentionId ?? "");
  const aide = estBiLicence(intitule)
    ? "La bi-licence figure déjà automatiquement sur votre fiche."
    : manuelle
      ? "Choisie à la main : le bureau la vérifiera."
      : reconnue
        ? "Reconnue automatiquement à partir de l’intitulé. Corrigez-la si elle ne correspond pas."
        : intitule.trim()
          ? "Mention non reconnue : choisissez-la dans la liste, ou laissez le bureau s’en charger."
          : "Elle sera proposée automatiquement d’après l’intitulé.";

  return (
    <form action={action} className="space-y-8">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="personneId" value={personneId} />
      {formation && <input type="hidden" name="id" value={formation.id} />}

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 text-bordeaux-500">La formation</legend>
        <Champ
          nom="intitule"
          libelle="Diplôme ou mention"
          aide="Tel qu’écrit sur votre diplôme, ex. « Master Relations internationales »"
          requis
          defaultValue={formation?.intitule}
          onChange={(e) => setIntitule(e.target.value)}
          etat={etat}
        />
        <Champ nom="parcours" libelle="Parcours" defaultValue={formation?.parcours} onChange={(e) => setParcours(e.target.value)} etat={etat} />

        <div>
          <label htmlFor="mentionId" className="block text-sm font-semibold text-ink">
            Mention de master
          </label>
          <select
            id="mentionId"
            name="mentionId"
            value={valeurMention}
            onChange={(e) => {
              setManuelle(true);
              setChoix(e.target.value);
            }}
            aria-describedby="mentionId-aide"
            className="mt-1 block w-full rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-2 text-ink focus:border-bordeaux-700"
          >
            <option value="">— Je ne la trouve pas (le bureau s’en chargera) —</option>
            {mentions.map((g) => (
              <optgroup key={g.libelle} label={g.libelle}>
                {g.mentions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.libelle}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {manuelle && <input type="hidden" name="mentionManuelle" value="on" />}
          <p id="mentionId-aide" className="mt-1 text-xs text-ink-soft" aria-live="polite">
            {aide}
            {manuelle && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => setManuelle(false)}
                  className="font-semibold text-bordeaux-700 underline decoration-bordeaux-700/35 underline-offset-2"
                >
                  Revenir à la mention proposée
                </button>
              </>
            )}
          </p>
        </div>

        <Champ
          nom="etablissement"
          libelle="Établissement"
          aide="Commencez à taper puis choisissez dans la liste. S’il n’y est pas, écrivez son nom complet : il sera ajouté à la liste commune."
          requis
          maxLength={160}
          list="etablissements-connus"
          autoComplete="off"
          defaultValue={formation?.etablissement}
          etat={etat}
        />
        <datalist id="etablissements-connus">
          {etablissements.map((nom) => (
            <option key={nom} value={nom} />
          ))}
        </datalist>
      </fieldset>
      <fieldset className="space-y-5 border-t border-bordeaux-700/10 pt-6">
        <legend className="eyebrow float-left mb-4 w-full text-bordeaux-500">Les années</legend>
        <div className="clear-left grid gap-5 sm:grid-cols-2">
          <Champ nom="anneeDebut" libelle="Année de début" type="number" inputMode="numeric" defaultValue={formation?.anneeDebut} etat={etat} />
          <Champ nom="anneeFin" libelle="Année de fin" type="number" inputMode="numeric" defaultValue={formation?.anneeFin} etat={etat} />
        </div>
      </fieldset>
      {demanderMotif && <ChampMotif etat={etat} />}
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
