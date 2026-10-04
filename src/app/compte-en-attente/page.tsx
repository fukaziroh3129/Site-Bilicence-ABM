import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deconnecter } from "@/actions/compte";
import { CarteFormulaire, buttonClasses } from "@/components/ui";
import { exigerConnexion } from "@/lib/session";
import { FormulaireSuppression } from "../espace/compte/formulaires";

export const metadata: Metadata = { title: "Compte en attente" };

export default async function CompteEnAttente() {
  const { user } = await exigerConnexion();
  // Les comptes en attente ont leur accueil dans l'espace membres (ils peuvent remplir leur fiche).
  if (user.statut !== "REFUSE") redirect("/espace");

  return (
    <CarteFormulaire titre={user.statut === "REFUSE" ? "Compte non validé" : "Compte en attente de validation"}>
      {user.statut === "REFUSE" ? (
        <p>
          Le bureau n’a pas validé ce compte. S’il s’agit d’une erreur, contactez l’association.
        </p>
      ) : (
        <p>
          Merci {user.prenom}, votre adresse e-mail est confirmée. Le bureau doit encore valider votre
          compte&nbsp;: vous recevrez un e-mail dès que ce sera fait.
        </p>
      )}
      <form action={deconnecter} className="mt-6">
        <button type="submit" className={buttonClasses("primary")}>
          Se déconnecter
        </button>
      </form>
      <details className="mt-8 text-sm">
        <summary className="cursor-pointer text-ink-soft">Supprimer ma demande et mon compte</summary>
        <div className="mt-4">
          <FormulaireSuppression />
        </div>
      </details>
    </CarteFormulaire>
  );
}
