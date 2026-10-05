"use client";

import { useEffect, useRef, useState } from "react";

/** Seule origine dont on accepte les messages. */
const ORIGINE = "https://www.helloasso.com";

/**
 * Boutique HelloAsso intégrée. Le widget envoie sa hauteur par message pour que le cadre s'agrandisse et
 * n'affiche pas de barre de défilement : version sûre du code fourni par HelloAsso (messages acceptés seulement
 * de helloasso.com et de CE cadre, hauteur bornée).
 */
export function WidgetHelloAsso({ src, titre, hauteur = 750 }: { src: string; titre: string; hauteur?: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [hauteurCadre, setHauteurCadre] = useState(hauteur);

  useEffect(() => {
    function recevoir(e: MessageEvent) {
      if (e.origin !== ORIGINE || e.source !== ref.current?.contentWindow) return;
      const h = Number((e.data as { height?: unknown } | null)?.height);
      if (Number.isFinite(h) && h > 0 && h < 10000) setHauteurCadre((actuelle) => Math.max(actuelle, Math.ceil(h)));
    }
    window.addEventListener("message", recevoir);
    return () => window.removeEventListener("message", recevoir);
  }, []);

  return (
    <iframe
      ref={ref}
      src={src}
      title={titre}
      // Autorisation de paiement transmise au widget et à la plateforme de paiement de HelloAsso (code fourni par HelloAsso).
      allow="payment 'src' https://www.helloasso.com https://helloasso.com https://paymenthub.helloassopay.com"
      loading="lazy"
      style={{ height: hauteurCadre }}
      className="block w-full border-0 bg-white"
    />
  );
}
