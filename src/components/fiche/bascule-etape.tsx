// Interrupteur des étapes à liste de « Ma fiche » : « Je suis encore en bi-licence », « Je n'ai pas
// encore fait de stage ni d'expérience », « Je n'ai pas fait d'Erasmus ». Un simple formulaire (sans
// JavaScript) : un clic enregistre l'inverse de l'état actuel et revient sur l'étape.

import { basculerEtapeSansElement } from "@/actions/fiche";

export function BasculeEtape({
  personneId,
  etape,
  active,
  titre,
  aide,
}: {
  personneId: string;
  etape: "etudes" | "experiences" | "erasmus";
  active: boolean;
  titre: string;
  aide: string;
}) {
  return (
    <form action={basculerEtapeSansElement}>
      <input type="hidden" name="personneId" value={personneId} />
      <input type="hidden" name="etape" value={etape} />
      {!active && <input type="hidden" name="valeur" value="on" />}
      <button
        type="submit"
        role="switch"
        aria-checked={active}
        className={`flex w-full items-center gap-4 rounded-abm-md border px-4 py-3 text-left transition-colors duration-200 ${
          active ? "border-bordeaux-700/40 bg-bordeaux-100" : "border-bordeaux-700/15 bg-bordeaux-100/50 hover:bg-bordeaux-100"
        }`}
      >
        <span
          aria-hidden
          className={`relative h-6 w-11 shrink-0 rounded-abm-pill border transition-colors duration-200 ${
            active ? "border-bordeaux-700 bg-bordeaux-700" : "border-bordeaux-700/35 bg-white"
          }`}
        >
          <span
            className={`absolute top-[3px] size-4 rounded-abm-pill transition-transform duration-200 ${
              active ? "translate-x-[22px] bg-white" : "translate-x-[3px] bg-bordeaux-400"
            }`}
          />
        </span>
        <span>
          <span className="block font-semibold text-bordeaux-700">{titre}</span>
          <span className="block text-sm text-ink-soft">{aide}</span>
        </span>
      </button>
    </form>
  );
}
