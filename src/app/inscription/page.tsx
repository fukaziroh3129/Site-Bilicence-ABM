import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CarteFormulaire, classeLien } from "@/components/ui";
import { obtenirSession } from "@/lib/session";
import { FormulaireInscription } from "./formulaire";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function Inscription() {
  if (await obtenirSession()) redirect("/espace");

  return (
    <CarteFormulaire
      titre="Créer un compte"
      intro={
        <>
          L’espace membres est réservé aux étudiants et diplômés de la bi-licence. Chaque compte est
          validé par le bureau. Déjà inscrit&nbsp;?{" "}
          <Link href="/connexion" className={classeLien}>
            Se connecter
          </Link>
        </>
      }
    >
      <FormulaireInscription />
    </CarteFormulaire>
  );
}
