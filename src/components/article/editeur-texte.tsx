"use client";

// Éditeur du texte d'une publication : une zone de texte avec barre d'outils (gras, titres, couleurs, encadrés,
// images…) et un onglet « Aperçu » qui utilise le même affichage que la page publique.
//
// Le texte reste un texte simple avec quelques balises (voir src/lib/article-texte.ts) : la barre d'outils ne fait
// qu'écrire ces balises à la place de l'utilisateur, qui peut aussi les taper à la main (aide-mémoire en bas).

import {
  Bold,
  CircleHelp,
  Eye,
  Highlighter,
  ImagePlus,
  Images,
  Italic,
  Link as IconeLien,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  MousePointerClick,
  Pencil,
  RemoveFormatting,
  Strikethrough,
  TextQuote,
  Underline,
} from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { televerserImageTexte } from "@/actions/admin";
import { CorpsArticle } from "@/components/article/corps-article";
import { valeur as valeurInitiale } from "@/components/formulaire";
import { adresseSure, lireArticle, POLICES, POSITIONS_IMAGE, TAILLES, TAILLES_IMAGE } from "@/lib/article-texte";
import type { EtatFormulaire } from "@/lib/formulaire";

// ─── Modèles de départ ─────────────────────────────────────────────────────────

const MODELES: Record<string, { libelle: string; texte: string }> = {
  evenement: {
    libelle: "Compte rendu d’événement",
    texte: `Racontez en quelques lignes comment s’est déroulé l’événement : l’ambiance, les invités, ce qu’on en retient.

:::chiffres
- **60** participants
- **3** intervenants
- **2 h** d’échanges
:::

## Les temps forts

- Premier temps fort
- Deuxième temps fort
- Troisième temps fort

> Une phrase marquante entendue pendant la soirée.
> — Nom de la personne

## En images

Ajoutez vos photos avec le bouton « Galerie » de la barre d’outils.

:::info Pour aller plus loin
Un lien, la date du prochain rendez-vous, un remerciement.
:::`,
  },
  portrait: {
    libelle: "Portrait d’ancien ou d’étudiant",
    texte: `Présentez la personne en quelques lignes : sa promotion, son parcours, ce qu’elle fait aujourd’hui.

## Son parcours après la bi-licence

Master, école, premier poste : racontez les étapes importantes.

:::chiffres
- **2021** entrée en bi-licence
- **2024** diplôme obtenu
:::

## Trois questions

**Un souvenir de la bi-licence ?**
Sa réponse.

**Ce que la bi-licence lui a apporté ?**
Sa réponse.

> Une phrase qui résume son état d’esprit.
> — Prénom Nom

:::conseil Son conseil aux étudiants
Un conseil concret pour celles et ceux qui arrivent derrière.
:::`,
  },
  annonce: {
    libelle: "Annonce avec inscription",
    texte: `:::important À retenir
La date, le lieu et la date limite d’inscription, en une phrase.
:::

Expliquez de quoi il s’agit, à qui cela s’adresse et ce que chacun y trouvera.

## Comment participer

1. Première étape
2. Deuxième étape
3. Troisième étape

:::centre
[Je m’inscris](https://exemple.fr){.bouton}
:::`,
  },
};

const BLOCS: Record<string, { libelle: string; texte?: string; titre?: string; exemple: string }> = {
  info: { libelle: "Encadré « Info »", titre: "Bon à savoir", exemple: "Texte de l’encadré." },
  important: { libelle: "Encadré « Important » (bordeaux)", titre: "À retenir", exemple: "Texte de l’encadré." },
  conseil: { libelle: "Encadré « Conseil »", titre: "Notre conseil", exemple: "Texte du conseil." },
  rose: { libelle: "Fond rose pâle", exemple: "Texte mis en valeur." },
  beige: { libelle: "Fond beige papier", exemple: "Texte mis en valeur." },
  bordeaux: { libelle: "Fond bordeaux", exemple: "Texte mis en valeur." },
  centre: { libelle: "Texte centré", exemple: "Texte centré." },
  chiffres: { libelle: "Chiffres clés", exemple: "- **120** inscrits\n- **3** promotions\n- **14** pays" },
  colonnes: { libelle: "Deux colonnes", exemple: "Première colonne\n\n+++\n\nSeconde colonne" },
};

const SWATCHES_TEXTE = [
  { classe: "bordeaux", libelle: "Bordeaux", css: "bg-white text-bordeaux-700" },
  { classe: "rose", libelle: "Rose", css: "bg-white text-bordeaux-400" },
  { classe: "gris", libelle: "Gris", css: "bg-white text-ink-soft" },
  { classe: "blanc", libelle: "Blanc (pour un fond foncé)", css: "bg-bordeaux-700 text-white" },
] as const;

