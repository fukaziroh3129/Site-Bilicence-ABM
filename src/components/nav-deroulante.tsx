"use client";

// Barre de navigation à menus déroulants, commune à l'espace membres et à l'administration : les
// rubriques regroupées (« Réseau », « Membres »…) s'ouvrent en menu sur grand écran, et tout passe en
// menu plein écran sur téléphone et tablette. Pour un compte en attente de validation, les rubriques
// réservées aux membres affichent un cadenas et ouvrent une fenêtre d'explication (DialogueRestreint).

import {
  Archive,
  BookUser,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  GalleryHorizontalEnd,
  Globe,
  House,
  IdCard,
  Landmark,
  LayoutDashboard,
  Lock,
  Menu,
  Newspaper,
  ShieldCheck,
  Tags,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EntreeMenu, LienMenu } from "@/lib/site";

const ICONES: Record<string, LucideIcon> = {
  accueil: House,
  annuaire: BookUser,
  parcours: GalleryHorizontalEnd,
  stages: Archive,
  offres: BriefcaseBusiness,
  evenements: CalendarDays,
  erasmus: Globe,
  fiche: IdCard,
  compte: UserCog,
  admin: ShieldCheck,
  // Administration
  tableau: LayoutDashboard,
  comptes: Users,
  precomptes: UserPlus,
  domaines: Tags,
  etablissements: Landmark,
  actualites: Newspaper,
  bureau: UsersRound,
};

/** Événement écouté par DialogueRestreint. */
export const EVENEMENT_RESTREINT = "abm:acces-restreint";

function signalerRestreint(rubrique: string) {
  window.dispatchEvent(new CustomEvent(EVENEMENT_RESTREINT, { detail: { rubrique } }));
}

/** `racine` : lien « accueil » de la section (/espace, /admin), actif seulement sur sa page exacte. */
function estActif(chemin: string, href: string, racine: string) {
  return href === racine ? chemin === racine : chemin === href || chemin.startsWith(`${href}/`);
}

