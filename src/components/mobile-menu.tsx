"use client";

// Menu déroulant affiché uniquement sur petit écran (téléphone).

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { navigation } from "@/lib/site";

export function MobileMenu() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="xl:hidden">
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
            {navigation.map((item) => (
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
            <li>
              <Link
                href="/espace"
                onClick={() => setOuvert(false)}
                className="eyebrow block py-3 font-bold text-bordeaux-700"
              >
                Espace membres
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
