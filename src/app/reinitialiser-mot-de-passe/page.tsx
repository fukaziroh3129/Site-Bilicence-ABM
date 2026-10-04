import type { Metadata } from "next";
import Link from "next/link";
import { CarteFormulaire, classeLien } from "@/components/ui";
import { FormulaireReinitialisation } from "./formulaire";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ReinitialiserMotDePasse({ searchParams }: PageProps<"/reinitialiser-mot-de-passe">) {
  const { token, error } = await searchParams;

  return (
    <CarteFormulaire titre="Choisir un nouveau mot de passe">
      {error || typeof token !== "string" ? (
        <p className="text-sm">
          Ce lien n’est plus valable.{" "}
          <Link href="/mot-de-passe-oublie" className={classeLien}>
            Faire une nouvelle demande
          </Link>
        </p>
      ) : (
        <FormulaireReinitialisation token={token} />
      )}
    </CarteFormulaire>
  );
}
