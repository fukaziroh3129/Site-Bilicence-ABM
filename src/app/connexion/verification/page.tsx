// Connexion, 2e étape pour les comptes qui ont activé la double authentification (« Mon compte ») :
// le mot de passe a été accepté, il reste à saisir le code de l'application d'authentification.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CarteFormulaire, classeLien } from "@/components/ui";
import { obtenirSession } from "@/lib/session";
import { FormulaireCode } from "./formulaire";

export const metadata: Metadata = { title: "Vérification de connexion", robots: { index: false } };

export default async function VerificationConnexion({ searchParams }: PageProps<"/connexion/verification">) {
  if (await obtenirSession()) redirect("/espace");
  const { suite } = await searchParams;

  return (
    <CarteFormulaire
      titre="Vérification en deux étapes"
      intro="Ouvrez votre application d’authentification et saisissez le code à 6 chiffres affiché pour « ABM »."
    >
      <FormulaireCode suite={typeof suite === "string" ? suite : "/espace"} />
      <p className="mt-6 text-sm text-ink-soft">
        Téléphone perdu&nbsp;? Cochez « J’utilise un code de secours » et saisissez l’un des codes notés à l’activation. Sinon,{" "}
        <Link href="/contact" className={classeLien}>
          contactez le bureau
        </Link>
        .
      </p>
    </CarteFormulaire>
  );
}