const SWATCHES_FOND = [
  { classe: "fond-rose", libelle: "Fond rose pâle", css: "bg-rose-pale" },
  { classe: "fond-beige", libelle: "Fond beige", css: "bg-beige-papier" },
  { classe: "fond-bordeaux", libelle: "Fond bordeaux", css: "bg-bordeaux-700" },
] as const;

const COULEURS_TOUTES = SWATCHES_TEXTE.map((s) => s.classe) as string[];
const FONDS_TOUS = SWATCHES_FOND.map((s) => s.classe) as string[];

const AIDE: { saisie: string; resultat: string }[] = [
  { saisie: "## Titre de section", resultat: "Grand titre (alimente le sommaire)" },
  { saisie: "### Sous-titre", resultat: "Titre plus petit" },
  { saisie: "**gras**  *italique*  ++souligné++", resultat: "Mise en valeur du texte" },
  { saisie: "~~barré~~  ==surligné==", resultat: "Texte barré, texte surligné" },
  { saisie: "[mot]{.bordeaux .grand .script}", resultat: "Couleur, taille et police d’un passage" },
  { saisie: "- puce   1. numéro   - [ ] case", resultat: "Listes (une ligne par élément)" },
  { saisie: "> Citation\n> — Nom", resultat: "Grande citation avec son auteur" },
  { saisie: "---", resultat: "Séparateur orné" },
  { saisie: "[texte](https://…)", resultat: "Lien" },
  { saisie: "[Je m’inscris](https://…){.bouton}", resultat: "Bouton" },
  { saisie: "![Légende](adresse){.petite .droite}", resultat: "Image (utilisez plutôt le bouton « Image »)" },
  { saisie: ":::info Titre\nTexte\n:::", resultat: "Encadré (info, important, conseil, rose, beige, bordeaux, centre)" },
  { saisie: ":::chiffres\n- **120** inscrits\n:::", resultat: "Chiffres clés en grand" },
  { saisie: ":::colonnes\nA\n\n+++\n\nB\n:::", resultat: "Deux colonnes" },
  { saisie: "\\*", resultat: "Écrire un caractère spécial tel quel (\\* \\[ \\{)" },
];

// ─── Outils de texte ───────────────────────────────────────────────────────────

const RE_IMAGE_LIGNE = /^(!\[[^\]]*\]\([^)\s]+\))\s*(?:\{([^}]*)\})?$/;
const RE_SPAN = /^\[([\s\S]*)\]\{((?:\s*\.[a-z-]+)+)\s*\}$/;

type LigneImage = { debut: number; fin: number; base: string; classes: string[] };

/** La ligne du curseur, si c'est une image (pour proposer sa taille et sa place). */
function ligneImageA(texte: string, position: number): LigneImage | null {
  const debut = position === 0 ? 0 : texte.lastIndexOf("\n", position - 1) + 1;
  let fin = texte.indexOf("\n", position);
  if (fin < 0) fin = texte.length;
  const m = RE_IMAGE_LIGNE.exec(texte.slice(debut, fin).trim());
  if (!m) return null;
  return { debut, fin, base: m[1], classes: [...(m[2] ?? "").matchAll(/\.([a-z-]+)/g)].map((x) => x[1]) };
}

const classesDe = (attributs: string) => [...attributs.matchAll(/\.([a-z-]+)/g)].map((m) => m[1]);

/** Complète une adresse saisie à la main : « www.site.fr » → https, « a@b.fr » → mailto. */
function normaliserAdresse(saisie: string) {
  const v = saisie.trim();
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(v)) return `mailto:${v}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith("/") || v.startsWith("#")) return v;
  return v ? `https://${v}` : v;
}

const classeOutil =
  "inline-flex size-9 items-center justify-center rounded-abm-sm border border-transparent text-bordeaux-700 transition-colors hover:border-bordeaux-700/30 hover:bg-bordeaux-100/60 focus-visible:outline-2 focus-visible:outline-bordeaux-700 disabled:cursor-not-allowed disabled:opacity-40";
const classeListe =
  "h-9 rounded-abm-sm border border-bordeaux-700/20 bg-white px-2 text-sm text-bordeaux-700 hover:border-bordeaux-700/50 focus-visible:outline-2 focus-visible:outline-bordeaux-700";
const classeGroupe = "flex flex-wrap items-center gap-0.5 border-r border-bordeaux-700/15 pr-2 last:border-r-0";

