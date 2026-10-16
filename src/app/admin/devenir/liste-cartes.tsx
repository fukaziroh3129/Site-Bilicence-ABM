"use client";

// Liste de contrôle des cartes « Que sont-ils devenus ? » (/admin/devenir) : voir la carte telle que le
// public la voit, la valider (une ou plusieurs à la fois), la retirer avec un motif, ou la rétablir.

import { Check, Eye, RotateCcw, X } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { retablirCarte, retirerCarte, validerCartes } from "@/actions/devenir";
import { Fenetre } from "@/components/fenetre/fenetre";
import { ZoneTexte } from "@/components/formulaire";
import { ApercuCarte } from "@/components/parcours/apercu-carte";
import type { CarteParcours } from "@/components/parcours/types";
import { Initiales, Pastille, buttonClasses, classeLisere } from "@/components/ui";

export type LigneCarte = {
  id: string;
  nom: string;
  promo: string;
  aujourdhui: string | null;
  presentation: string | null;
  conseil: string | null;
  domaines: string[];
  nbFormations: number;
  nbExperiences: number;
  accordLe: string | null;
  controleLe: string | null;
  retireLe: string | null;
  motifRetrait: string | null;
  accordRetire: boolean; // la personne a retiré son accord depuis
  carte: CarteParcours;
};

export type VueCartes = "a-controler" | "publiees" | "retirees";

const classeBoutonDanger =
  "inline-flex min-h-9 items-center gap-1.5 rounded-abm-sm border border-bordeaux-500/60 bg-white px-3 py-1.5 text-sm font-semibold text-bordeaux-500 transition-colors hover:bg-bordeaux-500 hover:text-white";

function Envoyer({ children, icone }: { children: React.ReactNode; icone?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses("outline", "petit")}>
      {icone}
      {pending ? "Enregistrement…" : children}
    </button>
  );
}

function BoutonRetirer({ ligne }: { ligne: LigneCarte }) {
  const [ouverte, setOuverte] = useState(false);
  const [etat, envoyer] = useActionState(retirerCarte, null);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOuverte(true)} className={classeBoutonDanger}>
        <X size={15} aria-hidden /> Retirer
      </button>
      <Fenetre ouverte={ouverte && !etat?.succes} onFermer={() => setOuverte(false)} titre={`Retirer la carte de ${ligne.nom}`} surtitre="Que sont-ils devenus ?" etroite>
        <form action={envoyer} className="space-y-5">
          <input type="hidden" name="id" value={ligne.id} />
          {etat?.erreur && !etat.erreurs && (
            <p role="alert" className="text-sm font-semibold text-bordeaux-500">
              {etat.erreur}
            </p>
          )}
          <p className="rounded-abm-sm bg-bordeaux-100 px-4 py-3 text-sm text-ink">
            <b className="text-bordeaux-700">Ce qui va changer : </b>
            la carte disparaît aussitôt de la page publique, même si {ligne.nom} a donné son accord. Le motif ci-dessous lui est transmis
            dans « Ma fiche ». Vous pourrez la rétablir à tout moment.
          </p>
          <ZoneTexte nom="motif" libelle="Motif du retrait" requis rows={3} maxLength={300} aide="Ex. « Présentation à reformuler : elle contient des coordonnées »." etat={etat} />
          <div className="flex flex-wrap justify-end gap-3 border-t border-bordeaux-700/10 pt-4">
            <button type="button" onClick={() => setOuverte(false)} className={buttonClasses("outline", "petit")}>
              Annuler
            </button>
            <Confirmer />
          </div>
        </form>
      </Fenetre>
    </>
  );
}

function Confirmer() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses("danger", "petit")}>
      {pending ? "Enregistrement…" : "Retirer la carte"}
    </button>
  );
}

function BoutonVoir({ ligne, courts }: { ligne: LigneCarte; courts: Record<string, string> }) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOuverte(true)} className={buttonClasses("outline", "petit")}>
        <Eye size={15} aria-hidden /> Voir la carte
      </button>
      <Fenetre ouverte={ouverte} onFermer={() => setOuverte(false)} titre={ligne.nom} surtitre="Carte telle que le public la voit">
        <ApercuCarte carte={ligne.carte} courts={courts} />
      </Fenetre>
    </>
  );
}

