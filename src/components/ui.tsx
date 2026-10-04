// Petites briques visuelles réutilisées sur toutes les pages (boutons, emplacements à compléter).

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FiletTitre, SceauFiligrane } from "@/components/anime";

type ButtonVariant = "primary" | "inverse" | "outline-inverse" | "outline" | "danger";

const buttonBase =
  "reflet group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-abm-sm font-semibold uppercase tracking-[0.14em] transition-[background-color,border-color,box-shadow,color,transform] duration-200 active:translate-y-px";

const buttonVariants: Record<ButtonVariant, string> = {
  // Sur fond clair : dégradé tonal bordeaux + ombre d'encre au survol
  primary:
    "bg-[image:var(--degrade-bouton)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-abm-card active:shadow-[var(--shadow-inset-press)]",
  // Sur fond bordeaux
  inverse: "bg-white text-bordeaux-700 hover:bg-bordeaux-100",
  "outline-inverse": "border border-white/45 text-white hover:bg-white/12",
  // Action secondaire sur fond clair
  outline: "border border-bordeaux-700/40 bg-white text-bordeaux-700 hover:border-bordeaux-700 hover:bg-bordeaux-700 hover:text-white",
  // Action sensible (suppression) : distincte des actions ordinaires
  danger: "border border-bordeaux-500 bg-white text-bordeaux-500 hover:border-bordeaux-600 hover:bg-bordeaux-600 hover:text-white",
};

export function buttonClasses(variant: ButtonVariant = "primary", taille: "normal" | "petit" = "normal") {
  const dimensions = taille === "petit" ? "px-3.5 py-2 text-xs" : "px-5 py-3 text-sm";
  return `${buttonBase} ${dimensions} ${buttonVariants[variant]}`;
}

/** Champ de saisie standard (formulaires, filtres, listes du bureau). */
export const classeSaisie =
  "block w-full rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-2 text-ink focus:border-bordeaux-700 aria-invalid:border-bordeaux-500";

/** Liseré bordeaux à gauche : « cet élément attend une action ». */
export const classeLisere = "border-l-[3px] border-l-bordeaux-700";

/** Tableaux du site (administration) : en-tête teinté, survol des lignes. À poser dans un `Panneau corps={false}`. */
export const classesTableau = {
  conteneur: "overflow-x-auto",
  table: "w-full min-w-[640px] text-left text-sm",
  tete: "bg-bordeaux-100/50 text-bordeaux-800",
  th: "px-4 py-3 font-semibold",
  ligne: "border-t border-bordeaux-700/10 transition-colors hover:bg-bordeaux-100/25",
  td: "px-4 py-3 align-top",
};

/**
 * Bandeau compact des pages de l'espace membres (moitié moins haut que le bandeau public) :
 * titre, une phrase, et à droite un chiffre clé et/ou un bouton (variante « inverse »).
 */
