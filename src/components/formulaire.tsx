"use client";

// Éléments de formulaire aux couleurs de la charte, utilisés dans tous les formulaires du site.

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { buttonClasses } from "@/components/ui";
import type { EtatFormulaire } from "@/lib/formulaire";

const classeSaisie =
  "mt-1 block w-full rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-2 text-ink placeholder:text-ink-soft/60 focus:border-bordeaux-700 aria-invalid:border-bordeaux-500";

/** Valeur à afficher dans un champ : celle saisie avant une erreur, sinon la valeur de départ. */
export function valeur(etat: EtatFormulaire, nom: string, defaut?: string | number | null) {
  const v = etat?.valeurs?.[nom];
  if (typeof v === "string") return v;
  return defaut === null || defaut === undefined ? "" : String(defaut);
}

type BaseChamp = {
  nom: string;
  libelle: string;
  etat?: EtatFormulaire;
  aide?: string;
  requis?: boolean;
};

function Libelle({ nom, libelle, requis }: { nom: string; libelle: string; requis?: boolean }) {
  return (
    <label htmlFor={nom} className="block text-sm font-semibold text-ink">
      {libelle}
      {requis && <span className="text-bordeaux-500"> *</span>}
    </label>
  );
}

function AideEtErreur({ nom, aide, erreur }: { nom: string; aide?: string; erreur?: string }) {
  return (
    <>
      {aide && (
        <p id={`${nom}-aide`} className="mt-1 text-xs text-ink-soft">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${nom}-erreur`} className="mt-1 text-sm font-semibold text-bordeaux-500">
          {erreur}
        </p>
      )}
    </>
  );
}

export function Champ({
  nom,
  libelle,
  etat,
  aide,
  requis,
  defaultValue,
  ...props
}: BaseChamp & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue"> & { defaultValue?: string | number | null }) {
  const erreur = etat?.erreurs?.[nom];
  // type="url" refuse « www.site.fr » (sans https://) : on garde le clavier adapté mais on laisse
  // le serveur compléter l'adresse (voir champ.lienFacultatif).
  const proprietes =
    props.type === "url" ? { ...props, type: "text", inputMode: "url" as const, autoCapitalize: "none", spellCheck: false } : props;
  return (
    <div>
      <Libelle nom={nom} libelle={libelle} requis={requis} />
      <input
        id={nom}
        name={nom}
        required={requis}
        defaultValue={props.type === "password" ? undefined : valeur(etat ?? null, nom, defaultValue)}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={[aide && `${nom}-aide`, erreur && `${nom}-erreur`].filter(Boolean).join(" ") || undefined}
        className={classeSaisie}
        {...proprietes}
      />
      <AideEtErreur nom={nom} aide={aide} erreur={erreur} />
    </div>
  );
}

export function ZoneTexte({
  nom,
  libelle,
  etat,
  aide,
  requis,
  defaultValue,
  rows = 4,
  ...props
}: BaseChamp & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "defaultValue"> & { defaultValue?: string | null }) {
  const erreur = etat?.erreurs?.[nom];
  const depart = valeur(etat ?? null, nom, defaultValue);
  // Compteur de caractères quand une limite est fixée (le navigateur empêche de la dépasser).
  const [longueur, setLongueur] = useState(depart.length);
  const max = props.maxLength;
  return (
    <div>
      <Libelle nom={nom} libelle={libelle} requis={requis} />
      <textarea
        id={nom}
        name={nom}
        rows={rows}
        required={requis}
        defaultValue={depart}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={[aide && `${nom}-aide`, erreur && `${nom}-erreur`, max && `${nom}-compteur`].filter(Boolean).join(" ") || undefined}
        className={classeSaisie}
        {...props}
        onChange={(e) => {
          setLongueur(e.target.value.length);
          props.onChange?.(e);
        }}
      />
      {max !== undefined && (
        <p id={`${nom}-compteur`} className={`mt-1 text-right text-xs ${longueur >= max * 0.9 ? "font-semibold text-bordeaux-500" : "text-ink-soft"}`}>
          {longueur.toLocaleString("fr-FR")} / {max.toLocaleString("fr-FR")} caractères
        </p>
      )}
      <AideEtErreur nom={nom} aide={aide} erreur={erreur} />
    </div>
  );
}

export function Liste({
  nom,
  libelle,
  etat,
  aide,
  requis,
  options,
  defaultValue,
  videLibelle,
  onChange,
}: BaseChamp & {
  options: readonly { valeur: string; libelle: string }[];
  defaultValue?: string | number | null;
  /** Libellé de l'option vide (« — Choisir — »). Sans ce paramètre, pas d'option vide. */
  videLibelle?: string;
  onChange?: (valeur: string) => void;
}) {
  const erreur = etat?.erreurs?.[nom];
  return (
    <div>
      <Libelle nom={nom} libelle={libelle} requis={requis} />
      <select
        // Après un envoi, React réinitialise le formulaire : la clé recrée le menu avec la valeur saisie.
        key={valeur(etat ?? null, nom, defaultValue)}
        id={nom}
        name={nom}
        required={requis}
        defaultValue={valeur(etat ?? null, nom, defaultValue)}
        aria-invalid={erreur ? true : undefined}
        onChange={onChange && ((e) => onChange(e.target.value))}
        className={classeSaisie}
      >
        {videLibelle !== undefined && <option value="">{videLibelle}</option>}
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
      <AideEtErreur nom={nom} aide={aide} erreur={erreur} />
    </div>
  );
}

export function CaseACocher({
  nom,
  libelle,
  etat,
  aide,
  requis,
  defaultChecked,
  onChange,
}: BaseChamp & { defaultChecked?: boolean; onChange?: (coche: boolean) => void }) {
  const erreur = etat?.erreurs?.[nom];
  const saisie = etat?.valeurs;
  const coche = saisie ? saisie[nom] === "on" : defaultChecked;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name={nom}
          required={requis}
          defaultChecked={coche}
          onChange={onChange && ((e) => onChange(e.target.checked))}
          className="mt-0.5 size-4 accent-bordeaux-700"
        />
        <span>
          {libelle}
          {requis && <span className="text-bordeaux-500"> *</span>}
        </span>
      </label>
      <AideEtErreur nom={nom} aide={aide} erreur={erreur} />
    </div>
  );
}

/**
 * Interrupteur oui / non (une case à cocher présentée comme un bouton glissant).
 * `onChange` permet d'afficher ou de masquer d'autres champs selon le choix.
 */
export function Interrupteur({
  nom,
  libelle,
  etat,
  aide,
  defaultChecked,
  onChange,
}: BaseChamp & { defaultChecked?: boolean; onChange?: (coche: boolean) => void }) {
  const erreur = etat?.erreurs?.[nom];
  const saisie = etat?.valeurs;
  const coche = saisie ? saisie[nom] === "on" : defaultChecked;
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          role="switch"
          name={nom}
          defaultChecked={coche}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-describedby={aide ? `${nom}-aide` : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative mt-0.5 h-6 w-11 shrink-0 rounded-abm-pill bg-bordeaux-700/20 transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-abm-pill after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:bg-bordeaux-700 peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bordeaux-700"
        />
        <span className="font-semibold">{libelle}</span>
      </label>
      <div className="pl-14">
        <AideEtErreur nom={nom} aide={aide} erreur={erreur} />
      </div>
    </div>
  );
}

/** Groupe de cases à cocher portant le même nom (ex. secteurs). */
export function CasesMultiples({
  nom,
  libelle,
  etat,
  aide,
  options,
  defaultValue = [],
}: BaseChamp & { options: readonly { valeur: string; libelle: string }[]; defaultValue?: string[] }) {
  const erreur = etat?.erreurs?.[nom];
  const saisie = etat?.valeurs?.[nom];
  const cochees = etat?.valeurs ? (saisie === undefined ? [] : Array.isArray(saisie) ? saisie : [saisie]) : defaultValue;
  return (
    <fieldset>
      <legend className="block text-sm font-semibold text-ink">{libelle}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.valeur} className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name={nom}
              value={o.valeur}
              defaultChecked={cochees.includes(o.valeur)}
              className="mt-0.5 size-4 accent-bordeaux-700"
            />
            {o.libelle}
          </label>
        ))}
      </div>
      <AideEtErreur nom={nom} aide={aide} erreur={erreur} />
    </fieldset>
  );
}

export function BoutonEnvoyer({
  children,
  variante = "primary",
  taille = "normal",
  confirmation,
}: {
  children: React.ReactNode;
  variante?: "primary" | "inverse" | "outline-inverse" | "outline" | "danger";
  taille?: "normal" | "petit";
  /** Message de confirmation affiché avant l'envoi (actions irréversibles). */
  confirmation?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmation && !window.confirm(confirmation)) e.preventDefault();
      }}
      className={`${buttonClasses(variante, taille)} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {pending ? "Envoi…" : children}
    </button>
  );
}

/** Message général en haut ou en bas d'un formulaire (erreur ou succès). */
export function MessageFormulaire({ etat }: { etat: EtatFormulaire }) {
  const ref = useRef<HTMLDivElement>(null);
  const [libelles, setLibelles] = useState<Record<string, string>>({});

  // Après un envoi en erreur : le focus va sur le récapitulatif (lecteurs d'écran, clavier),
  // et chaque erreur renvoie vers son champ, nommé par son libellé.
  useEffect(() => {
    if (!etat?.erreur || !ref.current) return;
    ref.current.focus();
    const trouves: Record<string, string> = {};
    for (const nom of Object.keys(etat.erreurs ?? {})) {
      const libelle = document.querySelector(`label[for="${CSS.escape(nom)}"]`)?.textContent?.replace(/\s*\*$/, "");
      if (libelle) trouves[nom] = libelle;
    }
    setLibelles(trouves);
  }, [etat]);

  if (!etat?.erreur && !etat?.succes) return null;

  if (etat.succes) {
    return (
      <p role="status" className="rounded-abm-sm border border-bordeaux-700/20 bg-white px-4 py-3 text-sm font-semibold text-bordeaux-700">
        {etat.succes}
      </p>
    );
  }

  const erreurs = Object.entries(etat.erreurs ?? {});
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-abm-sm border border-bordeaux-500 bg-bordeaux-100 px-4 py-3 text-sm text-bordeaux-800 focus:outline-none"
    >
      <p className="font-semibold">{etat.erreur}</p>
      {erreurs.length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {erreurs.map(([nom, message]) => (
            <li key={nom}>
              <a href={`#${nom}`} className="underline underline-offset-2 hover:text-bordeaux-600">
                {libelles[nom] ? `${libelles[nom]} : ${message}` : message}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