export function ListeCartes({ lignes, vue, courts }: { lignes: LigneCarte[]; vue: VueCartes; courts: Record<string, string> }) {
  const [choisies, setChoisies] = useState<string[]>([]);
  const toutes = lignes.length > 0 && choisies.length === lignes.length;

  return (
    <div>
      {vue === "a-controler" && (
        <form action={validerCartes} className="flex flex-wrap items-center gap-3 border-b border-bordeaux-700/10 px-4 py-3 sm:px-5">
          {choisies.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={toutes}
              onChange={() => setChoisies(toutes ? [] : lignes.map((l) => l.id))}
              className="size-4 accent-bordeaux-700"
            />
            Tout sélectionner
          </label>
          <span className="text-sm text-ink-soft" aria-live="polite">
            {choisies.length === 0 ? "Aucune carte sélectionnée" : `${choisies.length} sélectionnée${choisies.length > 1 ? "s" : ""}`}
          </span>
          <div className="ml-auto">
            {choisies.length > 0 && (
              <Envoyer icone={<Check size={15} aria-hidden />}>
                Valider la sélection
              </Envoyer>
            )}
          </div>
        </form>
      )}

      <ul>
        {lignes.map((l) => (
          <li key={l.id} className={`border-t border-bordeaux-700/10 first:border-t-0 ${vue === "a-controler" ? classeLisere : ""}`}>
            <div className="flex flex-wrap items-start gap-4 px-4 py-4 sm:px-5">
              {vue === "a-controler" && (
                <input
                  type="checkbox"
                  aria-label={`Sélectionner la carte de ${l.nom}`}
                  checked={choisies.includes(l.id)}
                  onChange={() => setChoisies((c) => (c.includes(l.id) ? c.filter((x) => x !== l.id) : [...c, l.id]))}
                  className="mt-3 size-4 accent-bordeaux-700"
                />
              )}
              <Initiales prenom={l.carte.prenom} nom={l.carte.nom} />
              <div className="min-w-0 flex-[1_1_320px] space-y-1.5">
                <p className="text-ink">
                  <b>{l.nom}</b> <span className="text-ink-soft">· promotion {l.promo}</span>
                </p>
                <p className="text-sm text-ink-soft">
                  {l.aujourdhui ?? "Situation non renseignée"} · {l.nbFormations} formation{l.nbFormations > 1 ? "s" : ""} · {l.nbExperiences} expérience
                  {l.nbExperiences > 1 ? "s" : ""}
                  {l.domaines.length > 0 && ` · ${l.domaines.join(", ")}`}
                </p>
                {l.presentation && <p className="text-sm text-ink">« {l.presentation} »</p>}
                {l.conseil && (
                  <p className="text-sm text-ink">
                    <span className="text-ink-soft">Conseil : </span>« {l.conseil} »
                  </p>
                )}
                <p className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                  {l.accordLe && <span>Accord donné le {l.accordLe}</span>}
                  {l.controleLe && <Pastille>Contrôlée le {l.controleLe}</Pastille>}
                  {l.retireLe && <Pastille accent>Retirée le {l.retireLe}</Pastille>}
                  {l.accordRetire && <Pastille>Accord retiré par la personne</Pastille>}
                </p>
                {l.motifRetrait && (
                  <p className="text-sm text-ink">
                    <span className="text-ink-soft">Motif : </span>
                    {l.motifRetrait}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BoutonVoir ligne={l} courts={courts} />
                {vue === "a-controler" && (
                  <form action={validerCartes}>
                    <input type="hidden" name="ids" value={l.id} />
                    <Envoyer icone={<Check size={15} aria-hidden />}>Valider</Envoyer>
                  </form>
                )}
                {vue !== "retirees" ? (
                  <BoutonRetirer ligne={l} />
                ) : (
                  <form action={retablirCarte}>
                    <input type="hidden" name="id" value={l.id} />
                    <Envoyer icone={<RotateCcw size={15} aria-hidden />}>Rétablir</Envoyer>
                  </form>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
