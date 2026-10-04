"use client";

// Lien de la navigation principale : soulignement animé, maintenu sur la page en cours.

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LienNav({ href, children }: { href: string; children: React.ReactNode }) {
  const chemin = usePathname();
  const actif = chemin === href || chemin.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className="lien-anime eyebrow whitespace-nowrap text-ink hover:text-bordeaux-700 aria-[current=page]:text-bordeaux-700"
    >
      {children}
    </Link>
  );
}
