import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CarteFormulaire, classeLien } from "@/components/ui";
import { obtenirSession } from "@/lib/session";
import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = { title: "Connexion" };

export default async function Connexion({ searchParams }: PageProps<"/connexion">) {
  if (await obtenirSession()) redirect("/espace");
  const { suite, reinitialise } = await searchParams;

  return (
    <CarteFormulaire
      titre="Connexion à l’espace membres"
      intro={
        <>
          Pas encore membre&nbsp;?{" "}
          <Link href="/adhesion" className={classeLien}>
            Adhérer
          </Link>
        </>
      }
    >
      {reinitialise && (
        <p className="mb-4 text-sm font-semibold text-bordeaux-700">
          Votre mot de passe a été modifié. Vous pouvez vous connecter.
        </p>
      )}
      <FormulaireConnexion suite={typeof suite === "string" ? suite : "/espace"} />
    </CarteFormulaire>
  );
}
