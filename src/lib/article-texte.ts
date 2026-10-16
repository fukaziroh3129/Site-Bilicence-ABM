// Lecteur du texte des articles.
//
// Le texte d'une publication (colonne `Article.contenu`) est écrit avec quelques balises légères, proches du
// « Markdown » : `## Titre`, `**gras**`, `- liste`, `:::info … :::`, `[texte]{.bordeaux .grand}`… Ce fichier
// transforme ce texte en un ARBRE de blocs (titres, paragraphes, encadrés…) ; le composant
// `src/components/article/corps-article.tsx` transforme ensuite l'arbre en éléments React.
//
// Pourquoi pas du HTML ? Rien n'est jamais injecté en HTML brut (règle de sécurité du projet) : seuls des noms
// d'une liste fermée (couleurs, tailles, polices de la charte) et des adresses vérifiées passent.
// Un ancien article en texte simple reste valable : paragraphes séparés par une ligne vide, retours à la
// ligne conservés.
//
// Ce fichier n'a aucune dépendance serveur : il sert aussi à l'aperçu, dans le navigateur.
import { slugifier } from "@/lib/format";

// ─── Listes fermées de la charte ───────────────────────────────────────────────

export const COULEURS = ["bordeaux", "rose", "gris", "blanc"] as const;
export const FONDS = ["fond-rose", "fond-beige", "fond-bordeaux"] as const;
export const TAILLES = ["petit", "grand", "tres-grand"] as const;
export const POLICES = ["serif", "script", "impact"] as const;

const CLASSES_STYLE: readonly string[] = [...COULEURS, ...FONDS, ...TAILLES, ...POLICES];

export const CONTENEURS = ["info", "important", "conseil", "rose", "beige", "bordeaux", "centre", "chiffres", "colonnes", "galerie"] as const;
export type NomConteneur = (typeof CONTENEURS)[number];

export const TAILLES_IMAGE = ["petite", "moyenne", "large"] as const;
export const POSITIONS_IMAGE = ["gauche", "droite", "centre"] as const;
export type TailleImage = (typeof TAILLES_IMAGE)[number];
export type PositionImage = (typeof POSITIONS_IMAGE)[number];

// ─── Arbre ─────────────────────────────────────────────────────────────────────

export type Inline =
  | { t: "texte"; v: string }
  | { t: "saut" }
  | { t: "gras" | "italique" | "souligne" | "barre" | "surligne"; c: Inline[] }
  | { t: "lien"; href: string; c: Inline[]; bouton: boolean }
  | { t: "style"; classes: string[]; c: Inline[] };

export type ItemListe = { c: Inline[]; /** null = puce ordinaire ; sinon case à cocher (cochée ou non) */ case: boolean | null };

export type Bloc =
  | { t: "paragraphe"; c: Inline[] }
  | { t: "titre"; niveau: 2 | 3; id: string; c: Inline[] }
  | { t: "liste"; ordonnee: boolean; items: ItemListe[] }
  | { t: "citation"; c: Inline[]; auteur: Inline[] | null }
  | { t: "separateur" }
  | { t: "image"; src: string | null; legende: string; taille: TailleImage; position: PositionImage | null }
  | { t: "coupure" }
  | { t: "conteneur"; nom: NomConteneur; titre: Inline[] | null; c: Bloc[] };

export type EntreeSommaire = { niveau: 2 | 3; id: string; texte: string };

export type ArticleLu = {
  blocs: Bloc[];
  sommaire: EntreeSommaire[];
  mots: number;
  /** Minutes de lecture (au moins 1). */
  minutes: number;
};

// ─── Sécurité des adresses ─────────────────────────────────────────────────────

