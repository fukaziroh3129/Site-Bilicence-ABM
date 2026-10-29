"use client";

// Simulateur de moyenne de l'espace membres (maquette `../maquettes/simulateur-moyenne.html`).
// Données et calculs : src/lib/mcc.ts. Les notes restent dans le navigateur (localStorage), jamais sur le serveur.

import { Check, Eraser, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PastillesChoix } from "@/components/filtres-instantanes";
import { BandeauEspace, Panneau, buttonClasses, classeSaisie } from "@/components/ui";
import {
  MCC,
  NOTE_VALIDATION,
  bilan,
  calculerSemestre,
  moyenneComposante,
  noteInvalide,
  type Bilan,
  type Choix,
  type CodeAnnee,
  type ResultatSemestre,
  type ResultatUe,
  type Saisies,
  type SemestreMcc,
  type UeMcc,
} from "@/lib/mcc";

const CLE_MEMOIRE = "abm:simulateur-moyenne:v1";

/** Semestres affichés : les deux (année, avec compensation) ou un seul. */
type Vue = "deux" | "premier" | "second";
const VUES: Vue[] = ["deux", "premier", "second"];

type Memoire = { saisies: Saisies; choix: Choix; vue: Vue };

const LIBELLES_DISCIPLINE = { ECO: "Économie", SCPO: "Science politique", COMMUN: "Commun" } as const;
const CLASSES_DISCIPLINE = {
  ECO: "bg-bordeaux-100 text-bordeaux-700",
  SCPO: "bg-beige-papier text-ink",
  COMMUN: "border border-dashed border-bordeaux-300 text-ink-soft",
} as const;

/** Champ standard sans sa largeur pleine (points bonus, liste du choix) : `w-full` l'emporterait sur une largeur ajoutée. */
const classeChampCourt = classeSaisie.replace("block w-full ", "");

/** Colonnes des lignes de notes : intitulé, champ, note de l'UE (plus serrées sur téléphone). */
const COLONNES = "grid-cols-[minmax(0,1fr)_4.25rem_3.5rem] sm:grid-cols-[minmax(0,1fr)_5.5rem_4rem]";

const nombre = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const note = (n: number | null) => (n === null ? "–" : nombre(n));
const coefficient = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/** Ne garde que les valeurs texte d'un objet relu (le stockage du navigateur peut contenir n'importe quoi). */
function textes(valeur: unknown): Record<string, string> {
  if (!valeur || typeof valeur !== "object") return {};
  return Object.fromEntries(Object.entries(valeur).filter((e): e is [string, string] => typeof e[1] === "string"));
}

function lireMemoire(): Memoire | null {
  try {
    const brut = window.localStorage.getItem(CLE_MEMOIRE);
    if (!brut) return null;
    const m = JSON.parse(brut);
    return { saisies: textes(m?.saisies), choix: textes(m?.choix), vue: VUES.includes(m?.vue) ? m.vue : "deux" };
  } catch {
    return null;
  }
}

/** Clés de saisie d'un semestre (notes, options au choix, bonus) : pour « Effacer mes notes ». */
function clesDuSemestre(s: SemestreMcc): string[] {
  return [...s.ues, ...(s.choix?.options ?? [])].flatMap((u) => [u.id, ...(u.elements ?? []).map((e) => e.id)]).concat(s.bonus.map((b) => b.id));
}

const abonnementVide = () => () => {};

/**
 * Le rendu serveur (et le premier rendu du navigateur) partent de notes vides ; une fois la page chargée,
 * le simulateur est recréé avec les notes gardées dans le navigateur.
 */
export function SimulateurMoyenne({ anneeInitiale }: { anneeInitiale: CodeAnnee }) {
  const dansLeNavigateur = useSyncExternalStore(abonnementVide, () => true, () => false);
  return <Simulateur key={dansLeNavigateur ? "navigateur" : "serveur"} anneeInitiale={anneeInitiale} memoire={dansLeNavigateur} />;
}

