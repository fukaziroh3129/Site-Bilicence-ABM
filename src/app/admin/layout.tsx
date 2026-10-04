import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NavDeroulante } from "@/components/nav-deroulante";
import { estAdministrateur } from "@/lib/roles";
import { exigerBureau } from "@/lib/session";
import { navigationAdmin, type EntreeMenu } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s — Administration ABM" },
  robots: { index: false },
};

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const { user } = await exigerBureau();
  // Les animateurs ne voient pas les liens réservés aux administrateurs (un groupe vidé disparaît).
  const admin = estAdministrateur(user.role);
  const entrees: EntreeMenu[] = navigationAdmin.flatMap((e): EntreeMenu[] => {
    if (!("liens" in e)) return !e.admin || admin ? [e] : [];
    const liens = e.liens.filter((l) => !l.admin || admin);
    return liens.length > 0 ? [{ ...e, liens }] : [];
  });

  return (
    <>
      <div className="border-b border-bordeaux-700/20 bg-bordeaux-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="min-w-0 flex-1">
            <NavDeroulante entrees={entrees} racine="/admin" libelle="Navigation de l’administration" titre="Administration" />
          </div>
          <Link href="/espace" className="flex items-center gap-1 py-3 text-sm text-ink-soft hover:text-bordeaux-700">
            <ArrowLeft size={16} aria-hidden />
            <span className="hidden sm:inline">Espace membres</span>
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">{children}</div>
    </>
  );
}
