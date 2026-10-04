"use client";

// Archive des stages : filtres instantanés. Chaque ligne est préparée par la page (serveur),
// avec sa fenêtre de détail ; ici on ne fait que choisir lesquelles afficher.

import { useMemo, useState } from "react";
import { Vide, buttonClasses } from "@/components/ui";
import { CadreFiltres, ChampRecherche, ListeChoix, NombreResultats, PastillesChoix, useFiltresDansAdresse } from "@/components/filtres-instantanes";
import { correspond } from "@/lib/format";

export type LigneStage = { id: string; texte: string; secteurs: string[]; niveau: string | null; noeud: React.ReactNode };

type Filtres = { q: string; domaine: string; niveau: string };

export function StagesInteractifs({
  lignes,
  domaines,
  niveaux,
  initial,
}: {
  lignes: LigneStage[];
  domaines: { valeur: string; libelle: string }[];
  niveaux: { valeur: string; libelle: string }[];
  initial: Filtres;
}) {
  const [f, setF] = useState<Filtres>(initial);
  const maj = (partiel: Partial<Filtres>) => setF((avant) => ({ ...avant, ...partiel }));
  useFiltresDansAdresse({ q: f.q, secteur: f.domaine, niveau: f.niveau });

  const resultats = useMemo(
    () =>
      lignes.filter(
        (l) => (!f.domaine || l.secteurs.includes(f.domaine)) && (!f.niveau || l.niveau === f.niveau) && correspond(f.q, [l.texte]),
      ),
    [lignes, f],
  );
  const actifs = !!(f.q || f.domaine || f.niveau);
  const effacer = () => maj({ q: "", domaine: "", niveau: "" });

  return (
    <div className="space-y-6">
      <CadreFiltres
        label="Rechercher un stage"
        pied={<NombreResultats nombre={resultats.length} singulier="stage" pluriel="stages" actifs={actifs} onEffacer={effacer} />}
      >
        <div className="flex flex-wrap gap-3">
          <ChampRecherche valeur={f.q} onChange={(q) => maj({ q })} label="Rechercher un stage" placeholder="Ex. ministère, banque, Bruxelles…" />
          <ListeChoix label="Domaine" tous="Tous les domaines" valeur={f.domaine} onChange={(domaine) => maj({ domaine })} options={domaines} />
        </div>
        <PastillesChoix
          label="Effectué en"
          valeur={f.niveau}
          onChange={(niveau) => maj({ niveau })}
          options={[
            { valeur: "", libelle: "Licence et master", nombre: lignes.length },
            ...niveaux.map((n) => ({ ...n, nombre: lignes.filter((l) => l.niveau === n.valeur).length })),
          ]}
        />
      </CadreFiltres>

      {resultats.length === 0 ? (
        <div className="rounded-abm-lg border border-dashed border-bordeaux-300 bg-white">
          <Vide>Aucun stage ne correspond. La recherche porte sur les structures, postes, villes, missions, domaines et auteurs.</Vide>
          {actifs && (
            <div className="-mt-4 pb-8 text-center">
              <button type="button" onClick={effacer} className={buttonClasses("outline", "petit")}>
                Effacer les filtres
              </button>
            </div>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-bordeaux-700/10 overflow-hidden rounded-abm-lg border border-bordeaux-700/15 bg-white shadow-abm-card">
          {resultats.map((l) => (
            <li key={l.id}>{l.noeud}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
