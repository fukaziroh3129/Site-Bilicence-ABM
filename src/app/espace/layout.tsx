import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { deconnecter } from "@/actions/compte";
import { DialogueRestreint } from "@/components/dialogue-restreint";
import { NavDeroulante } from "@/components/nav-deroulante";
import { estDuBureau } from "@/lib/roles";
import { exigerCompte } from "@/lib/session";
import { navigationMembres } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Espace membres", template: "%s — Espace membres ABM" },
  robots: { index: false },
};

export default async function LayoutEspace({ children }: LayoutProps<"/espace">) {
  // Les comptes en attente entrent aussi : ils peuvent remplir leur fiche et gérer leur compte.
  // Chaque page réservée aux membres validés appelle exigerMembreActif().
  const { user } = await exigerCompte();
  const enAttente = user.statut !== "ACTIF";
  const entrees =
    estDuBureau(user.role) && !enAttente
      ? [...navigationMembres, { href: "/admin", label: "Administration", icone: "admin" }]
      : navigationMembres;

  return (
    <>
      <div className="border-b border-bordeaux-700/20 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="min-w-0 flex-1">
            <NavDeroulante
              entrees={entrees}
              racine="/espace"
              libelle="Navigation de l’espace membres"
              titre="Espace membres"
              enAttente={enAttente}
            />
          </div>
          <form action={deconnecter}>
            <button type="submit" className="flex items-center gap-1 py-3 text-sm text-ink-soft hover:text-bordeaux-700">
              <LogOut size={16} aria-hidden />
              <span className="hidden sm:inline">Se déconnecter</span>
              <span className="sr-only sm:hidden">Se déconnecter</span>
            </button>
          </form>
        </div>
      </div>
      {enAttente && (
        <Suspense fallback={null}>
          <DialogueRestreint />
        </Suspense>
      )}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">{children}</div>
    </>
  );
}
