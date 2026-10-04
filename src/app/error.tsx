"use client";

// Affichée si une erreur inattendue survient sur une page (la page ne plante pas entièrement).

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { buttonClasses, classeLien } from "@/components/ui";

export default function Erreur({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-impact text-6xl text-bordeaux-700">Oups</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-bordeaux-700">Une erreur est survenue</h1>
      <p className="mt-4 text-ink-soft">
        Le problème vient de notre côté. Réessayez dans un instant ; s’il persiste,{" "}
        <Link href="/contact" className={classeLien}>
          prévenez le bureau
        </Link>
        {error.digest ? ` en indiquant le code ${error.digest}` : ""}.
      </p>
      <button type="button" onClick={reset} className={`${buttonClasses("primary")} mt-10`}>
        <RotateCcw size={16} aria-hidden /> Réessayer
      </button>
    </div>
  );
}
