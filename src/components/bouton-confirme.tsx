"use client";

// Bouton d'envoi d'un petit formulaire, avec confirmation facultative (changement de rôle, transfert…).

import { useFormStatus } from "react-dom";

export function BoutonConfirme({ children, confirmation, classe }: { children: React.ReactNode; confirmation?: string; classe: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmation && !window.confirm(confirmation)) e.preventDefault();
      }}
      className={`${classe} disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
