// Messages laissés par le bureau quand il a modifié la fiche (patch ADM-02), en tête de « Ma fiche ».
// Les messages non lus sont mis en avant ; les anciens restent consultables.

import { MessageSquareText } from "lucide-react";
import { marquerNotesLues } from "@/actions/fiche";
import { buttonClasses } from "@/components/ui";
import type { NoteModification } from "@/generated/prisma/client";
import { dateCourte } from "@/lib/format";

function Note({ n }: { n: NoteModification }) {
  return (
    <li className="py-3">
      <p className="font-semibold text-ink">{n.objet}</p>
      <p className="mt-1 whitespace-pre-line text-ink">{n.motif}</p>
      <p className="mt-1 text-xs text-ink-soft">
        {n.auteurNom}, pour le bureau, le {dateCourte(n.creeLe)}
      </p>
    </li>
  );
}

export function NotesBureau({ notes }: { notes: NoteModification[] }) {
  if (notes.length === 0) return null;
  const nonLues = notes.filter((n) => !n.lueLe);
  const lues = notes.filter((n) => n.lueLe);

  return (
    <section
      aria-labelledby="notes-bureau"
      className={nonLues.length ? "rounded-abm-lg border border-bordeaux-700/30 bg-white p-6 shadow-abm-card" : "text-sm"}
    >
      {nonLues.length > 0 && (
        <>
          <h2 id="notes-bureau" className="flex items-center gap-2 font-display text-xl font-bold text-bordeaux-700">
            <MessageSquareText size={20} aria-hidden />
            Le bureau a modifié votre fiche
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Voici ce qui a été changé et pourquoi. Vous pouvez corriger votre fiche à tout moment, ou répondre au bureau
            par la page Contact.
          </p>
          <ul className="mt-2 divide-y divide-bordeaux-700/10 text-sm">
            {nonLues.map((n) => (
              <Note key={n.id} n={n} />
            ))}
          </ul>
          <form action={marquerNotesLues} className="mt-3">
            <button type="submit" className={buttonClasses("primary")}>
              J’ai pris connaissance
            </button>
          </form>
        </>
      )}
      {lues.length > 0 && (
        <details className={nonLues.length ? "mt-4 text-sm" : ""}>
          <summary id={nonLues.length ? undefined : "notes-bureau"} className="cursor-pointer text-ink-soft hover:text-bordeaux-700">
            Modifications précédentes par le bureau ({lues.length})
          </summary>
          <ul className="mt-2 divide-y divide-bordeaux-700/10">
            {lues.map((n) => (
              <Note key={n.id} n={n} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