function Outil({ libelle, onClick, children, disabled }: { libelle: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={libelle} title={libelle} disabled={disabled} className={classeOutil}>
      {children}
    </button>
  );
}

/** Menu déroulant d'actions : revient toujours sur son intitulé après le choix. */
function MenuOutil({
  libelle,
  options,
  onChoix,
  disabled,
}: {
  libelle: string;
  options: { valeur: string; libelle: string }[];
  onChoix: (valeur: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={libelle}
      title={libelle}
      value=""
      disabled={disabled}
      onChange={(e) => onChoix(e.target.value)}
      className={classeListe}
    >
      <option value="" disabled>
        {libelle}
      </option>
      {options.map((o) => (
        <option key={o.valeur} value={o.valeur}>
          {o.libelle}
        </option>
      ))}
    </select>
  );
}

// ─── Éditeur ───────────────────────────────────────────────────────────────────

export function EditeurTexte({
  nom,
  libelle,
  defaultValue,
  etat,
  requis,
  maxLength,
  aide,
}: {
  nom: string;
  libelle: string;
  defaultValue?: string | null;
  etat: EtatFormulaire;
  requis?: boolean;
  maxLength: number;
  aide?: string;
}) {
  const zone = useRef<HTMLTextAreaElement>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const modeFichier = useRef<"image" | "galerie">("image");
  const selection = useRef({ debut: 0, fin: 0 });

  const [texte, setTexte] = useState(() => valeurInitiale(etat, nom, defaultValue));
  const [onglet, setOnglet] = useState<"ecrire" | "apercu">("ecrire");
  const [curseur, setCurseur] = useState(0);
  const [panneau, setPanneau] = useState<null | "lien" | "bouton">(null);
  const [adresse, setAdresse] = useState("");
  const [problemeAdresse, setProblemeAdresse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [messageEnvoi, setMessageEnvoi] = useState<{ erreur: boolean; texte: string } | null>(null);

  const erreur = etat?.erreurs?.[nom];
  const apercu = useDeferredValue(texte);
  const lu = useMemo(() => (onglet === "apercu" ? lireArticle(apercu) : null), [apercu, onglet]);
  const ligneImage = useMemo(() => ligneImageA(texte, curseur), [texte, curseur]);

  // ── Écriture dans la zone de texte ──────────────────────────────────────────

  /** Remplace une partie du texte en gardant l'historique « Annuler » du navigateur. */
  function remplacer(debut: number, fin: number, nouveau: string, selDebut: number, selFin: number) {
    const ta = zone.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(debut, fin);
    // Les anciens navigateurs refusent insertText : on retombe alors sur une insertion simple.
    if (!document.execCommand("insertText", false, nouveau)) {
      ta.setRangeText(nouveau, debut, fin, "end");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
    ta.setSelectionRange(selDebut, selFin);
    selection.current = { debut: selDebut, fin: selFin };
    setCurseur(selFin);
  }

  function lireSelection() {
    const ta = zone.current!;
    return { d: ta.selectionStart, f: ta.selectionEnd, v: ta.value };
  }

  /** Comme lireSelection, sans les espaces en bout de sélection (un double-clic sélectionne l'espace qui suit le mot). */
  function lireSelectionSansEspaces() {
    const { d, f, v } = lireSelection();
    const sel = v.slice(d, f);
    const avant = sel.length - sel.trimStart().length;
    const apres = sel.length - sel.trimEnd().length;
    if (avant + apres >= sel.length) return { d, f, v };
    return { d: d + avant, f: f - apres, v };
  }

  /** Entoure la sélection de balises (**gras**…) ; un second clic les retire. */
  function entourer(avant: string, apres: string, exemple: string) {
    const { d, f, v } = lireSelectionSansEspaces();
    const sel = v.slice(d, f);
    // Un « * » faisant partie d'un « ** » (gras) n'est pas la balise de l'italique.
    const partDeGras = avant === "*" && (v[d - 2] === "*" || v[f + 1] === "*");
    if (!partDeGras && v.slice(d - avant.length, d) === avant && v.slice(f, f + apres.length) === apres) {
      remplacer(d - avant.length, f + apres.length, sel, d - avant.length, d - avant.length + sel.length);
    } else if (sel.length > avant.length + apres.length && sel.startsWith(avant) && sel.endsWith(apres)) {
      const interieur = sel.slice(avant.length, sel.length - apres.length);
      remplacer(d, f, interieur, d, d + interieur.length);
    } else {
      const contenu = sel || exemple;
      remplacer(d, f, avant + contenu + apres, d + avant.length, d + avant.length + contenu.length);
    }
  }

  /** Lignes touchées par la sélection. */
  function lignesSelectionnees() {
    const { d, f, v } = lireSelection();
    const debut = d === 0 ? 0 : v.lastIndexOf("\n", d - 1) + 1;
    let fin = v.indexOf("\n", f > d && v[f - 1] === "\n" ? f - 1 : f);
    if (fin < 0) fin = v.length;
    return { debut, fin, lignes: v.slice(debut, fin).split("\n") };
  }

  function titre(niveau: 0 | 2 | 3) {
    const { debut, fin, lignes } = lignesSelectionnees();
    const nettoyees = lignes.map((l) => l.replace(/^#{1,4}\s+/, ""));
    const prefixe = niveau === 0 ? "" : `${"#".repeat(niveau)} `;
    const nouveau = nettoyees.map((l) => (prefixe && l === "" ? `${prefixe}Titre` : prefixe + l)).join("\n");
    remplacer(debut, fin, nouveau, debut + prefixe.length, debut + nouveau.length);
  }

  function liste(type: "puces" | "numeros" | "cases") {
    const { debut, fin, lignes } = lignesSelectionnees();
    const motif = type === "numeros" ? /^\d{1,2}[.)]\s+/ : type === "cases" ? /^[-*+]\s+\[[ xX]\]\s+/ : /^[-*+]\s+(?!\[[ xX]\]\s)/;
    const prefixeDe = (i: number) => (type === "numeros" ? `${i + 1}. ` : type === "cases" ? "- [ ] " : "- ");
    const toutes = lignes.every((l) => motif.test(l));
    const nettoyees = lignes.map((l) => l.replace(/^([-*+]|\d{1,2}[.)])\s+(\[[ xX]\]\s+)?/, ""));
    const nouveau = toutes ? nettoyees.join("\n") : nettoyees.map((l, i) => prefixeDe(i) + (l || "Élément")).join("\n");
    remplacer(debut, fin, nouveau, debut, debut + nouveau.length);
  }

  /**
   * Insère un bloc entre deux lignes vides, à l'endroit du curseur. Le texte sélectionné est conservé
   * (le bloc vient après lui), sauf avec `remplacerSelection` : le bloc l'englobe alors déjà.
   */
  function inserer(bloc: string, selDebut = 0, selFin = bloc.length, remplacerSelection = false) {
    const { d, f, v } = lireSelection();
    const debutRemplace = remplacerSelection ? d : f;
    const avant = v.slice(0, debutRemplace);
    const apres = v.slice(f);
    const pre = debutRemplace === 0 || /\n\n$/.test(avant) ? "" : /\n$/.test(avant) ? "\n" : "\n\n";
    const post = apres === "" ? "\n" : /^\n\n/.test(apres) ? "" : /^\n/.test(apres) ? "\n" : "\n\n";
    const depart = debutRemplace + pre.length;
    remplacer(debutRemplace, f, pre + bloc + post, depart + selDebut, depart + selFin);
  }

  function citation() {
    const { d, f, v } = lireSelection();
    const sel = v.slice(d, f);
    if (sel) {
      const nouveau = sel
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
      inserer(nouveau + "\n> — Nom de l’auteur", 0, nouveau.length, true);
    } else {
      inserer("> Votre citation.\n> — Nom de l’auteur", 2, 17);
    }
  }

  function bloc(cle: string) {
    const b = BLOCS[cle];
    if (!b) return;
    const { d, f, v } = lireSelection();
    const sel = v.slice(d, f);
    const entete = `:::${cle}${b.titre ? ` ${b.titre}` : ""}`;
    const contenu = sel || b.exemple;
    const debutContenu = entete.length + 1;
    inserer(`${entete}\n${contenu}\n:::`, debutContenu, debutContenu + contenu.length, sel !== "");
  }

  function modele(cle: string) {
    const m = MODELES[cle];
    if (m) inserer(m.texte, 0, 0);
  }

  /** Couleur, fond, taille ou police d'un passage : [texte]{.classe}. Un second clic sur la même classe la retire. */
  function style(classe: string | null, groupe: readonly string[]) {
    const { d, f, v } = lireSelectionSansEspaces();
    let debut = d;
    let fin = f;
    let interieur = v.slice(d, f);
    let classes: string[] = [];
    let enveloppe = false;

    const complet = RE_SPAN.exec(interieur);
    const suite = /^\]\{((?:\s*\.[a-z-]+)+)\s*\}/.exec(v.slice(f));
    if (complet) {
      interieur = complet[1];
      classes = classesDe(complet[2]);
      enveloppe = true;
    } else if (suite && v[d - 1] === "[" && interieur) {
      // Le texte à l'intérieur d'un passage déjà stylé est sélectionné : on modifie ce passage.
      classes = classesDe(suite[1]);
      debut = d - 1;
      fin = f + suite[0].length;
      enveloppe = true;
    }

    const autres = classes.filter((c) => !groupe.includes(c));
    const dejaLa = classe !== null && classes.includes(classe);
    const nouvelles = classe === null || dejaLa ? autres : [...autres, classe];

    if (!enveloppe && classe === null) return; // rien à retirer
    const texteFinal = interieur || "texte";
    const resultat = nouvelles.length === 0 ? texteFinal : `[${texteFinal}]{${nouvelles.map((c) => `.${c}`).join(" ")}}`;
    const decalage = nouvelles.length === 0 ? 0 : 1;
    remplacer(debut, fin, resultat, debut + decalage, debut + decalage + texteFinal.length);
  }

  function reglerImage(ajout: string, groupe: readonly string[]) {
    if (!ligneImage) return;
    const classes = ligneImage.classes.filter((c) => !groupe.includes(c));
    if (!ligneImage.classes.includes(ajout)) classes.push(ajout);
    const nouvelle = classes.length > 0 ? `${ligneImage.base}{${classes.map((c) => `.${c}`).join(" ")}}` : ligneImage.base;
    remplacer(ligneImage.debut, ligneImage.fin, nouvelle, ligneImage.debut + nouvelle.length, ligneImage.debut + nouvelle.length);
  }

  // ── Liens et boutons ────────────────────────────────────────────────────────

  function ouvrirPanneau(type: "lien" | "bouton") {
    const { d, f } = lireSelection();
    selection.current = { debut: d, fin: f };
    setAdresse("");
    setProblemeAdresse("");
    setPanneau(type);
  }

  function validerAdresse() {
    const ta = zone.current!;
    const complete = normaliserAdresse(adresse);
    const sure = adresseSure(complete);
    if (!sure) {
      setProblemeAdresse("Adresse non valide. Exemple : https://www.exemple.fr");
      return;
    }
    const { debut, fin } = selection.current;
    const sel = ta.value.slice(debut, fin);
    const intitule = sel || (panneau === "bouton" ? "Mon bouton" : "texte du lien");
    const balise = `[${intitule}](${sure})${panneau === "bouton" ? "{.bouton}" : ""}`;
    setPanneau(null);
    remplacer(debut, fin, balise, debut + 1, debut + 1 + intitule.length);
  }

  // ── Images ──────────────────────────────────────────────────────────────────

  function choisirImages(mode: "image" | "galerie") {
    const { d, f } = lireSelection();
    selection.current = { debut: d, fin: f };
    modeFichier.current = mode;
    if (fichier.current) {
      fichier.current.multiple = mode === "galerie";
      fichier.current.click();
    }
  }

  async function envoyerImages(fichiers: FileList | null) {
    if (!fichiers || fichiers.length === 0) return;
    setEnvoi(true);
    setMessageEnvoi({ erreur: false, texte: "Envoi de l’image…" });
    const adresses: string[] = [];
    for (const f of Array.from(fichiers)) {
      const donnees = new FormData();
      donnees.set("image", f);
      try {
        const reponse = await televerserImageTexte(donnees);
        if (reponse.url) adresses.push(reponse.url);
        else {
          setMessageEnvoi({ erreur: true, texte: `${f.name} : ${reponse.erreur ?? "envoi impossible."}` });
          break;
        }
      } catch {
        setMessageEnvoi({ erreur: true, texte: "L’envoi a échoué. Vérifiez votre connexion et réessayez." });
        break;
      }
    }
    setEnvoi(false);
    if (fichier.current) fichier.current.value = "";
    if (adresses.length === 0) return;
    setMessageEnvoi(null);

    const { debut, fin } = selection.current;
    zone.current?.focus();
    zone.current?.setSelectionRange(debut, fin);
    if (modeFichier.current === "galerie") {
      const lignes = adresses.map((a) => `![Légende](${a})`).join("\n\n");
      inserer(`:::galerie\n${lignes}\n:::`, 0, 0);
    } else {
      const ligne = `![Légende de l’image](${adresses[0]})`;
      inserer(ligne, 2, 2 + "Légende de l’image".length);
    }
  }

  // ── Clavier ─────────────────────────────────────────────────────────────────

  function surTouche(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const touche = e.key.toLowerCase();
    if (touche === "b") entourer("**", "**", "texte en gras");
    else if (touche === "i") entourer("*", "*", "texte en italique");
    else if (touche === "u") entourer("++", "++", "texte souligné");
    else if (touche === "k") ouvrirPanneau("lien");
    else return;
    e.preventDefault();
  }

  const suivreCurseur = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    selection.current = { debut: ta.selectionStart, fin: ta.selectionEnd };
    setCurseur(ta.selectionStart);
  };

  const ecriture = onglet === "ecrire";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor={nom} className="block text-sm font-semibold text-ink">
          {libelle}
          {requis && <span className="text-bordeaux-500"> *</span>}
        </label>
        <div role="tablist" aria-label="Écrire ou prévisualiser" className="flex border border-bordeaux-700/30">
          {(
            [
              ["ecrire", "Écrire", Pencil],
              ["apercu", "Aperçu", Eye],
            ] as const
          ).map(([valeur, intitule, Icone]) => (
            <button
              key={valeur}
              type="button"
              role="tab"
              aria-selected={onglet === valeur}
              onClick={() => setOnglet(valeur)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-bordeaux-700 ${
                onglet === valeur ? "bg-bordeaux-700 text-white" : "bg-white text-bordeaux-700 hover:bg-bordeaux-100/60"
              }`}
            >
              <Icone size={15} aria-hidden /> {intitule}
            </button>
          ))}
        </div>
      </div>

      {/* Barre d'outils */}
      <div
        role="toolbar"
        aria-label="Mise en forme du texte"
        hidden={!ecriture}
        className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 border border-b-0 border-bordeaux-700/30 bg-beige-papier/50 p-2"
      >
        <div className={classeGroupe}>
          <MenuOutil
            libelle="Titre"
            onChoix={(v) => titre(Number(v) as 0 | 2 | 3)}
            options={[
              { valeur: "2", libelle: "Titre de section" },
              { valeur: "3", libelle: "Sous-titre" },
              { valeur: "0", libelle: "Paragraphe normal" },
            ]}
          />
        </div>
        <div className={classeGroupe}>
          <Outil libelle="Gras (Ctrl+B)" onClick={() => entourer("**", "**", "texte en gras")}>
            <Bold size={18} aria-hidden />
          </Outil>
          <Outil libelle="Italique (Ctrl+I)" onClick={() => entourer("*", "*", "texte en italique")}>
            <Italic size={18} aria-hidden />
          </Outil>
          <Outil libelle="Souligné (Ctrl+U)" onClick={() => entourer("++", "++", "texte souligné")}>
            <Underline size={18} aria-hidden />
          </Outil>
          <Outil libelle="Barré" onClick={() => entourer("~~", "~~", "texte barré")}>
            <Strikethrough size={18} aria-hidden />
          </Outil>
          <Outil libelle="Surligné" onClick={() => entourer("==", "==", "texte surligné")}>
            <Highlighter size={18} aria-hidden />
          </Outil>
        </div>
        <div className={classeGroupe} role="group" aria-label="Couleur du texte">
          {SWATCHES_TEXTE.map((s) => (
            <button
              key={s.classe}
              type="button"
              aria-label={`Texte ${s.libelle.toLowerCase()}`}
              title={`Texte ${s.libelle.toLowerCase()}`}
              onClick={() => style(s.classe, COULEURS_TOUTES)}
              className={`inline-flex size-7 items-center justify-center rounded-abm-sm border border-bordeaux-700/30 font-display text-base font-bold focus-visible:outline-2 focus-visible:outline-bordeaux-700 ${s.css}`}
            >
              A
            </button>
          ))}
        </div>
        <div className={classeGroupe} role="group" aria-label="Fond du texte">
          {SWATCHES_FOND.map((s) => (
            <button
              key={s.classe}
              type="button"
              aria-label={s.libelle}
              title={s.libelle}
              onClick={() => style(s.classe, FONDS_TOUS)}
              className={`size-7 rounded-abm-sm border border-bordeaux-700/30 focus-visible:outline-2 focus-visible:outline-bordeaux-700 ${s.css}`}
            />
          ))}
        </div>
        <div className={classeGroupe}>
          <MenuOutil
            libelle="Taille"
            onChoix={(v) => style(v === "normal" ? null : v, TAILLES)}
            options={[
              { valeur: "petit", libelle: "Petit" },
              { valeur: "normal", libelle: "Normal" },
              { valeur: "grand", libelle: "Grand" },
              { valeur: "tres-grand", libelle: "Très grand" },
            ]}
          />
          <MenuOutil
            libelle="Police"
            onChoix={(v) => style(v === "normale" ? null : v, POLICES)}
            options={[
              { valeur: "normale", libelle: "Normale" },
              { valeur: "serif", libelle: "Élégante (Playfair)" },
              { valeur: "script", libelle: "Manuscrite (Great Vibes)" },
              { valeur: "impact", libelle: "Affiche (Anton)" },
            ]}
          />
          <Outil libelle="Retirer couleur, taille et police" onClick={() => style(null, [...COULEURS_TOUTES, ...FONDS_TOUS, ...TAILLES, ...POLICES])}>
            <RemoveFormatting size={18} aria-hidden />
          </Outil>
        </div>
        <div className={classeGroupe}>
          <Outil libelle="Liste à puces" onClick={() => liste("puces")}>
            <List size={18} aria-hidden />
          </Outil>
          <Outil libelle="Liste numérotée" onClick={() => liste("numeros")}>
            <ListOrdered size={18} aria-hidden />
          </Outil>
          <Outil libelle="Liste à cocher" onClick={() => liste("cases")}>
            <ListChecks size={18} aria-hidden />
          </Outil>
          <Outil libelle="Citation" onClick={citation}>
            <TextQuote size={18} aria-hidden />
          </Outil>
          <Outil libelle="Séparateur" onClick={() => inserer("---", 0, 3)}>
            <Minus size={18} aria-hidden />
          </Outil>
        </div>
        <div className={classeGroupe}>
          <Outil libelle="Lien (Ctrl+K)" onClick={() => ouvrirPanneau("lien")}>
            <IconeLien size={18} aria-hidden />
          </Outil>
          <Outil libelle="Bouton" onClick={() => ouvrirPanneau("bouton")}>
            <MousePointerClick size={18} aria-hidden />
          </Outil>
          <Outil libelle="Image" onClick={() => choisirImages("image")} disabled={envoi}>
            <ImagePlus size={18} aria-hidden />
          </Outil>
          <Outil libelle="Galerie de photos" onClick={() => choisirImages("galerie")} disabled={envoi}>
            <Images size={18} aria-hidden />
          </Outil>
        </div>
        <div className={classeGroupe}>
          <MenuOutil
            libelle="Encadrés et blocs"
            onChoix={bloc}
            options={Object.entries(BLOCS).map(([valeur, b]) => ({ valeur, libelle: b.libelle }))}
          />
          <MenuOutil
            libelle="Modèles de départ"
            onChoix={modele}
            options={Object.entries(MODELES).map(([valeur, m]) => ({ valeur, libelle: m.libelle }))}
          />
        </div>
        <input
          ref={fichier}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => envoyerImages(e.target.files)}
        />
      </div>

      {/* Lien ou bouton : saisie de l'adresse */}
      {panneau && ecriture && (
        <div className="flex flex-wrap items-start gap-3 border border-b-0 border-bordeaux-700/30 bg-white p-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor={`${nom}-adresse`} className="block text-sm font-semibold text-ink">
              {panneau === "bouton" ? "Adresse du bouton" : "Adresse du lien"}
            </label>
            <input
              id={`${nom}-adresse`}
              autoFocus
              value={adresse}
              onChange={(e) => {
                setAdresse(e.target.value);
                setProblemeAdresse("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  validerAdresse();
                } else if (e.key === "Escape") setPanneau(null);
              }}
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://www.exemple.fr"
              aria-invalid={problemeAdresse ? true : undefined}
              className="mt-1 block w-full rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-2 text-ink focus:border-bordeaux-700 aria-invalid:border-bordeaux-500"
            />
            {problemeAdresse && <p className="mt-1 text-sm font-semibold text-bordeaux-500">{problemeAdresse}</p>}
            <p className="mt-1 text-xs text-ink-soft">
              Sélectionnez d’abord le texte à transformer, sinon un texte d’exemple est inséré. Pour une page du site : <code>/contact</code>.
            </p>
          </div>
          <div className="flex gap-2 pt-6">
            <button type="button" onClick={validerAdresse} className="rounded-abm-sm bg-bordeaux-700 px-4 py-2 text-sm font-semibold text-white hover:bg-bordeaux-600">
              Insérer
            </button>
            <button type="button" onClick={() => setPanneau(null)} className="rounded-abm-sm border border-bordeaux-700/30 px-4 py-2 text-sm font-semibold text-bordeaux-700 hover:bg-bordeaux-100/60">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Image sous le curseur : taille et place */}
      {ligneImage && ecriture && (
        <div role="group" aria-label="Réglages de l’image" className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-b-0 border-bordeaux-700/30 bg-white px-3 py-2 text-sm">
          <span className="font-semibold text-bordeaux-700">Image</span>
          <span className="flex items-center gap-1">
            Taille :
            {TAILLES_IMAGE.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={ligneImage.classes.includes(t) || (t === "large" && !TAILLES_IMAGE.some((x) => ligneImage.classes.includes(x)))}
                onClick={() => reglerImage(t, TAILLES_IMAGE)}
                className="rounded-abm-sm border border-bordeaux-700/30 px-2.5 py-1 text-bordeaux-700 hover:bg-bordeaux-100/60 aria-pressed:bg-bordeaux-700 aria-pressed:text-white"
              >
                {t === "petite" ? "Petite" : t === "moyenne" ? "Moyenne" : "Grande"}
              </button>
            ))}
          </span>
          <span className="flex items-center gap-1">
            Place :
            {POSITIONS_IMAGE.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={ligneImage.classes.includes(p)}
                onClick={() => reglerImage(p, POSITIONS_IMAGE)}
                className="rounded-abm-sm border border-bordeaux-700/30 px-2.5 py-1 text-bordeaux-700 hover:bg-bordeaux-100/60 aria-pressed:bg-bordeaux-700 aria-pressed:text-white"
              >
                {p === "gauche" ? "À gauche" : p === "droite" ? "À droite" : "Centrée"}
              </button>
            ))}
          </span>
          <span className="text-xs text-ink-soft">« À gauche » et « À droite » font passer le texte autour (petite ou moyenne).</span>
        </div>
      )}

      {messageEnvoi && (
        <p role="status" className={`border border-b-0 border-bordeaux-700/30 bg-white px-3 py-2 text-sm font-semibold ${messageEnvoi.erreur ? "text-bordeaux-500" : "text-bordeaux-700"}`}>
          {messageEnvoi.texte}
        </p>
      )}

      <textarea
        ref={zone}
        id={nom}
        name={nom}
        value={texte}
        rows={20}
        maxLength={maxLength}
        required={requis}
        hidden={!ecriture}
        spellCheck
        onChange={(e) => {
          setTexte(e.target.value);
          setCurseur(e.target.selectionStart);
        }}
        onSelect={suivreCurseur}
        onKeyUp={suivreCurseur}
        onClick={suivreCurseur}
        onKeyDown={surTouche}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={[aide && `${nom}-aide`, erreur && `${nom}-erreur`, `${nom}-compteur`].filter(Boolean).join(" ")}
        className="block min-h-[26rem] w-full resize-y border border-bordeaux-700/30 bg-white px-4 py-3 font-mono text-[0.95rem] leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-bordeaux-700 aria-invalid:border-bordeaux-500"
      />

      {/* Aperçu : même affichage que la page publique */}
      {!ecriture && lu && (
        <div className="border border-bordeaux-700/30 bg-white px-4 py-6 sm:px-8 sm:py-8">
          {lu.blocs.length === 0 ? (
            <p className="text-ink-soft">Rien à afficher pour l’instant : le texte est vide.</p>
          ) : (
            <>
              <p className="mb-6 border-b border-bordeaux-700/10 pb-3 text-xs text-ink-soft">
                Aperçu · environ {lu.mots.toLocaleString("fr-FR")} mots · {lu.minutes} min de lecture
              </p>
              <div className="mx-auto max-w-[44rem]">
                <CorpsArticle article={lu} apercu />
              </div>
            </>
          )}
        </div>
      )}

      <p id={`${nom}-compteur`} className={`mt-1 text-right text-xs ${texte.length >= maxLength * 0.9 ? "font-semibold text-bordeaux-500" : "text-ink-soft"}`}>
        {texte.length.toLocaleString("fr-FR")} / {maxLength.toLocaleString("fr-FR")} caractères
      </p>
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

      <details className="mt-4 border border-bordeaux-700/15 bg-white">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-bordeaux-700 focus-visible:outline-2 focus-visible:outline-bordeaux-700">
          <CircleHelp size={16} aria-hidden /> Aide-mémoire de la mise en forme
        </summary>
        <div className="border-t border-bordeaux-700/10 px-4 py-4 text-sm">
          <p className="text-ink-soft">
            La barre d’outils écrit ces balises à votre place ; vous pouvez aussi les taper. Laissez une ligne vide entre deux paragraphes. Couleurs
            : <code>.bordeaux .rose .gris .blanc</code> · fonds : <code>.fond-rose .fond-beige .fond-bordeaux</code> · tailles :{" "}
            <code>.petit .grand .tres-grand</code> · polices : <code>.serif .script .impact</code>.
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {AIDE.map((a) => (
              <div key={a.saisie} className="contents">
                <dt>
                  <code className="block whitespace-pre-wrap break-words bg-beige-papier/60 px-2 py-1">{a.saisie}</code>
                </dt>
                <dd className="mb-2 text-ink-soft sm:mb-0 sm:py-1">{a.resultat}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>
    </div>
  );
}
