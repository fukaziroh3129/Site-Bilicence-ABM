"use client";

// Ajout ou modification d'une formation complémentaire (DU, licence en parallèle, certification,
// MOOC, autre). Les libellés et les champs s'adaptent au type choisi.

import { useActionState, useState } from "react";
import { enregistrerFormationComplementaire } from "@/actions/fiche";
import { ICONES_COMPLEMENTAIRE } from "@/components/complementaires/icones";
import { ChampMotif } from "@/components/fiche/champ-motif";
import { BoutonEnvoyer, Champ, MessageFormulaire, ZoneTexte, valeur } from "@/components/formulaire";
import type { FormationComplementaire } from "@/generated/prisma/client";
import { LIBELLES_COMPLEMENTAIRE, TYPES_AVEC_ETABLISSEMENT, TYPES_COMPLEMENTAIRES, type TypeComplementaire } from "@/lib/complementaires";

const TEXTES: Record<TypeComplementaire, { titre: string; organisme: string; aideOrganisme: string; annee: string }> = {
  DU: {
    titre: "ex. « DU Droit des collectivités territoriales »",
    organisme: "Université ou établissement",
    aideOrganisme: "Commencez à taper puis choisissez dans la liste. S’il n’y est pas, écrivez son nom complet.",
    annee: "Année de début",
  },
  LICENCE: {
    titre: "ex. « Licence de droit », « Licence d’histoire »",
    organisme: "Université ou établissement",
    aideOrganisme: "Commencez à taper puis choisissez dans la liste. S’il n’y est pas, écrivez son nom complet.",
    annee: "Année de début",
  },
  CERTIFICATION: {
    titre: "ex. « TOEIC Listening & Reading », « Certificat Voltaire »",
    organisme: "Organisme",
    aideOrganisme: "ex. ETS Global, British Council, Projet Voltaire, Pix.",
    annee: "Année d’obtention",
  },
  MOOC: {
    titre: "Le titre du cours, ex. « Europe : enjeux et institutions »",
    organisme: "Plateforme ou organisme",
    aideOrganisme: "ex. FUN MOOC, Coursera, edX, OpenClassrooms.",
    annee: "Année",
  },
  AUTRE: {
    titre: "ex. « BAFA », « École d’été en économie du développement »",
    organisme: "Organisme ou établissement",
    aideOrganisme: "Qui l’a délivrée ou organisée.",
    annee: "Année de début",
  },
};

export function FormulaireComplementaire({
  personneId,
  formation,
  etablissements,
  demanderMotif = false,
}: {
  personneId: string;
  formation?: FormationComplementaire | null;
  /** Noms de la liste commune, proposés pour un DU ou une licence (la saisie libre reste possible). */
  etablissements: string[];
  /** Le bureau modifie la fiche d'un membre : motif obligatoire (ADM-02). */
  demanderMotif?: boolean;
}) {
  const [etat, action] = useActionState(enregistrerFormationComplementaire, null);
  const [type, setType] = useState<TypeComplementaire>(
    (valeur(etat, "type", formation?.type) as TypeComplementaire) || "DU",
  );
  const textes = TEXTES[type];
  const uneAnnee = type === "CERTIFICATION" || type === "MOOC";

  return (
    <form action={action} className="space-y-8">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="personneId" value={personneId} />
      {formation && <input type="hidden" name="id" value={formation.id} />}

      <fieldset>
        <legend className="eyebrow mb-4 text-bordeaux-500">Quel type de formation ?</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {TYPES_COMPLEMENTAIRES.map((t) => {
            const Icone = ICONES_COMPLEMENTAIRE[t];
            const choisi = t === type;
            return (
              <label
                key={t}
                className={`relative flex cursor-pointer flex-col rounded-abm-md border bg-white p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordeaux-700 ${
                  choisi ? "border-bordeaux-700 shadow-[inset_0_0_0_1px_var(--color-bordeaux-700)]" : "border-bordeaux-700/25 hover:border-bordeaux-700/60"
                }`}
              >
                <input type="radio" name="type" value={t} checked={choisi} onChange={() => setType(t)} className="sr-only" />
                <span className={`grid size-8 place-items-center rounded-abm-sm ${choisi ? "bg-bordeaux-700 text-white" : "bg-bordeaux-100 text-bordeaux-700"}`}>
                  <Icone size={17} aria-hidden />
                </span>
                <span className="mt-2 text-[15px] font-semibold leading-tight text-ink">{LIBELLES_COMPLEMENTAIRE[t].un}</span>
                <span className="mt-0.5 text-xs leading-snug text-ink-soft">{LIBELLES_COMPLEMENTAIRE[t].exemples}</span>
              </label>
            );
          })}
        </div>
        {etat?.erreurs?.type && <p className="mt-2 text-sm font-semibold text-bordeaux-500">{etat.erreurs.type}</p>}
      </fieldset>

      <fieldset className="space-y-5 border-t border-bordeaux-700/10 pt-6">
        <legend className="eyebrow float-left mb-4 w-full text-bordeaux-500">La formation</legend>
        <div className="clear-left space-y-5">
          <Champ
            nom="titre"
            libelle="Titre"
            aide={`Tel qu’il figure sur le diplôme ou l’attestation, ${textes.titre}.`}
            requis
            maxLength={160}
            defaultValue={formation?.titre}
            etat={etat}
          />
          <Champ
            key={TYPES_AVEC_ETABLISSEMENT.includes(type) ? "etablissement" : "organisme"}
            nom="organisme"
            libelle={textes.organisme}
            aide={textes.aideOrganisme}
            requis
            maxLength={160}
            autoComplete="off"
            list={TYPES_AVEC_ETABLISSEMENT.includes(type) ? "etablissements-connus" : undefined}
            defaultValue={formation?.organisme}
            etat={etat}
          />
          <datalist id="etablissements-connus">
            {etablissements.map((nom) => (
              <option key={nom} value={nom} />
            ))}
          </datalist>
          {type === "CERTIFICATION" && (
            <Champ nom="resultat" libelle="Score ou niveau obtenu" aide="Facultatif. ex. 945, C1." maxLength={40} defaultValue={formation?.resultat} etat={etat} />
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-bordeaux-700/10 pt-6">
        <legend className="eyebrow float-left mb-4 w-full text-bordeaux-500">{uneAnnee ? "L’année" : "Les années"}</legend>
        <div className="clear-left grid gap-5 sm:grid-cols-2">
          <Champ nom="anneeDebut" libelle={textes.annee} type="number" inputMode="numeric" defaultValue={formation?.anneeDebut} etat={etat} />
          {!uneAnnee && <Champ nom="anneeFin" libelle="Année de fin" type="number" inputMode="numeric" defaultValue={formation?.anneeFin} etat={etat} />}
        </div>
      </fieldset>

      <fieldset className="border-t border-bordeaux-700/10 pt-6">
        <legend className="eyebrow float-left mb-4 w-full text-bordeaux-500">Votre avis</legend>
        <div className="clear-left">
          <ZoneTexte
            nom="avis"
            libelle="Ce que c’est, ce que vous en avez pensé"
            aide="Contenu, charge de travail, ce que ça vous a apporté, à qui vous la conseilleriez. Visible des seuls membres connectés (annuaire et page « Formations complémentaires »), jamais sur la page publique."
            rows={5}
            maxLength={600}
            defaultValue={formation?.avis}
            etat={etat}
          />
        </div>
      </fieldset>

      {demanderMotif && <ChampMotif etat={etat} />}
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
