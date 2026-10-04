// Gabarit des pages d'information légale : sommaire (fixe sur grand écran) + sections.

import { PageHeader } from "@/components/ui";
import { dateLongue } from "@/lib/format";

export type SectionLegale = { id: string; titre: string; contenu: React.ReactNode };

export function PageLegale({
  titre,
  intro,
  miseAJour,
  sections,
}: {
  titre: string;
  intro?: string;
  miseAJour: Date;
  sections: SectionLegale[];
}) {
  return (
    <>
      <PageHeader eyebrow="Informations légales" title={titre} lead={intro} />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[240px_1fr] lg:py-20">
        <nav aria-label="Sommaire" className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-bordeaux-500">Sommaire</p>
          <ol className="mt-4 space-y-2 border-l border-bordeaux-700/15 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-ink-soft hover:border-bordeaux-700 hover:text-bordeaux-700">
                  {s.titre}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-ink-soft">Mise à jour : {dateLongue(miseAJour)}</p>
        </nav>

        <div className="max-w-[68ch] space-y-14">
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titre`}>
              <h2 id={`${s.id}-titre`} className="font-display text-2xl font-bold text-bordeaux-700">
                {s.titre}
              </h2>
              <div className="texte-legal mt-4 space-y-4 leading-relaxed text-ink">{s.contenu}</div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

/** Affiche une valeur, ou un repère « à compléter » bien visible si elle n'est pas encore connue. */
export function Valeur({ valeur, quoi }: { valeur: string | null | undefined; quoi: string }) {
  if (valeur) return <>{valeur}</>;
  return (
    <span className="rounded-abm-xs border border-dashed border-bordeaux-300 bg-white px-1.5 py-0.5 text-sm text-bordeaux-700">
      À compléter : {quoi}
    </span>
  );
}

/** Tableau simple pour les pages légales (ex. « qui voit quoi »). */
export function TableauLegal({ entetes, lignes }: { entetes: string[]; lignes: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-abm-md border border-bordeaux-700/15 bg-white">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-bordeaux-100/50">
          <tr>
            {entetes.map((e) => (
              <th key={e} scope="col" className="px-4 py-3 font-semibold text-bordeaux-800">
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bordeaux-700/10">
          {lignes.map((ligne, i) => (
            <tr key={i} className="align-top">
              {ligne.map((cellule, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold text-ink" : "text-ink-soft"}`}>
                  {cellule}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