function Simulateur({ anneeInitiale, memoire }: { anneeInitiale: CodeAnnee; memoire: boolean }) {
  const [depart] = useState(() => (memoire ? lireMemoire() : null));
  const [code, setCode] = useState<CodeAnnee>(anneeInitiale);
  const [vue, setVue] = useState<Vue>(depart?.vue ?? "deux");
  const [saisies, setSaisies] = useState<Saisies>(depart?.saisies ?? {});
  const [choix, setChoix] = useState<Choix>(depart?.choix ?? {});

  useEffect(() => {
    if (!memoire) return;
    try {
      window.localStorage.setItem(CLE_MEMOIRE, JSON.stringify({ saisies, choix, vue }));
    } catch {
      // Stockage indisponible (navigation privée, données bloquées) : le simulateur marche sans.
    }
  }, [memoire, saisies, choix, vue]);

  const annee = MCC.find((a) => a.code === code) ?? MCC[0];
  const resultats = annee.semestres.map((s) => calculerSemestre(s, saisies, choix));
  const affiches = vue === "deux" ? [0, 1] : vue === "premier" ? [0] : [1];
  const resultatsAffiches = affiches.map((i) => resultats[i]);
  const total = bilan(resultatsAffiches);
  const [s1, s2] = annee.semestres;

  function saisir(cle: string, valeur: string) {
    setSaisies((avant) => ({ ...avant, [cle]: valeur }));
  }

  function effacer() {
    const cles = new Set(annee.semestres.flatMap(clesDuSemestre));
    setSaisies((avant) => Object.fromEntries(Object.entries(avant).filter(([cle]) => !cles.has(cle))));
    setChoix((avant) => Object.fromEntries(Object.entries(avant).filter(([cle]) => !annee.semestres.some((s) => s.choix?.id === cle))));
  }

  return (
    <div className="space-y-6">
      <BandeauEspace
        titre="Simulateur de moyenne"
        phrase="D’après les modalités de contrôle des connaissances 2025-2026 de la bi-licence. Vos notes restent sur cet appareil."
        chiffre={note(total.moyenne)}
        libelleChiffre={vue === "deux" ? `moyenne de la ${code}` : `moyenne du semestre ${annee.semestres[affiches[0]].numero}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <PastillesChoix
            label="Année de licence"
            valeur={code}
            onChange={(v) => setCode(v as CodeAnnee)}
            options={MCC.map((a) => ({ valeur: a.code, libelle: a.code }))}
          />
          <PastillesChoix
            label="Semestres affichés"
            valeur={vue}
            onChange={(v) => setVue(v as Vue)}
            options={[
              { valeur: "deux", libelle: "Les deux semestres" },
              { valeur: "premier", libelle: `Semestre ${s1.numero}` },
              { valeur: "second", libelle: `Semestre ${s2.numero}` },
            ]}
          />
        </div>
        <button type="button" onClick={effacer} className={buttonClasses("outline", "petit")}>
          <Eraser size={14} aria-hidden /> Effacer mes notes de {code}
        </button>
      </div>

      <Panneau titre={vue === "deux" ? `Récapitulatif de la ${code}` : `Récapitulatif du semestre ${annee.semestres[affiches[0]].numero}`}>
        <div aria-live="polite" className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {affiches.map((i) => (
              <Tuile
                key={i}
                titre={`Semestre ${annee.semestres[i].numero}`}
                valeur={resultats[i].moyenne}
                detail={<Etat bilan={bilan([resultats[i]])} portee="le semestre" />}
              />
            ))}
            {vue === "deux" && <Tuile titre={`Année ${code}`} valeur={total.moyenne} detail={<Etat bilan={total} portee="l’année" />} accent />}
          </div>
          <div>
            <p className="text-sm text-ink-soft">
              Moyennes indicatives par composante, sans l’anglais, les enseignements communs ni les bonus : la note officielle reste la moyenne
              du semestre.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["ECO", "SCPO"] as const).map((d) => (
                <Tuile
                  key={d}
                  titre={LIBELLES_DISCIPLINE[d]}
                  valeur={moyenneComposante(resultatsAffiches, d)}
                  detail={
                    vue === "deux"
                      ? affiches.map((i) => `S${annee.semestres[i].numero} : ${note(moyenneComposante([resultats[i]], d))}`).join(" · ")
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Panneau>

      <div className={`grid items-start gap-6 ${vue === "deux" ? "lg:grid-cols-2" : ""}`}>
        {affiches.map((i) => (
          <PanneauSemestre
            key={annee.semestres[i].numero}
            semestre={annee.semestres[i]}
            resultat={resultats[i]}
            saisies={saisies}
            choix={choix}
            onSaisie={saisir}
            onChoix={(cle, valeur) => setChoix((avant) => ({ ...avant, [cle]: valeur }))}
          />
        ))}
      </div>

      <p className="max-w-[80ch] text-sm text-ink-soft">
        Résultat indicatif : seule la délibération du jury fait foi. Les MCC 2025-2026 sont une version non définitive. Pour un TD en contrôle
        continu, saisissez la moyenne de vos notes de TD. La seconde chance (rattrapage) n’est pas simulée ; la remise à niveau en
        mathématiques, l’intelligence artificielle et la transition écologique ne sont pas notées.
      </p>
    </div>
  );
}

function Tuile({ titre, valeur, detail, accent = false }: { titre: string; valeur: number | null; detail?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-abm-md border px-4 py-3 ${accent ? "border-bordeaux-700 bg-bordeaux-100/30" : "border-bordeaux-700/15"}`}>
      <p className="text-sm text-ink-soft">{titre}</p>
      <p className="mt-0.5 font-impact text-3xl leading-tight text-bordeaux-700 tabular-nums">{note(valeur)}</p>
      {detail && <div className="mt-1 text-sm text-ink-soft">{detail}</div>}
    </div>
  );
}

