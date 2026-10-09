"use client";

import { useActionState } from "react";
import { modifierInfos } from "@/actions/fiche";
import { ChampMotif } from "@/components/fiche/champ-motif";
import { BoutonEnvoyer, CaseACocher, CasesMultiples, Champ, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import type { Personne } from "@/generated/prisma/client";
import { LIBELLES_STATUT_ACTUEL, libellePromo, listePromos } from "@/lib/format";

const optionsStatut = Object.entries(LIBELLES_STATUT_ACTUEL).map(([valeur, libelle]) => ({ valeur, libelle }));

export function FormulaireInfos({
  personne,
  pourAutrui,
  demanderMotif = false,
  optionsDomaines,
  maxDomaines,
}: {
  personne: Personne;
  pourAutrui: boolean;
  /** Le bureau modifie la fiche d'un membre : motif obligatoire (ADM-02). */
  demanderMotif?: boolean;
  optionsDomaines: { valeur: string; libelle: string; groupe?: string }[];
  maxDomaines: number;
}) {
  const [etat, action] = useActionState(modifierInfos, null);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="personneId" value={personne.id} />

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">Identité</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <Champ nom="prenom" libelle="Prénom" requis defaultValue={personne.prenom} etat={etat} />
          <Champ nom="nom" libelle="Nom" requis defaultValue={personne.nom} etat={etat} />
          <Liste
            nom="promoEntree"
            libelle="Promotion"
            requis
            defaultValue={personne.promoEntree}
            options={listePromos().map((a) => ({ valeur: String(a), libelle: libellePromo(a) }))}
            etat={etat}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">Aujourd’hui</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Liste
            nom="statutActuel"
            libelle="Situation"
            aide="L’étiquette affichée en haut de votre carte."
            options={optionsStatut}
            videLibelle="— Choisir —"
            defaultValue={personne.statutActuel}
            etat={etat}
          />
          <Champ nom="ville" libelle="Ville" defaultValue={personne.ville} etat={etat} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ
            nom="situationActuelle"
            libelle="Poste ou formation actuelle"
            aide="Ex. « Chargée de mission Europe » ou « Master 2 Affaires publiques ». En alternance : le poste."
            maxLength={120}
            defaultValue={personne.situationActuelle}
            etat={etat}
          />
          <Champ
            nom="structureActuelle"
            libelle="Structure ou établissement"
            aide="Ex. « Région Occitanie » ou « Sciences Po Lyon »."
            maxLength={120}
            defaultValue={personne.structureActuelle}
            etat={etat}
          />
        </div>
        <p className="text-xs text-ink-soft">
          Laissés vides, ces deux champs reprennent automatiquement votre formation en cours.
        </p>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">Domaines ({maxDomaines} au maximum)</legend>
        <CasesMultiples nom="secteurs" libelle="Vos domaines" options={optionsDomaines} defaultValue={personne.secteurs} etat={etat} />
        <Champ
          nom="nouveauDomaine"
          libelle="Votre domaine n’est pas dans la liste ? Proposez-le"
          aide="Il apparaît tout de suite sur votre fiche, et dans les filtres une fois validé par le bureau."
          maxLength={60}
          etat={etat}
        />
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">Votre carte « Que sont-ils devenus ? »</legend>
        <ZoneTexte
          nom="presentation"
          libelle="Présentation en une ou deux phrases"
          aide="Ce que vous faites, ce qui vous anime. 200 caractères maximum."
          rows={2}
          maxLength={200}
          defaultValue={personne.presentation}
          etat={etat}
        />
        <ZoneTexte
          nom="conseil"
          libelle="Votre conseil aux étudiants de la bi-licence"
          aide="Facultatif. 300 caractères maximum."
          rows={3}
          maxLength={300}
          defaultValue={personne.conseil}
          etat={etat}
        />
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow text-bordeaux-500">Contacts</legend>
        <p className="text-sm text-ink-soft">
          Ces coordonnées ne sont jamais publiques. Cochez celles que les membres connectés peuvent voir
          dans l’annuaire.
        </p>
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <Champ nom="linkedin" libelle="Profil LinkedIn" type="url" placeholder="https://www.linkedin.com/in/…" defaultValue={personne.linkedin} etat={etat} />
          <CaseACocher nom="afficherLinkedin" libelle="Visible des membres" defaultChecked={personne.afficherLinkedin} etat={etat} />
          <Champ nom="emailContact" libelle="E-mail de contact" type="email" defaultValue={personne.emailContact} etat={etat} />
          <CaseACocher nom="afficherEmail" libelle="Visible des membres" defaultChecked={personne.afficherEmail} etat={etat} />
          <Champ nom="telephone" libelle="Téléphone" type="tel" defaultValue={personne.telephone} etat={etat} />
          <CaseACocher nom="afficherTelephone" libelle="Visible des membres" defaultChecked={personne.afficherTelephone} etat={etat} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="eyebrow text-bordeaux-500">Page publique « Que sont-ils devenus ? »</legend>
        <p className="text-sm text-ink-soft">
          Cette page, visible sans compte, présente une carte par personne&nbsp;: prénom, nom, promotion,
          situation, poste ou formation actuelle et structure, ville, domaines, formations suivies,
          présentation et conseil, vos Erasmus (université, pays, période, descriptif) et vos expériences (type, poste, structure et résumé).
          Jamais vos coordonnées, le détail de vos stages, vos rapports ni vos contacts.
          Rien n’y apparaît sans accord explicite.
        </p>
        <CaseACocher
          nom="consentementPublic"
          libelle={
            pourAutrui
              ? "La personne a donné son accord pour apparaître sur la page publique « Que sont-ils devenus ? »."
              : "J’accepte d’apparaître sur la page publique « Que sont-ils devenus ? ». Je peux retirer mon accord à tout moment."
          }
          defaultChecked={personne.consentementPublic}
          etat={etat}
        />
      </fieldset>

      <MessageFormulaire etat={etat} />
      {demanderMotif && <ChampMotif etat={etat} />}
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