export function BandeauEspace({
  titre,
  phrase,
  chiffre,
  libelleChiffre,
  action,
  avant,
  children,
}: {
  titre: React.ReactNode;
  phrase?: React.ReactNode;
  chiffre?: React.ReactNode;
  libelleChiffre?: React.ReactNode;
  action?: React.ReactNode;
  /** Élément placé avant le titre (ex. médaillon d'initiales). */
  avant?: React.ReactNode;
  /** Contenu sous la ligne de titre (ex. barre de progression). */
  children?: React.ReactNode;
}) {
  return (
    <section className="fond-bordeaux filigrane relative overflow-hidden rounded-abm-lg px-5 py-6 sm:px-10 sm:py-7">
      <SceauFiligrane className="-right-20 -top-24 size-[300px]" />
      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-[1_1_320px] items-center gap-5">
          {avant}
          <div className="min-w-0">
            <h1 className="apparait font-display text-3xl font-bold leading-tight sm:text-4xl">{titre}</h1>
            {phrase && (
              <div className="apparait mt-2 max-w-[58ch] text-[15px] text-white/80 sm:text-base" style={{ animationDelay: "80ms" }}>
                {phrase}
              </div>
            )}
          </div>
        </div>
        {(chiffre !== undefined || action) && (
          <div className="apparait flex flex-wrap items-end gap-6" style={{ animationDelay: "160ms" }}>
            {chiffre !== undefined && (
              <div className="border-l border-white/30 pl-5">
                <p className="font-impact text-4xl leading-none sm:text-5xl">{chiffre}</p>
                {libelleChiffre && <p className="mt-1 text-sm text-white/80">{libelleChiffre}</p>}
              </div>
            )}
            {action}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

/** En-tête des pages de l'administration (outil de travail : pas de bandeau bordeaux). */
export function EnTeteConsole({ titre, phrase, action }: { titre: React.ReactNode; phrase?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="relative flex flex-wrap items-end justify-between gap-4 pb-5">
      <div className="min-w-0 flex-[1_1_380px]">
        <h1 className="font-display text-3xl font-bold text-bordeaux-700">{titre}</h1>
        {phrase && <div className="mt-2 max-w-[75ch] text-ink-soft">{phrase}</div>}
      </div>
      {action}
      <span aria-hidden className="filet-degrade absolute inset-x-0 bottom-0" />
    </header>
  );
}

/** Bouton de retour en pilule + fil d'Ariane : « ← Annuaire / Léa Marchand ». */
export function FilAriane({ retour, ici }: { retour: { href: string; libelle: string }; ici?: React.ReactNode }) {
  return (
    <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2.5 text-sm text-ink-soft">
      <Link
        href={retour.href}
        className="group inline-flex h-9 items-center gap-2 rounded-abm-pill border border-bordeaux-700/25 bg-white pl-1 pr-3.5 font-semibold text-bordeaux-700 shadow-[0_1px_2px_rgba(43,13,15,0.06)] transition-[border-color,box-shadow] duration-200 hover:border-bordeaux-700 hover:shadow-abm-card"
      >
        <span className="grid size-7 place-items-center rounded-full bg-bordeaux-100 transition-colors duration-200 group-hover:bg-bordeaux-700 group-hover:text-white">
          <ArrowLeft size={15} aria-hidden className="transition-transform duration-300 group-hover:-translate-x-0.5" />
        </span>
        {retour.libelle}
      </Link>
      {ici && (
        <>
          <span aria-hidden className="text-bordeaux-300">
            /
          </span>
          <span aria-current="page" className="font-semibold text-ink">
            {ici}
          </span>
        </>
      )}
    </nav>
  );
}

/** Petite pastille de nombre (à côté d'un titre de panneau). */
export function Compte({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex h-[22px] min-w-[26px] items-center justify-center rounded-abm-pill px-2 font-body text-xs font-bold tabular-nums ${
        accent ? "bg-bordeaux-700 text-white" : "bg-bordeaux-100 text-bordeaux-700"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Panneau standard : cadre blanc à ombre douce, en-tête facultatif (titre, compteur, action)
 * séparé par un filet. `corps={false}` pour poser une liste ou un tableau bord à bord.
 */
export function Panneau({
  titre,
  icone,
  compte,
  compteAccent = false,
  action,
  children,
  corps = true,
  sensible = false,
  className = "",
  id,
}: {
  titre?: React.ReactNode;
  icone?: React.ReactNode;
  compte?: number;
  compteAccent?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  corps?: boolean;
  /** Zone sensible (suppression) : liseré rouge bordeaux et fond rosé. */
  sensible?: boolean;
  className?: string;
  id?: string;
}) {
  const cadre = sensible
    ? "border border-bordeaux-500/45 border-l-[3px] border-l-bordeaux-500 bg-[#fcf6f6]"
    : "border border-bordeaux-700/15 bg-white";
  return (
    <section id={id} className={`rounded-abm-lg shadow-abm-card ${cadre} ${corps ? "" : "overflow-hidden"} ${className}`}>
      {titre && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-bordeaux-700/10 px-5 py-4 sm:px-6">
          <h2 className={`flex items-center gap-2.5 font-display text-lg font-bold ${sensible ? "text-bordeaux-500" : "text-bordeaux-700"}`}>
            {icone}
            {titre}
            {compte !== undefined && <Compte accent={compteAccent && compte > 0}>{compte}</Compte>}
          </h2>
          {action}
        </div>
      )}
      {corps ? <div className="p-5 sm:p-6">{children}</div> : children}
    </section>
  );
}

/** Médaillon d'initiales (comme sur les cartes publiques), faute de photo. */
export function Initiales({
  prenom,
  nom,
  taille = "moyen",
  className = "",
}: {
  prenom: string;
  nom: string;
  taille?: "petit" | "moyen" | "bandeau" | "grand";
  className?: string;
}) {
  const dimensions = {
    petit: "size-10 border-2 text-sm",
    moyen: "size-[52px] border-[3px] text-lg",
    bandeau: "size-[72px] border-4 text-[26px]",
    grand: "size-[92px] border-[5px] text-[32px]",
  }[taille];
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border-white bg-bordeaux-100 font-display font-bold text-bordeaux-700 shadow-[0_4px_12px_rgba(43,13,15,0.12)] ${dimensions} ${className}`}
    >
      {(prenom.trim()[0] ?? "").toUpperCase()}
      {(nom.trim()[0] ?? "").toUpperCase()}
    </span>
  );
}

/** Bloc de date (jour en grand, mois dessous), en heure de Paris ; « sans date » si `date` est vide. */
export function BlocDate({ date, surtitre }: { date: Date | null; surtitre?: string }) {
  if (!date) {
    return (
      <div className="w-[66px] shrink-0 self-start rounded-abm-md border border-dashed border-bordeaux-300 bg-white px-1 py-2.5 text-center leading-none text-ink-soft">
        <span className="block font-display text-lg font-bold">—</span>
        <span className="mt-1.5 block text-[0.62rem] font-bold uppercase tracking-[0.12em]">sans date</span>
      </div>
    );
  }
  const f = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "Europe/Paris" }).format(date);
  return (
    <div className="w-[66px] shrink-0 self-start rounded-abm-md bg-beige-papier px-1 py-2 text-center leading-none text-bordeaux-700">
      {surtitre && <span className="mb-1.5 block text-[0.6rem] uppercase tracking-[0.06em] text-ink-soft">{surtitre}</span>}
      <span className="block font-display text-3xl font-extrabold">{f({ day: "numeric" })}</span>
      <span className="mt-1.5 block text-[0.68rem] font-bold uppercase tracking-[0.14em]">{f({ month: "short" })}</span>
    </div>
  );
}

/** Bandeau de titre en haut des pages intérieures (registre institutionnel). */
export function PageHeader({
  eyebrow,
  title,
  lead,
  aside,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  /** Contenu affiché à côté du titre sur grand écran, dessous sur mobile (ex. chiffres clés). */
  aside?: React.ReactNode;
}) {
  return (
    <section className="fond-bordeaux filigrane relative overflow-hidden">
      <SceauFiligrane className="-right-24 -top-24 size-[420px] sm:-right-16" />
      <div className={`relative mx-auto max-w-5xl px-4 py-14 sm:px-8 sm:py-20 ${aside ? "grid items-end gap-10 lg:max-w-6xl lg:grid-cols-[1fr_auto]" : ""}`}>
        <div>
          <p className="apparait eyebrow text-white/76">{eyebrow}</p>
          <h1 className="apparait mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.1] sm:text-5xl" style={{ animationDelay: "80ms" }}>
            {title}
          </h1>
          {lead && (
            <p className="apparait mt-5 max-w-[56ch] text-lg text-white/76" style={{ animationDelay: "160ms" }}>
              {lead}
            </p>
          )}
        </div>
        {aside && (
          <div className="apparait" style={{ animationDelay: "240ms" }}>
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}

/** Encadré centré pour les pages courtes à formulaire (connexion, inscription…). */
export function CarteFormulaire({
  titre,
  intro,
  children,
}: {
  titre: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="apparait grid overflow-hidden rounded-abm-lg border border-bordeaux-700/20 bg-white shadow-abm-raised lg:grid-cols-[0.9fr_1.1fr]">
        {/* Volet de marque (grand écran) : sceau et devise du réseau */}
        <div className="fond-bordeaux filigrane relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
          <SceauFiligrane className="-bottom-28 -left-24 size-[420px]" />
          <Image src="/brand/logo-abm-seal-white.png" alt="" width={72} height={72} className="relative" />
          <div className="relative">
            <p className="font-display text-3xl font-bold leading-tight">Le réseau des anciens de la bi-licence</p>
            <p className="mt-4 text-sm text-white/76">
              Annuaire, archive des stages, offres et événements, réservés aux membres validés par le bureau.
            </p>
          </div>
        </div>
        <div className="relative p-6 sm:p-10 lg:p-12">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[image:var(--degrade-bouton)] lg:hidden" />
          <h1 className="font-display text-3xl font-bold text-bordeaux-700">{titre}</h1>
          {intro && <div className="mt-3 text-sm text-ink-soft">{intro}</div>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Lien texte souligné, couleur bordeaux. */
export const classeLien = "text-bordeaux-700 underline underline-offset-4 hover:text-bordeaux-500";

/** Pastille (statut, catégorie…). */
export function Pastille({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={
        accent
          ? "inline-block rounded-abm-pill bg-bordeaux-700 px-2.5 py-0.5 text-xs font-semibold text-white"
          : "inline-block rounded-abm-pill border border-bordeaux-700/30 px-2.5 py-0.5 text-xs font-semibold text-bordeaux-700"
      }
    >
      {children}
    </span>
  );
}

/** Titre de section à l'intérieur d'une page. */
export function TitreSection({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-bordeaux-700/15 pb-3">
      <div>
        <h2 className="font-display text-xl font-bold text-bordeaux-700">{children}</h2>
        <FiletTitre className="mt-2" />
      </div>
      {action}
    </div>
  );
}

/** Message affiché quand une liste est vide. */
export function Vide({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Image src="/brand/logo-abm-seal-bordeaux.png" alt="" width={44} height={44} className="opacity-25" />
      <p className="max-w-[44ch] text-sm text-ink-soft">{children}</p>
    </div>
  );
}

/**
 * Emplacement clairement signalé pour un contenu pas encore fourni
 * (texte à rédiger, lien à ajouter). Ne jamais le remplacer par du faux contenu.
 */
export function AFaire({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-abm-sm border border-dashed border-bordeaux-300 bg-white px-4 py-3 text-sm text-ink-soft">
      <span className="font-semibold text-bordeaux-700">À compléter — </span>
      {children}
    </div>
  );
}

/** Emplacement d'image vide, aux bonnes proportions, en attendant la vraie photo. */
export function ImageAFaire({ label, ratio = "4 / 5" }: { label: string; ratio?: string }) {
  return (
    <div
      className="flex items-center justify-center border border-dashed border-bordeaux-300 bg-white p-4 text-center text-xs text-ink-soft"
      style={{ aspectRatio: ratio }}
    >
      {label}
    </div>
  );
}
