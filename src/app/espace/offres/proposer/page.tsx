import { FormulaireOffre } from "@/components/formulaire-offre";
import { FilAriane, Panneau } from "@/components/ui";
import { estDuBureau } from "@/lib/roles";
import { exigerMembreActif } from "@/lib/session";

export const metadata = { title: "Proposer une offre" };

const ETAPES = [
  { titre: "Vous proposez", texte: "L’offre arrive dans la liste du bureau." },
  { titre: "Le bureau relit", texte: "Il la publie, ou la refuse si elle ne convient pas au réseau." },
  { titre: "Les membres sont prévenus", texte: "Un e-mail part à tout le réseau dès la publication." },
];

export default async function ProposerOffre() {
  const { user } = await exigerMembreActif();
  const direct = estDuBureau(user.role);

  return (
    <div className="-mt-4 space-y-6">
      <FilAriane retour={{ href: "/espace/offres", libelle: "Offres" }} ici="Proposer une offre" />
      <div>
        <h1 className="font-display text-3xl font-bold text-bordeaux-700 sm:text-4xl">Proposer une offre</h1>
        <p className="mt-2 max-w-[62ch] text-ink-soft">
          {direct
            ? "Vous êtes membre du bureau : votre offre sera publiée directement et les membres prévenus par e-mail."
            : "Un stage, une alternance ou un emploi qui pourrait intéresser le réseau."}
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-8">
          <FormulaireOffre publicationDirecte={direct} />
        </div>
        {!direct && (
          <aside className="lg:sticky lg:top-28">
            <Panneau titre="Comment ça marche">
              <ol className="space-y-4">
                {ETAPES.map((e, i) => (
                  <li key={e.titre} className="flex gap-3 text-sm text-ink-soft">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-bordeaux-100 font-bold text-bordeaux-700">{i + 1}</span>
                    <span>
                      <b className="block text-ink">{e.titre}</b>
                      {e.texte}
                    </span>
                  </li>
                ))}
              </ol>
            </Panneau>
          </aside>
        )}
      </div>
    </div>
  );
}