/** Adresse de lien acceptée, ou null : http(s), mailto, tel, page du site ou ancre. */
export function adresseSure(adresse: string): string | null {
  const v = adresse.trim();
  if (/^www\.[^\s/]+\.\S+$/i.test(v)) return `https://${v}`;
  if (/^https?:\/\/[^\s/.]+\.\S+$/i.test(v)) return v;
  if (/^mailto:[^\s]+@[^\s]+$/i.test(v)) return v;
  if (/^tel:[+\d\s.()-]+$/i.test(v)) return v;
  if (/^\/(?!\/)\S*$/.test(v) || /^#[\w-]+$/.test(v)) return v;
  return null;
}

/** Seules les images téléversées sur le site (voir src/lib/fichiers.ts) sont acceptées dans un texte. */
const RE_IMAGE_TELEVERSEE = /^\/fichiers\/[a-f0-9-]{36}\.(jpg|png|webp)$/;

/** Noms de fichiers (« /fichiers/xxx.jpg ») utilisés dans un texte. */
export function imagesDuTexte(contenu: string | null | undefined): string[] {
  const trouvees = (contenu ?? "").match(/\/fichiers\/[a-f0-9-]{36}\.(?:jpg|png|webp)/g) ?? [];
  return [...new Set(trouvees)];
}

// ─── Lecture des styles en ligne ───────────────────────────────────────────────

const PROFONDEUR_MAX_INLINE = 8;
const PROFONDEUR_MAX_BLOCS = 3;

const MARQUES = [
  { m: "**", t: "gras" },
  { m: "++", t: "souligne" },
  { m: "~~", t: "barre" },
  { m: "==", t: "surligne" },
  { m: "*", t: "italique" },
] as const;

const espace = (c: string | undefined) => c === undefined || /\s/.test(c);

/** Cherche la marque fermante : collée au texte (pas d'espace avant), non échappée. */
function chercherFermeture(texte: string, marque: string, depuis: number) {
  let k = depuis;
  for (;;) {
    k = texte.indexOf(marque, k);
    if (k < 0) return -1;
    const echappee = texte[k - 1] === "\\";
    // Pour « * » : une étoile qui fait partie de « ** » n'est pas une fermeture d'italique.
    const partDeGras = marque === "*" && (texte[k + 1] === "*" || texte[k - 1] === "*");
    if (!echappee && !partDeGras && !espace(texte[k - 1])) return k;
    k += marque === "*" ? 1 : marque.length;
  }
}

/** Position du crochet/parenthèse fermant correspondant à celui ouvert juste avant `depuis`. */
function chercherCorrespondant(texte: string, depuis: number, ouvrant: string, fermant: string) {
  let profondeur = 1;
  for (let k = depuis; k < texte.length; k++) {
    const c = texte[k];
    if (c === "\\") {
      k++;
      continue;
    }
    if (c === ouvrant) profondeur++;
    else if (c === fermant && --profondeur === 0) return k;
  }
  return -1;
}

function classesDe(attributs: string) {
  return [...attributs.matchAll(/\.([a-z-]+)/g)].map((m) => m[1]);
}

export function lireInline(texte: string, profondeur = 0): Inline[] {
  if (profondeur > PROFONDEUR_MAX_INLINE) return texte ? [{ t: "texte", v: texte }] : [];
  const sortie: Inline[] = [];
  let tampon = "";
  const vider = () => {
    if (tampon) sortie.push({ t: "texte", v: tampon });
    tampon = "";
  };

  let i = 0;
  while (i < texte.length) {
    const c = texte[i];

    // Caractère échappé : \* donne une étoile ordinaire.
    if (c === "\\" && i + 1 < texte.length && /[\\*_~=+[\](){}#>!`:|-]/.test(texte[i + 1])) {
      tampon += texte[i + 1];
      i += 2;
      continue;
    }
    if (c === "\n") {
      vider();
      sortie.push({ t: "saut" });
      i++;
      continue;
    }

    // Lien, bouton ou texte stylé : [texte](adresse){.bouton} / [texte]{.bordeaux .grand}
    if (c === "[") {
      const fin = chercherCorrespondant(texte, i + 1, "[", "]");
      if (fin > 0) {
        const intitule = texte.slice(i + 1, fin);
        if (texte[fin + 1] === "(") {
          const finAdresse = chercherCorrespondant(texte, fin + 2, "(", ")");
          if (finAdresse > 0) {
            const adresse = adresseSure(texte.slice(fin + 2, finAdresse));
            let suite = finAdresse + 1;
            let classes: string[] = [];
            if (texte[suite] === "{") {
              const finAttributs = texte.indexOf("}", suite);
              if (finAttributs > 0) {
                classes = classesDe(texte.slice(suite + 1, finAttributs));
                suite = finAttributs + 1;
              }
            }
            vider();
            const contenu = lireInline(intitule, profondeur + 1);
            if (adresse) sortie.push({ t: "lien", href: adresse, c: contenu, bouton: classes.includes("bouton") });
            else sortie.push(...contenu); // adresse refusée : on garde le texte, sans lien
            i = suite;
            continue;
          }
        } else if (texte[fin + 1] === "{") {
          const finAttributs = texte.indexOf("}", fin + 1);
          if (finAttributs > 0) {
            const classes = classesDe(texte.slice(fin + 2, finAttributs)).filter((x) => CLASSES_STYLE.includes(x));
            vider();
            const contenu = lireInline(intitule, profondeur + 1);
            if (classes.length > 0) sortie.push({ t: "style", classes: [...new Set(classes)], c: contenu });
            else sortie.push(...contenu);
            i = finAttributs + 1;
            continue;
          }
        }
      }
    }

    // Paires de marques : **gras**, *italique*, ++souligné++, ~~barré~~, ==surligné==
    const marque = MARQUES.find((x) => texte.startsWith(x.m, i));
    if (marque && !espace(texte[i + marque.m.length])) {
      const fin = chercherFermeture(texte, marque.m, i + marque.m.length + 1);
      if (fin > 0) {
        vider();
        sortie.push({ t: marque.t, c: lireInline(texte.slice(i + marque.m.length, fin), profondeur + 1) });
        i = fin + marque.m.length;
        continue;
      }
    }

    tampon += c;
    i++;
  }
  vider();
  return sortie;
}

/** Texte brut d'un contenu en ligne (identifiants de titres, comptage des mots). */
export function texteDe(contenu: Inline[]): string {
  return contenu
    .map((n) => {
      if (n.t === "texte") return n.v;
      if (n.t === "saut") return " ";
      return texteDe(n.c);
    })
    .join("");
}

// ─── Lecture des blocs ─────────────────────────────────────────────────────────

type Contexte = { identifiants: Map<string, number> };

const RE_TITRE = /^(#{1,4})\s+(.+?)\s*$/;
const RE_SEPARATEUR = /^([-*_])(\s*\1){2,}$/;
const RE_ITEM = /^(\s*)([-*+]|\d{1,2}[.)])\s+(.*)$/;
const RE_IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*(?:\{([^}]*)\})?\s*$/;
const RE_OUVERTURE = /^:::\s*([a-z-]+)\s*(.*)$/;

function ouvertureConteneur(ligne: string) {
  const m = RE_OUVERTURE.exec(ligne);
  if (!m || !(CONTENEURS as readonly string[]).includes(m[1])) return null;
  return { nom: m[1] as NomConteneur, titre: m[2].trim() };
}

/** Index de la ligne « ::: » qui ferme le conteneur ouvert à `debut` (fin du texte s'il n'est pas fermé). */
function trouverFermeture(lignes: string[], debut: number) {
  let profondeur = 1;
  for (let j = debut + 1; j < lignes.length; j++) {
    const l = lignes[j].trim();
    if (ouvertureConteneur(l)) profondeur++;
    else if (l === ":::" && --profondeur === 0) return j;
  }
  return lignes.length;
}

const debuteUnBloc = (net: string) =>
  net === "+++" ||
  net === ":::" ||
  RE_TITRE.test(net) ||
  RE_SEPARATEUR.test(net) ||
  RE_IMAGE.test(net) ||
  net.startsWith(">") ||
  RE_ITEM.test(net) ||
  ouvertureConteneur(net) !== null;

function identifiantUnique(texte: string, ctx: Contexte) {
  const base = slugifier(texte) || "section";
  const n = (ctx.identifiants.get(base) ?? 0) + 1;
  ctx.identifiants.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

function lireBlocs(lignes: string[], ctx: Contexte, profondeur: number): Bloc[] {
  const blocs: Bloc[] = [];
  let i = 0;
  while (i < lignes.length) {
    const net = lignes[i].trim();
    if (net === "") {
      i++;
      continue;
    }

    // Conteneur : ::: nom Titre facultatif … :::
    const ouverture = ouvertureConteneur(net);
    if (ouverture) {
      const fin = trouverFermeture(lignes, i);
      if (profondeur >= PROFONDEUR_MAX_BLOCS) {
        i = fin + 1; // trop d'imbrications : le bloc est ignoré
        continue;
      }
      blocs.push({
        t: "conteneur",
        nom: ouverture.nom,
        titre: ouverture.titre ? lireInline(ouverture.titre) : null,
        c: lireBlocs(lignes.slice(i + 1, fin), ctx, profondeur + 1),
      });
      i = fin + 1;
      continue;
    }
    if (net === ":::") {
      i++; // fermeture orpheline
      continue;
    }
    if (net === "+++") {
      blocs.push({ t: "coupure" });
      i++;
      continue;
    }

    const titre = RE_TITRE.exec(net);
    if (titre) {
      const contenu = lireInline(titre[2]);
      blocs.push({ t: "titre", niveau: titre[1].length <= 2 ? 2 : 3, id: identifiantUnique(texteDe(contenu), ctx), c: contenu });
      i++;
      continue;
    }

    if (RE_SEPARATEUR.test(net)) {
      blocs.push({ t: "separateur" });
      i++;
      continue;
    }

    const image = RE_IMAGE.exec(net);
    if (image) {
      const classes = classesDe(image[3] ?? "");
      const src = RE_IMAGE_TELEVERSEE.test(image[2]) ? image[2] : null;
      blocs.push({
        t: "image",
        src,
        legende: image[1].trim(),
        taille: TAILLES_IMAGE.find((x) => classes.includes(x)) ?? "large",
        position: POSITIONS_IMAGE.find((x) => classes.includes(x)) ?? null,
      });
      i++;
      continue;
    }

    // Citation : lignes commençant par « > ». Une dernière ligne « — Nom » donne l'auteur.
    if (net.startsWith(">")) {
      const citee: string[] = [];
      while (i < lignes.length && lignes[i].trim().startsWith(">")) citee.push(lignes[i++].trim().replace(/^>\s?/, ""));
      let auteur: Inline[] | null = null;
      const derniere = /^(?:—|–|--)\s+(.+)$/.exec(citee[citee.length - 1] ?? "");
      if (derniere && citee.length > 1) {
        auteur = lireInline(derniere[1]);
        citee.pop();
      }
      blocs.push({ t: "citation", c: lireInline(citee.join("\n").trim()), auteur });
      continue;
    }

    // Liste à puces, numérotée ou à cocher.
    const premier = RE_ITEM.exec(lignes[i]);
    if (premier) {
      const ordonnee = /\d/.test(premier[2]);
      const memeGenre = (m: RegExpExecArray | null): m is RegExpExecArray => m !== null && /\d/.test(m[2]) === ordonnee;
      const bruts: { texte: string; case: boolean | null }[] = [];
      while (i < lignes.length) {
        const m = RE_ITEM.exec(lignes[i]);
        if (memeGenre(m)) {
          const coche = /^\[( |x|X)\]\s+/.exec(m[3]);
          bruts.push({ texte: coche ? m[3].slice(coche[0].length) : m[3], case: coche ? coche[1] !== " " : null });
          i++;
        } else if (!m && lignes[i].trim() !== "" && /^\s/.test(lignes[i])) {
          // Ligne de suite d'un élément (retrait)
          bruts[bruts.length - 1].texte += "\n" + lignes[i].trim();
          i++;
        } else if (lignes[i].trim() === "") {
          // Une ligne vide ne coupe la liste que si l'élément suivant n'est pas du même genre.
          let suivant = i + 1;
          while (suivant < lignes.length && lignes[suivant].trim() === "") suivant++;
          if (suivant < lignes.length && memeGenre(RE_ITEM.exec(lignes[suivant]))) i = suivant;
          else break;
        } else break;
      }
      blocs.push({ t: "liste", ordonnee, items: bruts.map((b) => ({ c: lireInline(b.texte), case: b.case })) });
      continue;
    }

    // Paragraphe : jusqu'à la ligne vide ou jusqu'au bloc suivant. Les retours à la ligne sont conservés.
    const lot: string[] = [lignes[i].trim()];
    i++;
    while (i < lignes.length && lignes[i].trim() !== "" && !debuteUnBloc(lignes[i].trim())) lot.push(lignes[i++].trim());
    blocs.push({ t: "paragraphe", c: lireInline(lot.join("\n")) });
  }
  return blocs;
}

// ─── Point d'entrée ────────────────────────────────────────────────────────────

function compterMots(blocs: Bloc[]): number {
  let mots = 0;
  const compter = (texte: string) => {
    const t = texte.trim();
    if (t) mots += t.split(/\s+/).length;
  };
  for (const b of blocs) {
    if (b.t === "paragraphe" || b.t === "titre") compter(texteDe(b.c));
    else if (b.t === "citation") compter(texteDe(b.c) + " " + (b.auteur ? texteDe(b.auteur) : ""));
    else if (b.t === "liste") b.items.forEach((it) => compter(texteDe(it.c)));
    else if (b.t === "image") compter(b.legende);
    else if (b.t === "conteneur") {
      if (b.titre) compter(texteDe(b.titre));
      mots += compterMots(b.c);
    }
  }
  return mots;
}

function sommaireDe(blocs: Bloc[]): EntreeSommaire[] {
  return blocs.flatMap((b) => {
    if (b.t === "titre") return [{ niveau: b.niveau, id: b.id, texte: texteDe(b.c) }];
    if (b.t === "conteneur") return sommaireDe(b.c);
    return [];
  });
}

/** Lit le texte d'un article : blocs, sommaire et temps de lecture (environ 200 mots par minute). */
export function lireArticle(contenu: string | null | undefined): ArticleLu {
  const lignes = (contenu ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocs = lireBlocs(lignes, { identifiants: new Map() }, 0);
  const mots = compterMots(blocs);
  return { blocs, sommaire: sommaireDe(blocs), mots, minutes: Math.max(1, Math.round(mots / 200)) };
}