/** Un lien du menu, ou un bouton « cadenas » si la rubrique est fermée au compte en attente. */
function Lien({
  lien,
  racine,
  bloque,
  className,
  onChoisir,
  children,
}: {
  lien: LienMenu;
  racine: string;
  bloque: boolean;
  className: string;
  onChoisir?: () => void;
  children: React.ReactNode;
}) {
  const chemin = usePathname();
  if (bloque) {
    return (
      <button
        type="button"
        aria-haspopup="dialog"
        className={`${className} text-left`}
        onClick={() => {
          onChoisir?.();
          signalerRestreint(lien.label);
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <Link
      href={lien.href}
      aria-current={estActif(chemin, lien.href, racine) ? "page" : undefined}
      className={className}
      onClick={onChoisir}
    >
      {children}
    </Link>
  );
}

const classeOnglet =
  "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors duration-200 aria-[current=page]:border-bordeaux-700 aria-[current=page]:font-semibold aria-[current=page]:text-bordeaux-700";

function MenuDeroulant({
  entree,
  racine,
  enAttente,
  ouvert,
  onBasculer,
  onFermer,
}: {
  entree: { label: string; liens: LienMenu[] };
  racine: string;
  enAttente: boolean;
  ouvert: boolean;
  onBasculer: () => void;
  onFermer: () => void;
}) {
  const chemin = usePathname();
  const actif = entree.liens.some((l) => estActif(chemin, l.href, racine));
  // Identifiant sans accent ni espace (ex. « Mon profil » → menu-mon-profil).
  const id = `menu-${entree.label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <li className="relative">
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={onBasculer}
        className={`${classeOnglet} ${
          actif ? "border-bordeaux-700 font-semibold text-bordeaux-700" : "border-transparent text-ink-soft hover:text-bordeaux-700"
        }`}
      >
        {entree.label}
        <ChevronDown size={15} aria-hidden className={`transition-transform duration-300 ${ouvert ? "rotate-180" : ""}`} />
      </button>
      {ouvert && (
        <div
          id={id}
          className="apparait absolute left-0 top-full z-30 mt-1 w-[340px] overflow-hidden rounded-abm-md border border-bordeaux-700/15 bg-white shadow-abm-raised"
        >
          <div aria-hidden className="h-1 bg-[image:var(--degrade-bouton)]" />
          <ul className="p-2">
            {entree.liens.map((lien) => {
              const Icone = ICONES[lien.icone ?? ""] ?? House;
              const bloque = enAttente && !!lien.restreint;
              return (
                <li key={lien.href}>
                  <Lien
                    lien={lien}
                    racine={racine}
                    bloque={bloque}
                    onChoisir={onFermer}
                    className="group flex w-full items-start gap-3 rounded-abm-sm p-3 transition-colors duration-200 hover:bg-bordeaux-100/50 aria-[current=page]:bg-bordeaux-100/60"
                  >
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-abm-sm bg-bordeaux-100 text-bordeaux-700 transition-colors duration-200 group-hover:bg-bordeaux-700 group-hover:text-white">
                      <Icone size={18} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-semibold text-ink">
                        {lien.label}
                        {bloque && <Lock size={13} aria-label="réservé aux membres validés" className="text-ink-soft" />}
                      </span>
                      {lien.description && <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{lien.description}</span>}
                    </span>
                  </Lien>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

/** Menu plein écran : les liens simples consécutifs sont regroupés, dans l'ordre du menu. */
function groupesMobile(entrees: EntreeMenu[]) {
  const groupes: { label: string | null; liens: LienMenu[] }[] = [];
  for (const e of entrees) {
    if ("liens" in e) groupes.push({ label: e.label, liens: e.liens });
    else if (groupes.at(-1)?.label === null) groupes.at(-1)!.liens.push(e);
    else groupes.push({ label: null, liens: [e] });
  }
  return groupes;
}

export function NavDeroulante({
  entrees,
  racine,
  libelle,
  titre,
  enAttente = false,
}: {
  entrees: EntreeMenu[];
  /** Lien « accueil » de la section, actif seulement sur sa page exacte. */
  racine: string;
  /** Nom accessible de la barre (aria-label). */
  libelle: string;
  /** Titre du menu plein écran, et libellé du bouton quand aucune page n'est active. */
  titre: string;
  enAttente?: boolean;
}) {
  const chemin = usePathname();
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const barre = useRef<HTMLUListElement>(null);

  // Fermeture des menus : changement de page, touche Échap, clic ailleurs.
  const [cheminVu, setCheminVu] = useState(chemin);
  if (cheminVu !== chemin) {
    setCheminVu(chemin);
    setMenuOuvert(null);
    setMobileOuvert(false);
  }
  useEffect(() => {
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOuvert(null);
        setMobileOuvert(false);
      }
    };
    const clic = (e: MouseEvent) => {
      if (barre.current && !barre.current.contains(e.target as Node)) setMenuOuvert(null);
    };
    document.addEventListener("keydown", echap);
    document.addEventListener("mousedown", clic);
    return () => {
      document.removeEventListener("keydown", echap);
      document.removeEventListener("mousedown", clic);
    };
  }, []);

  // Menu plein écran : page figée derrière.
  useEffect(() => {
    if (!mobileOuvert) return;
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = avant;
    };
  }, [mobileOuvert]);

  const tousLesLiens = entrees.flatMap((e) => ("liens" in e ? e.liens : [e]));
  const courant = tousLesLiens.find((l) => estActif(chemin, l.href, racine));
  const idMobile = `menu-mobile-${racine.replace(/\W/g, "")}`;

  return (
    <nav aria-label={libelle}>
      {/* Ordinateur */}
      <ul ref={barre} className="hidden items-center gap-1 lg:flex">
        {entrees.map((entree) =>
          "liens" in entree ? (
            <MenuDeroulant
              key={entree.label}
              entree={entree}
              racine={racine}
              enAttente={enAttente}
              ouvert={menuOuvert === entree.label}
              onBasculer={() => setMenuOuvert((m) => (m === entree.label ? null : entree.label))}
              onFermer={() => setMenuOuvert(null)}
            />
          ) : (
            <li key={entree.href}>
              <Lien
                lien={entree}
                racine={racine}
                bloque={enAttente && !!entree.restreint}
                className={`${classeOnglet} border-transparent text-ink-soft hover:text-bordeaux-700`}
              >
                {entree.label}
              </Lien>
            </li>
          ),
        )}
      </ul>

      {/* Téléphone et tablette : un bouton qui ouvre le menu en plein écran */}
      <button
        type="button"
        onClick={() => setMobileOuvert(true)}
        aria-expanded={mobileOuvert}
        aria-controls={idMobile}
        className="flex items-center gap-2 py-3 text-sm font-semibold text-bordeaux-700 lg:hidden"
      >
        <Menu size={20} aria-hidden />
        {courant?.label ?? titre}
        <span className="sr-only">: ouvrir le menu — {titre}</span>
      </button>

      {/* Rendu directement dans <body> : l'animation d'entrée des pages (template.tsx) empêcherait
          sinon le menu de couvrir tout l'écran. */}
      {mobileOuvert &&
        createPortal(
          <div id={idMobile} className="apparait fixed inset-0 z-50 overflow-y-auto bg-paper lg:hidden">
            <div className="fond-bordeaux filigrane flex items-center justify-between px-5 py-5">
              <p className="font-display text-2xl font-bold text-white">{titre}</p>
              <button
                type="button"
                onClick={() => setMobileOuvert(false)}
                className="grid size-11 place-items-center rounded-abm-pill text-white hover:bg-white/12"
              >
                <X size={24} aria-hidden />
                <span className="sr-only">Fermer le menu</span>
              </button>
            </div>
            <div className="space-y-6 px-5 py-6">
              {groupesMobile(entrees).map((groupe, i) => (
                <section key={groupe.label ?? i}>
                  {groupe.label && <p className="eyebrow mb-2 text-bordeaux-500">{groupe.label}</p>}
                  <ul className="divide-y divide-bordeaux-700/10 rounded-abm-md border border-bordeaux-700/15 bg-white">
                    {groupe.liens.map((lien) => {
                      const Icone = ICONES[lien.icone ?? ""] ?? House;
                      const bloque = enAttente && !!lien.restreint;
                      return (
                        <li key={lien.href}>
                          <Lien
                            lien={lien}
                            racine={racine}
                            bloque={bloque}
                            onChoisir={() => setMobileOuvert(false)}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-base text-ink aria-[current=page]:font-semibold aria-[current=page]:text-bordeaux-700"
                          >
                            <Icone size={20} aria-hidden className="shrink-0 text-bordeaux-700" />
                            <span className="flex-1">{lien.label}</span>
                            {bloque && <Lock size={15} aria-label="réservé aux membres validés" className="text-ink-soft" />}
                          </Lien>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </nav>
  );
}
