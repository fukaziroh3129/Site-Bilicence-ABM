"use client";

// Bouton « Partager » en bas d'un article : ouvre le partage du téléphone s'il existe, sinon copie l'adresse.

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { buttonClasses } from "@/components/ui";

export function BoutonPartager({ titre }: { titre: string }) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    const adresse = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titre, url: adresse });
      } catch {
        // Partage annulé par la personne : rien à faire.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(adresse);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      window.prompt("Copiez l’adresse de l’article :", adresse);
    }
  }

  return (
    <button type="button" onClick={partager} className={buttonClasses("outline", "petit")}>
      {copie ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
      <span role="status">{copie ? "Lien copié" : "Partager l’article"}</span>
    </button>
  );
}
