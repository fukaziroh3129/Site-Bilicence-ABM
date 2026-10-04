"use client";

// Formulaires des étapes « Vous », « Aujourd'hui » et « Votre carte » de l'assistant « Ma fiche ».
// Chacun n'envoie que ses propres champs (action enregistrerEtapeFiche), puis passe à l'étape suivante.

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { enregistrerEtapeFiche } from "@/actions/fiche";
import { BoutonEnvoyer, CaseACocher, CasesMultiples, Champ, Liste, MessageFormulaire, ZoneTexte } from "@/components/formulaire";
import type { Personne } from "@/generated/prisma/client";
import { LIBELLES_STATUT_ACTUEL, libellePromo, listePromos } from "@/lib/format";

const optionsStatut = Object.entries(LIBELLES_STATUT_ACTUEL).map(([valeur, libelle]) => ({ valeur, libelle }));

function Etape({
  etape,
  personneId,
  derniere = false,
  children,
}: {
  etape: "identite" | "aujourdhui" | "carte";
  personneId: string;
  derniere?: boolean;
  children: (etat: Parameters<typeof MessageFormulaire>[0]["etat"]) => React.ReactNode;
}) {
  const [etat, action] = useActionState(enregistrerEtapeFiche, null);
  return (
    <form action={action} className="space-y-8">
      <MessageFormulaire etat={etat} />
      <input type="hidden" name="etape" value={etape} />
      <input type="hidden" name="personneId" value={personneId} />
      {children(etat)}
      <div className="flex flex-wrap items-center gap-4 border-t border-bordeaux-700/10 pt-6">
        <BoutonEnvoyer>
          {derniere ? (
            "Enregistrer"
          ) : (
            <>
              Enregistrer et continuer <ArrowRight size={16} aria-hidden />
            </>
          )}
        </BoutonEnvoyer>
      </div>
    </form>
  );
}

export function EtapeIdentite({ personne }: { personne: Personne }) {
  return (
    <Etape etape="identite" personneId={personne.id}>
      {(etat) => (
        <>
          <fieldset className="space-y-5">
            <legend className="eyebrow text-bordeaux-500">Identité</legend>
            <div className="grid gap-5 sm:grid-cols-2">
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
              <Champ nom="ville" libelle="Ville où vous vivez" aide="Affichée en haut de votre carte." defaultValue={personne.ville} etat={etat} />
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="eyebrow text-bordeaux-500">Contacts</legend>
            <p className="text-sm text-ink-soft">
              Jamais publics. Activez « Visible des membres » pour les coordonnées que les membres connectés peuvent voir dans
              l’annuaire.
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
        </>
      )}
    </Etape>
  );
}

export function EtapeAujourdhui({
  personne,
  optionsDomaines,
  maxDomaines,
}: {
  personne: Personne;
  optionsDomaines: { valeur: string; libelle: string }[];
  maxDomaines: number;
}) {
  return (
    <Etape etape="aujourdhui" personneId={personne.id}>
      {(etat) => (
        <>
          <fieldset className="space-y-5">
            <legend className="eyebrow text-bordeaux-500">Votre situation</legend>
            <Liste
              nom="statutActuel"
              libelle="Situation"
              aide="L’étiquette affichée en haut de votre carte."
              options={optionsStatut}
              videLibelle="— Choisir —"
              defaultValue={personne.statutActuel}
              etat={etat}
            />
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
            <p className="text-xs text-ink-soft">Laissés vides, ces deux champs reprennent automatiquement votre formation en cours.</p>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="eyebrow text-bordeaux-500">Vos domaines ({maxDomaines} au maximum)</legend>
            <CasesMultiples nom="secteurs" libelle="Les domaines où vous travaillez ou vous formez" options={optionsDomaines} defaultValue={personne.secteurs} etat={etat} />
            <Champ
              nom="nouveauDomaine"
              libelle="Votre domaine n’est pas dans la liste ? Ajoutez-le"
              aide="Il apparaît tout de suite sur votre fiche, et dans les filtres une fois validé par le bureau."
              maxLength={60}
              etat={etat}
            />
          </fieldset>
        </>
      )}
    </Etape>
  );
}

export function EtapeCarte({ personne }: { personne: Personne }) {
  return (
    <Etape etape="carte" personneId={personne.id} derniere>
      {(etat) => (
        <>
          <fieldset className="space-y-5">
            <legend className="eyebrow text-bordeaux-500">En quelques mots</legend>
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
              aide="Ce que vous auriez aimé savoir en licence. 300 caractères maximum."
              rows={3}
              maxLength={300}
              defaultValue={personne.conseil}
              etat={etat}
            />
          </fieldset>

          <fieldset className="space-y-3 rounded-abm-md border border-bordeaux-700/15 bg-white p-5">
            <legend className="eyebrow px-1 text-bordeaux-500">Page publique « Que sont-ils devenus ? »</legend>
            <p className="text-sm text-ink-soft">
              Cette page, visible sans compte, présente une carte par personne&nbsp;: prénom, nom, promotion, situation, poste ou
              formation actuelle et structure, ville, domaines, formations suivies, présentation et conseil, vos Erasmus
              (université, pays, période, descriptif) et vos expériences (type, poste, structure et résumé). Jamais vos
              coordonnées, le détail de vos stages, vos rapports ni vos contacts. Rien n’y apparaît sans accord explicite.
            </p>
            <CaseACocher
              nom="consentementPublic"
              libelle="J’accepte d’apparaître sur la page publique « Que sont-ils devenus ? ». Je peux retirer mon accord à tout moment."
              defaultChecked={personne.consentementPublic}
              etat={etat}
            />
          </fieldset>
        </>
      )}
    </Etape>
  );
}
