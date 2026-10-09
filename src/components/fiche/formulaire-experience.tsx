"use client";

import { FileText } from "lucide-react";
import { useActionState, useState } from "react";
import { enregistrerExperience } from "@/actions/fiche";
import { ChampMotif } from "@/components/fiche/champ-motif";
import { BoutonEnvoyer, CaseACocher, CasesMultiples, Champ, Interrupteur, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import type { Experience } from "@/generated/prisma/client";
import { LIBELLES_NIVEAU, LIBELLES_TYPE_EXPERIENCE } from "@/lib/format";
import { versChampMois, type EtatFormulaire } from "@/lib/formulaire";

const optionsType = Object.entries(LIBELLES_TYPE_EXPERIENCE).map(([valeur, libelle]) => ({ valeur, libelle }));
const optionsNiveau = Object.entries(LIBELLES_NIVEAU).map(([valeur, libelle]) => ({ valeur, libelle }));

/** Stages et alternances : seuls ces types ont une fiche détaillée dans l'archive des stages. */
const TYPES_DETAILLES = ["STAGE", "ALTERNANCE"];

/** Choix d'une case : celui saisi avant une erreur, sinon la valeur enregistrée. */
function coche(etat: EtatFormulaire, nom: string, defaut: boolean) {
  return etat?.valeurs ? etat.valeurs[nom] === "on" : defaut;
}

export function FormulaireExperience({
  personneId,
  experience,
  optionsDomaines,
  demanderMotif = false,
}: {
  personneId: string;
  experience?: Experience | null;
  optionsDomaines: { valeur: string; libelle: string; groupe?: string }[];
  /** Le bureau modifie la fiche d'un membre : motif obligatoire (ADM-02). */
  demanderMotif?: boolean;
}) {
  const [etat, action] = useActionState(enregistrerExperience, null);

  // Ce qui s'affiche selon les choix (type d'expérience, partage du contact…).
  const choix = (e: EtatFormulaire) => ({
    type: typeof e?.valeurs?.type === "string" ? e.valeurs.type : (experience?.type ?? "STAGE"),
    partagerContact: coche(e, "partagerContact", experience?.partagerContact ?? false),
    contactAccord: coche(e, "contactAccord", experience?.contactAccord ?? false),
  });
  const [affichage, setAffichage] = useState(() => choix(etat));
  const [etatVu, setEtatVu] = useState(etat);
  if (etatVu !== etat) {
    // Après un envoi, le formulaire est réinitialisé avec les valeurs saisies : on suit.
    setEtatVu(etat);
    setAffichage(choix(etat));
  }
  const detaille = TYPES_DETAILLES.includes(affichage.type);
  const motType = affichage.type === "ALTERNANCE" ? "cette alternance" : "ce stage";

  return (
    <form action={action} className="space-y-10">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="personneId" value={personneId} />
      {experience && <input type="hidden" name="id" value={experience.id} />}

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">L’essentiel</legend>
        <p className="text-sm text-ink-soft">
          Ces informations apparaissent dans l’annuaire et l’archive des stages. Si vous avez accepté
          d’apparaître sur la page publique « Que sont-ils devenus ? », le type, la structure, le poste et
          le résumé figurent aussi au dos de votre carte.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Liste
            nom="type"
            libelle="Type"
            requis
            options={optionsType}
            defaultValue={experience?.type ?? "STAGE"}
            onChange={(type) => setAffichage((a) => ({ ...a, type }))}
            etat={etat}
          />
          <Liste
            nom="niveau"
            libelle="Effectué en"
            aide="Pour un stage : pendant la licence ou le master."
            options={optionsNiveau}
            videLibelle="—"
            defaultValue={experience?.niveau}
            etat={etat}
          />
        </div>
        <Champ nom="organisation" libelle="Structure" aide="Entreprise, administration, association…" requis defaultValue={experience?.organisation} etat={etat} />
        <Champ nom="poste" libelle="Poste ou mission" defaultValue={experience?.poste} etat={etat} />
        <div className="grid gap-5 sm:grid-cols-3">
          <Champ nom="ville" libelle="Ville" defaultValue={experience?.ville} etat={etat} />
          <Champ nom="debut" libelle="Début" type="month" defaultValue={versChampMois(experience?.debut)} etat={etat} />
          <Champ nom="fin" libelle="Fin" type="month" defaultValue={versChampMois(experience?.fin)} etat={etat} />
        </div>
        <CasesMultiples nom="secteurs" libelle="Domaines" options={optionsDomaines} defaultValue={experience?.secteurs} etat={etat} />
        <ZoneTexte
          nom="resume"
          libelle="Résumé"
          aide="Une ou deux phrases, affichées dans les listes. 300 caractères maximum."
          rows={3}
          maxLength={300}
          defaultValue={experience?.resume}
          etat={etat}
        />
      </fieldset>

      {/* Masqués (et non retirés) pour les autres types : les textes déjà saisis sont conservés. */}
      <fieldset className="space-y-5" hidden={!detaille}>
        <legend className="eyebrow text-bordeaux-500">Le détail de {motType}</legend>
        <p className="text-sm text-ink-soft">
          Visible par les membres connectés, dans la fiche détaillée de l’archive des stages et sur votre fiche.
        </p>
        <ZoneTexte
          nom="missions"
          libelle="Missions principales et déroulé"
          aide="Ce que vous faisiez au quotidien, les dossiers suivis, l’organisation de l’équipe."
          rows={5}
          maxLength={2000}
          defaultValue={experience?.missions}
          etat={etat}
        />
        <ZoneTexte
          nom="obtention"
          libelle={`Comment j’ai obtenu ${motType}`}
          aide="Démarches, personnes contactées, calendrier de candidature, conseils pour s’intégrer… aussi long que vous le souhaitez."
          rows={8}
          defaultValue={experience?.obtention}
          etat={etat}
        />
      </fieldset>

      <fieldset className="space-y-6" hidden={!detaille}>
        <legend className="eyebrow text-bordeaux-500">Pour aller plus loin</legend>
        <p className="text-sm text-ink-soft">
          Facultatif. Ces éléments ne sont jamais publics : seuls les membres validés les voient, et seulement si vous
          choisissez de les partager.
        </p>

        <div className="space-y-4 rounded-abm-md border border-bordeaux-700/15 bg-white p-5">
          <Interrupteur
            nom="partagerContact"
            libelle="Partager le contact qui m’a aidé à obtenir ce stage"
            aide="Tuteur, recruteur, ancien… Il aide les plus jeunes à candidater au même endroit."
            defaultChecked={experience?.partagerContact}
            onChange={(partagerContact) => setAffichage((a) => ({ ...a, partagerContact }))}
            etat={etat}
          />
          <div hidden={!affichage.partagerContact} className="space-y-4 border-l-2 border-bordeaux-100 pl-4">
            <Champ
              nom="contactFonction"
              libelle="Fonction et organisme du contact"
              aide="Ex. « Directrice de cabinet, mairie du 11e ». Sans nom, ces informations ne permettent pas d’identifier la personne."
              maxLength={120}
              defaultValue={experience?.contactFonction}
              etat={etat}
            />
            <CaseACocher
              nom="contactAccord"
              libelle="Cette personne m’a donné son accord pour que je partage son nom et son moyen de contact."
              aide="Sans son accord, n’indiquez ni son nom ni ses coordonnées : ce sont ses données personnelles."
              defaultChecked={experience?.contactAccord}
              onChange={(contactAccord) => setAffichage((a) => ({ ...a, contactAccord }))}
              etat={etat}
            />
            <div hidden={!affichage.contactAccord} className="grid gap-4 sm:grid-cols-2">
              <Champ nom="contactNom" libelle="Nom du contact" maxLength={120} defaultValue={experience?.contactNom} etat={etat} />
              <Champ
                nom="contactMoyen"
                libelle="Comment le joindre"
                aide="E-mail, téléphone, LinkedIn… au choix."
                maxLength={200}
                defaultValue={experience?.contactMoyen}
                etat={etat}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-abm-md border border-bordeaux-700/15 bg-white p-5">
          <div>
            <label htmlFor="rapportFichier" className="block text-sm font-semibold text-ink">
              Rapport de stage (PDF)
            </label>
            {experience?.rapportFichier && (
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <a href={`/espace/rapports/${experience.id}`} className="inline-flex items-center gap-1 text-bordeaux-700 underline underline-offset-4">
                  <FileText size={15} aria-hidden /> Rapport actuel
                </a>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="retirerRapport" className="size-4 accent-bordeaux-700" />
                  Retirer le rapport
                </label>
              </div>
            )}
            <input
              id="rapportFichier"
              name="rapportFichier"
              type="file"
              accept="application/pdf,.pdf"
              aria-describedby="rapportFichier-aide"
              className="mt-2 block w-full text-sm file:mr-4 file:rounded-abm-sm file:border-0 file:bg-bordeaux-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-bordeaux-700"
            />
            <p id="rapportFichier-aide" className="mt-1 text-xs text-ink-soft">
              PDF uniquement, 10 Mo maximum.{experience?.rapportFichier && " Un nouveau fichier remplace l’actuel."} En cas
              d’erreur dans le formulaire, sélectionnez le fichier à nouveau.
            </p>
            {etat?.erreurs?.rapportFichier && <p className="mt-1 text-sm font-semibold text-bordeaux-500">{etat.erreurs.rapportFichier}</p>}
          </div>
          <Interrupteur
            nom="partagerRapport"
            libelle="Partager mon rapport avec les membres validés"
            aide="Sinon, il reste visible de vous seul (et du bureau)."
            defaultChecked={experience?.partagerRapport}
            etat={etat}
          />
        </div>
      </fieldset>

      {demanderMotif && <ChampMotif etat={etat} />}
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
