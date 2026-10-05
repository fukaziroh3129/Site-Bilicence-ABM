"use client";

// Menu ☰, affiché en dessous de 1 024 px. Sur tablette, le bouton « Espace membres / Adhérer » reste à côté
// (src/components/bouton-membres.tsx) ; sur téléphone, ses deux choix sont empilés en bas du menu.

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui";
import { navigationEntete } from "@/lib/site";

export function MobileMenu() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        className="flex items-center gap-2 p-2 text-bordeaux-700"
      >
        {ouvert ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        <span className="sr-only">{ouvert ? "Fermer le menu" : "Ouvrir le menu"}</span>
      </button>

      {ouvert && (
        <nav
          id="menu-mobile"
          aria-label="Navigation principale"
          className="absolute inset-x-0 top-full z-10 border-b border-bordeaux-700/20 bg-paper shadow-abm-card"
        >
          <ul className="px-4 py-2">
            {navigationEntete.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOuvert(false)}
                  className="eyebrow block py-3 text-ink hover:text-bordeaux-500"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 grid gap-2.5 border-t border-bordeaux-700/15 pt-4 pb-2 md:hidden">
              <Link href="/espace" onClick={() => setOuvert(false)} className={`${buttonClasses("primary")} w-full`}>
                Espace membres
              </Link>
              <Link href="/adhesion" onClick={() => setOuvert(false)} className={`${buttonClasses("outline")} w-full`}>
                Adhérer
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
