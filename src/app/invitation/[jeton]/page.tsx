import type { Metadata } from "next";
import Link from "next/link";
import { CarteFormulaire, classeLien } from "@/components/ui";
import { libellePromo } from "@/lib/format";
import { trouverInvitation } from "@/lib/invitations";
import { FormulaireActivation } from "./formulaire";

export const metadata: Metadata = { title: "Activer mon compte", robots: { index: false } };

// Lien reçu par e-mail par une personne dont le bureau a préparé le compte (pré-compte, ADM-04).
export default async function Invitation({ params }: PageProps<"/invitation/[jeton]">) {
  const { jeton } = await params;
  const invitation = await trouverInvitation(jeton);

  if (!invitation) {
    return (
      <CarteFormulaire titre="Lien expiré">
        <p className="text-sm">
          Ce lien d’invitation n’est plus valable (il expire au bout de 30 jours, ou quand un nouveau lien a été envoyé).
          Pour en recevoir un nouveau, indiquez votre adresse sur la page{" "}
          <Link href="/mot-de-passe-oublie" className={classeLien}>
            Mot de passe oublié
          </Link>
          , ou écrivez au bureau depuis la page{" "}
          <Link href="/contact" className={classeLien}>
            Contact
          </Link>
          .
        </p>
      </CarteFormulaire>
    );
  }

  const { user } = invitation;
  const personne = user.personne;

  return (
    <CarteFormulaire titre={`Bienvenue, ${user.prenom}`}>
      <div className="space-y-4 text-sm">
        <p>
          Le bureau vous a préparé un compte à partir de la base de suivi des poursuites d’études de la bi-licence, dans
          laquelle vous aviez accepté de figurer. Voici ce qu’il contient :
        </p>
        <ul className="list-inside list-disc space-y-1 rounded-abm-sm border border-bordeaux-700/15 bg-white px-4 py-3">
          <li>
            {user.prenom} {user.nom} · {user.email}
          </li>
          {personne && <li>Promotion {libellePromo(personne.promoEntree)}</li>}
          {personne?.formations.map((f) => (
            <li key={f.id}>
              {f.intitule}, {f.etablissement}
            </li>
          ))}
        </ul>
        <p className="text-ink-soft">
          Votre fiche est visible uniquement des membres connectés ; elle n’apparaît sur les pages publiques que si vous
          l’acceptez. Une fois connecté, vous pourrez la compléter ou la corriger (« Ma fiche »), ou supprimer votre
          compte et vos données (« Mon compte »). Vous ne souhaitez pas de compte ?{" "}
          <Link href="/contact" className={classeLien}>
            Demandez la suppression de vos données
          </Link>
          .
        </p>
      </div>
      <div className="mt-6">
        <FormulaireActivation jeton={jeton} email={user.email} />
      </div>
    </CarteFormulaire>
  );
}
