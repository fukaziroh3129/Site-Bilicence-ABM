"use client";

// Formulaire d'un séjour Erasmus : on choisit le pays, puis l'université dans la liste commune
// (ou on ajoute la sienne si elle n'y est pas : utilisable tout de suite, le bureau la contrôle ensuite).

import { useActionState, useState } from "react";
import { enregistrerErasmus } from "@/actions/fiche";
import { ChampMotif } from "@/components/fiche/champ-motif";
import { BoutonEnvoyer, Champ, Liste, MessageFormulaire, ZoneTexte, valeur } from "@/components/formulaire";
import type { Erasmus } from "@/generated/prisma/client";
import { LIBELLES_NIVEAU } from "@/lib/format";
import { LIBELLES_DUREE_ERASMUS } from "@/lib/pays";

const NOUVELLE = "__nouvelle";
const optionsDuree = Object.entries(LIBELLES_DUREE_ERASMUS).map(([valeur, libelle]) => ({ valeur, libelle }));
const optionsNiveau = Object.entries(LIBELLES_NIVEAU).map(([valeur, libelle]) => ({ valeur, libelle }));
const classeSaisie =
  "mt-1 block w-full rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-2 text-ink focus:border-bordeaux-700 aria-invalid:border-bordeaux-500";

export function FormulaireErasmus({
  personneId,
  sejour,
  paysDeLUniversite,
  optionsPays,
  universites,
  demanderMotif = false,
}: {
  personneId: string;
  sejour?: Erasmus | null;
  paysDeLUniversite?: string | null;
  optionsPays: { valeur: string; libelle: string }[];
  universites: { id: string; pays: string; libelle: string }[];
  /** Le bureau modifie la fiche d'un membre : motif obligatoire (ADM-02). */
  demanderMotif?: boolean;
}) {
  const [etat, action] = useActionState(enregistrerErasmus, null);
  const [pays, setPays] = useState(valeur(etat, "pays", paysDeLUniversite));
  const [universite, setUniversite] = useState(valeur(etat, "universiteId", sejour?.universiteId));
  const duPays = universites.filter((u) => u.pays === pays);
  const erreurUniversite = etat?.erreurs?.universiteId;

  return (
    <form action={action} className="space-y-8">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="personneId" value={personneId} />
      {sejour && <input type="hidden" name="id" value={sejour.id} />}

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">Destination</legend>
        <p className="text-sm text-ink-soft">
          Erasmus désigne ici tout séjour d’études à l’étranger, en Europe ou ailleurs. La carte publique
          n’affiche que le pays, l’université et le nombre de départs, jamais votre nom.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pays" className="block text-sm font-semibold text-ink">
              Pays<span className="text-bordeaux-500"> *</span>
            </label>
            <select
              id="pays"
              name="pays"
              required
              value={pays}
              onChange={(e) => {
                setPays(e.target.value);
                setUniversite("");
              }}
              className={classeSaisie}
            >
              <option value="">— Choisir un pays —</option>
              {optionsPays.map((o) => (
                <option key={o.valeur} value={o.valeur}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="universiteId" className="block text-sm font-semibold text-ink">
              Université<span className="text-bordeaux-500"> *</span>
            </label>
            <select
              id="universiteId"
              name="universiteId"
              required
              disabled={!pays}
              value={universite}
              onChange={(e) => setUniversite(e.target.value)}
              aria-invalid={erreurUniversite ? true : undefined}
              aria-describedby={erreurUniversite ? "universiteId-erreur" : undefined}
              className={`${classeSaisie} disabled:opacity-50`}
            >
              <option value="">{pays ? "— Choisir une université —" : "Choisissez d’abord le pays"}</option>
              {duPays.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.libelle}
                </option>
              ))}
              {pays && <option value={NOUVELLE}>Mon université n’est pas dans la liste…</option>}
            </select>
            {erreurUniversite && (
              <p id="universiteId-erreur" className="mt-1 text-sm font-semibold text-bordeaux-500">
                {erreurUniversite}
              </p>
            )}
          </div>
        </div>

        {universite === NOUVELLE && (
          <div className="grid gap-5 rounded-abm-md border border-bordeaux-700/20 bg-white p-5 sm:grid-cols-2">
            <Champ
              nom="nomUniversite"
              libelle="Nom de l’université"
              requis
              maxLength={120}
              aide="Son nom officiel, de préférence en français s’il existe. Elle est ajoutée tout de suite à la liste ; le bureau vérifiera son nom."
              etat={etat}
            />
            <Champ nom="villeUniversite" libelle="Ville" maxLength={80} etat={etat} />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-3">
          <Champ nom="annee" libelle="Année de départ" type="number" inputMode="numeric" defaultValue={sejour?.annee} etat={etat} />
          <Liste nom="duree" libelle="Durée" options={optionsDuree} videLibelle="—" defaultValue={sejour?.duree} etat={etat} />
          <Liste nom="niveau" libelle="Effectué en" options={optionsNiveau} videLibelle="—" defaultValue={sejour?.niveau} etat={etat} />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">Votre expérience</legend>
        <ZoneTexte
          nom="descriptif"
          libelle="En quelques mots"
          aide="Facultatif. Une ou deux phrases : cours suivis, ambiance, ce que vous en retenez. Visible au dos de votre carte publique si vous avez accepté d’y apparaître."
          rows={3}
          maxLength={300}
          defaultValue={sejour?.descriptif}
          etat={etat}
        />
        <ZoneTexte
          nom="retour"
          libelle="Retour d’expérience détaillé"
          aide="Facultatif, visible seulement par les membres connectés : candidature, logement, budget, conseils…"
          rows={8}
          defaultValue={sejour?.retour}
          etat={etat}
        />
      </fieldset>

      {demanderMotif && <ChampMotif etat={etat} />}
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