/** Où en est la moyenne : validée ou non, ou ce qu'il faut obtenir sur les notes restantes. */
function Etat({ bilan: b, portee }: { bilan: Bilan; portee: string }) {
  if (b.moyenne === null) return <>Aucune note saisie.</>;
  if (b.necessaire === null) {
    return b.moyenne >= NOTE_VALIDATION ? (
      <span className="inline-flex items-center gap-1 font-semibold text-bordeaux-700">
        <Check size={15} aria-hidden /> Validé
      </span>
    ) : (
      <span className="inline-flex items-center gap-1">
        <X size={15} aria-hidden /> Non validé{portee === "le semestre" ? " (compensable avec l’autre semestre)" : ""}
      </span>
    );
  }
  if (b.necessaire <= 0) return <>La moyenne de 10 est déjà assurée pour {portee}.</>;
  if (b.necessaire > 20) return <>La moyenne de 10 est hors d’atteinte pour {portee}.</>;
  return (
    <>
      Il vous faut <strong className="text-ink">{nombre(b.necessaire)}</strong> de moyenne sur le reste pour valider {portee}.
    </>
  );
}

function PanneauSemestre({
  semestre,
  resultat,
  saisies,
  choix,
  onSaisie,
  onChoix,
}: {
  semestre: SemestreMcc;
  resultat: ResultatSemestre;
  saisies: Saisies;
  choix: Choix;
  onSaisie: (cle: string, valeur: string) => void;
  onChoix: (cle: string, valeur: string) => void;
}) {
  const option = semestre.choix ? (semestre.choix.options.find((o) => o.id === choix[semestre.choix!.id]) ?? semestre.choix.options[0]) : null;
  const toutes = [...semestre.ues, ...(option ? [option] : [])];
  const illisible = toutes.some((u) => (u.elements ? u.elements.map((e) => e.id) : [u.id]).some((id) => noteInvalide(saisies[id])));
  const ligne = (u: UeMcc) => <LigneUe key={u.id} ue={u} resultat={resultat.ues[u.id]} saisies={saisies} onSaisie={onSaisie} />;

  return (
    <Panneau
      titre={
        <>
          Semestre {semestre.numero} <span className="font-body text-sm font-normal text-ink-soft">· 30 crédits</span>
        </>
      }
      action={<span className="font-impact text-2xl text-bordeaux-700 tabular-nums">{note(resultat.moyenne)}</span>}
      corps={false}
    >
      <div className={`grid ${COLONNES} gap-3 px-5 pb-1 pt-3 text-xs text-ink-soft sm:px-6`}>
        <span>Enseignement</span>
        <span className="text-right">Note sur 20</span>
        <span className="text-right">UE</span>
      </div>
      <ul>
        {semestre.ues.map(ligne)}
        {semestre.choix && option && (
          <>
            <li className="border-t border-bordeaux-700/10 px-5 pt-3 sm:px-6">
              <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold text-bordeaux-700">{semestre.choix.libelle}</span>
                <select
                  value={option.id}
                  onChange={(e) => onChoix(semestre.choix!.id, e.target.value)}
                  className={`${classeChampCourt} h-9 max-w-full py-1 text-sm`}
                >
                  {semestre.choix.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nom}
                    </option>
                  ))}
                </select>
              </label>
            </li>
            {ligne(option)}
          </>
        )}
      </ul>

      <div className="border-t border-bordeaux-700/10 bg-bordeaux-100/25 px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-bordeaux-700">Options facultatives</p>
        <p className="text-xs text-ink-soft">Points bonus ajoutés au total du semestre : 3 points = +0,1 de moyenne.</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {semestre.bonus.map((b) => (
            <label key={b.id} className="flex items-center gap-2 text-sm">
              {b.nom}
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                maxLength={5}
                placeholder="0"
                value={saisies[b.id] ?? ""}
                onChange={(e) => onSaisie(b.id, e.target.value)}
                aria-invalid={noteInvalide(saisies[b.id]) || undefined}
                className={`${classeChampCourt} h-9 w-14 px-2 text-right tabular-nums`}
              />
              <span className="text-xs text-ink-soft">/ {b.max}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1 border-t border-bordeaux-700/10 px-5 py-4 text-sm text-ink-soft sm:px-6">
        <p>
          Notes saisies : {coefficient(resultat.coefs)} crédits sur 30
          {resultat.bonus > 0 && ` · bonus : +${nombre(resultat.bonus / 30)}`}
        </p>
        <p>
          <Etat bilan={bilan([resultat])} portee="le semestre" />
        </p>
        {illisible && <p className="font-semibold text-bordeaux-500">Une note n’est pas lisible : tapez un nombre de 0 à 20 (virgule acceptée).</p>}
      </div>
    </Panneau>
  );
}

function LigneUe({ ue, resultat, saisies, onSaisie }: { ue: UeMcc; resultat?: ResultatUe; saisies: Saisies; onSaisie: (cle: string, valeur: string) => void }) {
  const entete = (
    <>
      <span className="font-semibold">{ue.nom}</span>
      <span className={`ml-2 inline-block rounded-abm-pill px-2 py-px align-middle text-[11px] font-semibold ${CLASSES_DISCIPLINE[ue.discipline]}`}>
        {LIBELLES_DISCIPLINE[ue.discipline]}
      </span>
      <span className="block text-xs text-ink-soft">
        Coefficient {coefficient(ue.coef)}
        {ue.modalite && ` · ${ue.modalite}`}
      </span>
    </>
  );
  const noteDeLUe = <NoteUe resultat={resultat} />;

  if (!ue.elements) {
    return (
      <li className={`grid ${COLONNES} items-center gap-3 border-t border-bordeaux-700/10 px-5 py-2.5 sm:px-6`}>
        <label htmlFor={`note-${ue.id}`} className="min-w-0 text-sm">
          {entete}
        </label>
        <ChampNote id={ue.id} saisies={saisies} onSaisie={onSaisie} />
        {noteDeLUe}
      </li>
    );
  }
  return (
    <li className="border-t border-bordeaux-700/10 px-5 py-2.5 sm:px-6">
      <div className={`grid ${COLONNES} items-center gap-3`}>
        <p className="min-w-0 text-sm">{entete}</p>
        <span />
        {noteDeLUe}
      </div>
      <ul className="mt-1.5 space-y-1.5">
        {ue.elements.map((e) => (
          <li key={e.id} className={`grid ${COLONNES} items-center gap-3`}>
            <label htmlFor={`note-${e.id}`} className="min-w-0 pl-4 text-sm text-ink-soft">
              {e.nom} · {e.modalite} <span className="whitespace-nowrap">(coef. {coefficient(e.coef)})</span>
              <span className="sr-only"> — {ue.nom}</span>
            </label>
            <ChampNote id={e.id} saisies={saisies} onSaisie={onSaisie} />
            <span />
          </li>
        ))}
      </ul>
    </li>
  );
}

function ChampNote({ id, saisies, onSaisie }: { id: string; saisies: Saisies; onSaisie: (cle: string, valeur: string) => void }) {
  return (
    <input
      id={`note-${id}`}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      maxLength={5}
      placeholder="–"
      value={saisies[id] ?? ""}
      onChange={(e) => onSaisie(id, e.target.value)}
      aria-invalid={noteInvalide(saisies[id]) || undefined}
      className={`${classeSaisie} h-9 px-2 text-right tabular-nums`}
    />
  );
}

function NoteUe({ resultat }: { resultat?: ResultatUe }) {
  if (!resultat || resultat.note === null) return <span className="text-right text-sm text-ink-soft">–</span>;
  return (
    <span className="text-right text-sm tabular-nums">
      <span className="block font-semibold text-bordeaux-700">{nombre(resultat.note)}</span>
      <span className="block text-[11px] text-ink-soft">
        {!resultat.complete ? "partielle" : resultat.note >= NOTE_VALIDATION ? "acquise" : "non acquise"}
      </span>
    </span>
  );
}
