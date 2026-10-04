"use client";

// Petit bouton « Supprimer » avec demande de confirmation, relié à une action serveur.
// `demanderMotif` : le bureau supprime un élément de la fiche d'un membre ; le motif (ADM-02) est
// demandé dans une petite fenêtre et transmis à la personne. Sans motif, rien n'est supprimé.

import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

const CHAMP_MOTIF = "motifModification";

function Bouton({ libelle, confirmation, demanderMotif }: { libelle: string; confirmation: string; demanderMotif: boolean }) {
  const { pending } = useFormStatus();
  const motif = useRef<HTMLInputElement>(null);
  return (
    <>
      {demanderMotif && <input ref={motif} type="hidden" name={CHAMP_MOTIF} />}
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (demanderMotif) {
            const saisi = window.prompt(`${confirmation}\n\nMotif de la suppression (transmis à la personne) :`)?.trim();
            if (!saisi || saisi.length < 5) {
              e.preventDefault();
              if (saisi !== undefined) window.alert("Indiquez un motif de quelques mots : rien n’a été supprimé.");
              return;
            }
            if (motif.current) motif.current.value = saisi.slice(0, 500);
          } else if (!window.confirm(confirmation)) {
            e.preventDefault();
          }
        }}
        className="inline-flex min-h-6 items-center gap-1 py-1 text-sm text-bordeaux-500 underline-offset-4 hover:underline disabled:opacity-40"
      >
        <Trash2 size={14} aria-hidden />
        {pending ? "Suppression…" : libelle}
      </button>
    </>
  );
}

export function BoutonSupprimer({
  action,
  champs,
  libelle = "Supprimer",
  confirmation = "Confirmer la suppression ? Cette action est définitive.",
  demanderMotif = false,
}: {
  action: (formData: FormData) => Promise<void>;
  champs: Record<string, string>;
  libelle?: string;
  confirmation?: string;
  demanderMotif?: boolean;
}) {
  return (
    <form action={action} className="inline">
      {Object.entries(champs).map(([nom, valeur]) => (
        <input key={nom} type="hidden" name={nom} value={valeur} />
      ))}
      <Bouton libelle={libelle} confirmation={confirmation} demanderMotif={demanderMotif} />
    </form>
  );
}
