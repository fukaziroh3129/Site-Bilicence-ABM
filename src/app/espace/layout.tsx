import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { deconnecter } from "@/actions/compte";
import { DialogueRestreint } from "@/components/dialogue-restreint";
import { NavDeroulante } from "@/components/nav-deroulante";
import { estPersonnel } from "@/lib/profils";
import { estDuBureau } from "@/lib/roles";
import { exigerCompte } from "@/lib/session";
import { navigationMembres, type EntreeMenu } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Espace membres", template: "%s — Espace membres ABM" },
  robots: { index: false },
};

export default async function LayoutEspace({ children }: LayoutProps<"/espace">) {
  // Les comptes en attente entrent aussi : ils peuvent remplir leur fiche et gérer leur compte.
  // Chaque page réservée aux membres validés appelle exigerMembreActif().
  const { user } = await exigerCompte();
  const enAttente = user.statut !== "ACTIF";
  // Le personnel de l'université n'a pas de fiche : pas de lien « Ma fiche ».
  const rubriques: EntreeMenu[] = estPersonnel(user)
    ? navigationMembres.map((e) => ("liens" in e ? { ...e, liens: e.liens.filter((l) => l.href !== "/espace/ma-fiche") } : e))
    : [...navigationMembres];
  // Drive des cours : adresse gardée hors du code public (variable LIEN_DRIVE) et donnée aux seuls
  // membres validés, placée avant « Mon profil ».
  const lienDrive = process.env.LIEN_DRIVE;
  if (lienDrive && !enAttente) {
    rubriques.splice(rubriques.length - 1, 0, { href: lienDrive, label: "Drive", icone: "drive", externe: true });
  }
  const entrees =
    estDuBureau(user.role) && !enAttente ? [...rubriques, { href: "/admin", label: "Administration", icone: "admin" }] : rubriques;

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
