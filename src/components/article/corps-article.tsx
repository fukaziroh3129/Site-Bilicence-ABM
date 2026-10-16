// Affichage du texte d'un article : transforme l'arbre produit par `lireArticle` (src/lib/article-texte.ts)
// en éléments React aux couleurs de la charte. Utilisé par la page publique ET par l'aperçu de l'éditeur :
// ce que l'on voit dans l'aperçu est exactement ce que verront les visiteurs.
//
// Rien n'est affiché en HTML brut : chaque style est un nom d'une liste fermée associé ici à des classes.

import { CircleAlert, Info, Lightbulb, Square, SquareCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Ornement } from "@/components/anime";
import { buttonClasses, classeLien } from "@/components/ui";
import type { ArticleLu, Bloc, EntreeSommaire, Inline, ItemListe } from "@/lib/article-texte";

const CLASSES_STYLE: Record<string, string> = {
  // Couleurs du texte
  bordeaux: "text-bordeaux-700",
  rose: "text-bordeaux-400",
  gris: "text-ink-soft",
  blanc: "text-white",
  // Fonds
  "fond-rose": "bg-rose-pale px-1 box-decoration-clone",
  "fond-beige": "bg-beige-papier px-1 box-decoration-clone",
  "fond-bordeaux": "bg-bordeaux-700 px-1.5 text-white box-decoration-clone",
  // Tailles
  petit: "text-[0.85em]",
  grand: "text-[1.3em] leading-snug",
  "tres-grand": "text-[1.8em] leading-tight",
  // Polices de la charte
  serif: "font-display",
  script: "font-script text-[1.4em] font-normal",
  impact: "font-impact font-normal uppercase tracking-wide",
};

type Contexte = {
  /** Fond foncé (encadrés bordeaux) : texte, liens et boutons clairs. */
  sombre: boolean;
  /** Aperçu de l'éditeur : signale ce qui sera ignoré à la publication. */
  apercu: boolean;
};

// ─── Texte en ligne ────────────────────────────────────────────────────────────

function Lien({ href, bouton, ctx, children }: { href: string; bouton: boolean; ctx: Contexte; children: React.ReactNode }) {
  const classe = bouton ? `${buttonClasses(ctx.sombre ? "inverse" : "primary")} my-1 no-underline` : ctx.sombre ? "underline underline-offset-4 hover:opacity-80" : classeLien;
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={classe}>
        {children}
      </Link>
    );
  }
  const externe = href.startsWith("http");
  return (
    <a href={href} className={classe} {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

function Enligne({ noeuds, ctx }: { noeuds: Inline[]; ctx: Contexte }) {
  return (
    <>
      {noeuds.map((n, i) => {
        switch (n.t) {
          case "texte":
            return n.v;
          case "saut":
            return <br key={i} />;
          case "gras":
            return (
              <strong key={i} className="font-semibold">
                <Enligne noeuds={n.c} ctx={ctx} />
              </strong>
            );
          case "italique":
            return (
              <em key={i}>
                <Enligne noeuds={n.c} ctx={ctx} />
              </em>
            );
          case "souligne":
            return (
              <u key={i} className="underline-offset-4">
                <Enligne noeuds={n.c} ctx={ctx} />
              </u>
            );
          case "barre":
            return (
              <s key={i}>
                <Enligne noeuds={n.c} ctx={ctx} />
              </s>
            );
          case "surligne":
            return (
              <mark key={i} className={`px-0.5 text-inherit box-decoration-clone ${ctx.sombre ? "bg-white/25" : "bg-rose-pale"}`}>
                <Enligne noeuds={n.c} ctx={ctx} />
              </mark>
            );
          case "lien":
            return (
              <Lien key={i} href={n.href} bouton={n.bouton} ctx={ctx}>
                <Enligne noeuds={n.c} ctx={ctx} />
              </Lien>
            );
          case "style":
            return (
              <span key={i} className={n.classes.map((c) => CLASSES_STYLE[c]).filter(Boolean).join(" ")}>
                <Enligne noeuds={n.c} ctx={ctx} />
              </span>
            );
        }
      })}
    </>
  );
}

// ─── Blocs ─────────────────────────────────────────────────────────────────────

const classeTitre = (niveau: 2 | 3, sombre: boolean) =>
  niveau === 2
    ? `clear-both scroll-mt-28 font-display text-2xl font-bold leading-snug sm:text-3xl ${sombre ? "text-white" : "border-b border-bordeaux-700/15 pb-2 text-bordeaux-700"}`
    : `clear-both scroll-mt-28 font-display text-xl font-bold leading-snug sm:text-2xl ${sombre ? "text-white" : "text-bordeaux-600"}`;

function Liste({ b, ctx }: { b: Extract<Bloc, { t: "liste" }>; ctx: Contexte }) {
  const aCocher = b.items.some((it) => it.case !== null);
  if (aCocher) {
    return (
      <ul className="space-y-2">
        {b.items.map((it: ItemListe, i) => (
          <li key={i} className="flex items-start gap-3">
            {it.case ? (
              <SquareCheck size={20} aria-label="Fait" className={`mt-1 shrink-0 ${ctx.sombre ? "text-white" : "text-bordeaux-700"}`} />
            ) : (
              <Square size={20} aria-label="À faire" strokeWidth={1.5} className={`mt-1 shrink-0 ${ctx.sombre ? "text-white" : "text-bordeaux-700"}`} />
            )}
            <span>
              <Enligne noeuds={it.c} ctx={ctx} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  const Balise = b.ordonnee ? "ol" : "ul";
  return (
    <Balise className={`space-y-1.5 pl-6 ${b.ordonnee ? "list-decimal" : "list-disc"} ${ctx.sombre ? "marker:text-white/80" : "marker:text-bordeaux-500"}`}>
      {b.items.map((it, i) => (
        <li key={i} className="pl-1">
          <Enligne noeuds={it.c} ctx={ctx} />
        </li>
      ))}
    </Balise>
  );
}

function FigureImage({ b, ctx, galerie = false }: { b: Extract<Bloc, { t: "image" }>; ctx: Contexte; galerie?: boolean }) {
  if (!b.src) {
    if (!ctx.apercu) return null;
    return (
      <p className="border border-dashed border-bordeaux-500 bg-white px-4 py-3 text-sm text-bordeaux-500">
        Image ignorée : seules les images ajoutées avec le bouton « Image » de la barre d’outils sont acceptées.
      </p>
    );
  }
  const flottante = !galerie && b.taille !== "large" && (b.position === "gauche" || b.position === "droite");
  const largeur = galerie ? "" : b.taille === "petite" ? "sm:w-1/3" : b.taille === "moyenne" ? "sm:w-2/3" : "";
  const place = galerie
    ? ""
    : flottante
      ? b.position === "gauche"
        ? "sm:float-left sm:mr-6 sm:mt-1 sm:mb-3"
        : "sm:float-right sm:ml-6 sm:mt-1 sm:mb-3"
      : b.taille === "large"
        ? ""
        : "mx-auto";
  return (
    <figure className={`${largeur} ${place}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image téléversée, taille d'origine inconnue */}
      <img
        src={b.src}
        alt={b.legende}
        loading="lazy"
        decoding="async"
        className={`w-full rounded-abm-sm object-cover ${galerie ? "aspect-[4/3]" : "h-auto"}`}
      />
      {b.legende && <figcaption className={`mt-2 text-sm italic ${ctx.sombre ? "text-white/80" : "text-ink-soft"}`}>{b.legende}</figcaption>}
    </figure>
  );
}

/** Découpe les blocs d'un conteneur « colonnes » aux lignes « +++ ». */
function enColonnes(blocs: Bloc[]) {
  const colonnes: Bloc[][] = [[]];
  for (const b of blocs) {
    if (b.t === "coupure") colonnes.push([]);
    else colonnes[colonnes.length - 1].push(b);
  }
  return colonnes.filter((c) => c.length > 0).slice(0, 3);
}

const COLONNES_CHIFFRES = ["", "", "grid-cols-2", "sm:grid-cols-3", "grid-cols-2 sm:grid-cols-4"];

/** Chiffres clés : chaque élément de liste « **120** inscrits » donne un grand chiffre et sa légende. */
function ChiffresCles({ blocs, ctx }: { blocs: Bloc[]; ctx: Contexte }) {
  const items = blocs.flatMap((b) => (b.t === "liste" ? b.items : []));
  if (items.length === 0) return <Blocs blocs={blocs} ctx={ctx} />;
  const grille = COLONNES_CHIFFRES[items.length] ?? "grid-cols-2 sm:grid-cols-3";
  return (
    <ul className={`grid gap-x-6 gap-y-8 ${grille}`}>
      {items.map((it, i) => {
        const indice = it.c.findIndex((n) => n.t === "gras");
        const gras = indice >= 0 ? it.c[indice] : null;
        const chiffre = gras && gras.t === "gras" ? gras.c : null;
        const legende = indice >= 0 ? it.c.filter((_, k) => k !== indice) : it.c;
        return (
          <li key={i} className={`border-t-2 pt-3 ${ctx.sombre ? "border-white" : "border-bordeaux-700"}`}>
            {chiffre && (
              <span className={`block font-impact text-5xl leading-none ${ctx.sombre ? "text-white" : "text-bordeaux-700"}`}>
                <Enligne noeuds={chiffre} ctx={ctx} />
              </span>
            )}
            <span className={`mt-2 block text-base leading-snug ${ctx.sombre ? "text-white/85" : "text-ink-soft"}`}>
              <Enligne noeuds={legende} ctx={ctx} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Encadre({
  fond,
  icone: Icone,
  titre,
  ctx,
  children,
}: {
  fond: string;
  icone?: LucideIcon;
  titre: Inline[] | null;
  ctx: Contexte;
  children: React.ReactNode;
}) {
  return (
    <aside className={`clear-both rounded-abm-sm p-5 sm:p-6 ${fond}`}>
      {titre && (
        <p className="mb-3 flex items-center gap-2.5 font-display text-lg font-bold leading-snug">
          {Icone && <Icone size={20} aria-hidden className="shrink-0" />}
          <span>
            <Enligne noeuds={titre} ctx={ctx} />
          </span>
        </p>
      )}
      {!titre && Icone && <Icone size={20} aria-hidden className="mb-2" />}
      <div className="space-y-4">{children}</div>
    </aside>
  );
}

function Conteneur({ b, ctx }: { b: Extract<Bloc, { t: "conteneur" }>; ctx: Contexte }) {
  const clair = { ...ctx, sombre: false };
  const sombre = { ...ctx, sombre: true };
  switch (b.nom) {
    case "info":
      return (
        <Encadre fond="border border-bordeaux-700/20 border-l-4 border-l-bordeaux-700 bg-white shadow-abm-card" icone={Info} titre={b.titre} ctx={clair}>
          <Blocs blocs={b.c} ctx={clair} />
        </Encadre>
      );
    case "important":
      return (
        <Encadre fond="bg-bordeaux-700 text-white" icone={CircleAlert} titre={b.titre} ctx={sombre}>
          <Blocs blocs={b.c} ctx={sombre} />
        </Encadre>
      );
    case "conseil":
      return (
        <Encadre fond="border-l-4 border-l-bordeaux-400 bg-beige-papier" icone={Lightbulb} titre={b.titre} ctx={clair}>
          <Blocs blocs={b.c} ctx={clair} />
        </Encadre>
      );
    case "rose":
      return (
        <Encadre fond="bg-rose-pale" titre={b.titre} ctx={clair}>
          <Blocs blocs={b.c} ctx={clair} />
        </Encadre>
      );
    case "beige":
      return (
        <Encadre fond="bg-beige-papier" titre={b.titre} ctx={clair}>
          <Blocs blocs={b.c} ctx={clair} />
        </Encadre>
      );
    case "bordeaux":
      return (
        <Encadre fond="bg-bordeaux-700 text-white" titre={b.titre} ctx={sombre}>
          <Blocs blocs={b.c} ctx={sombre} />
        </Encadre>
      );
    case "centre":
      return (
        <div className="clear-both space-y-4 text-center">
          {b.titre && (
            <p className="font-display text-xl font-bold text-bordeaux-700">
              <Enligne noeuds={b.titre} ctx={ctx} />
            </p>
          )}
          <Blocs blocs={b.c} ctx={ctx} />
        </div>
      );
    case "chiffres":
      return (
        <div className="clear-both space-y-4">
          {b.titre && (
            <p className={`font-display text-xl font-bold ${ctx.sombre ? "text-white" : "text-bordeaux-700"}`}>
              <Enligne noeuds={b.titre} ctx={ctx} />
            </p>
          )}
          <ChiffresCles blocs={b.c} ctx={ctx} />
        </div>
      );
    case "colonnes": {
      const colonnes = enColonnes(b.c);
      return (
        <div className={`clear-both grid gap-x-8 gap-y-6 ${colonnes.length >= 3 ? "sm:grid-cols-3" : colonnes.length === 2 ? "sm:grid-cols-2" : ""}`}>
          {colonnes.map((c, i) => (
            <div key={i} className="min-w-0 space-y-4">
              <Blocs blocs={c} ctx={ctx} />
            </div>
          ))}
        </div>
      );
    }
    case "galerie": {
      const images = b.c.filter((x) => x.t === "image");
      return (
        <div className="clear-both space-y-3">
          {b.titre && (
            <p className="font-display text-xl font-bold text-bordeaux-700">
              <Enligne noeuds={b.titre} ctx={ctx} />
            </p>
          )}
          <div className={`grid grid-cols-2 gap-3 ${images.length >= 3 ? "sm:grid-cols-3" : ""}`}>
            {images.map((im, i) => (
              <FigureImage key={i} b={im} ctx={ctx} galerie />
            ))}
          </div>
        </div>
      );
    }
  }
}

function Blocs({ blocs, ctx }: { blocs: Bloc[]; ctx: Contexte }) {
  return (
    <>
      {blocs.map((b, i) => {
        switch (b.t) {
          case "paragraphe":
            return (
              <p key={i}>
                <Enligne noeuds={b.c} ctx={ctx} />
              </p>
            );
          case "titre": {
            const Balise = b.niveau === 2 ? "h2" : "h3";
            return (
              <Balise key={i} id={b.id} className={`${classeTitre(b.niveau, ctx.sombre)} ${b.niveau === 2 ? "mt-4" : ""}`}>
                <Enligne noeuds={b.c} ctx={ctx} />
              </Balise>
            );
          }
          case "liste":
            return <Liste key={i} b={b} ctx={ctx} />;
          case "citation":
            return (
              <figure key={i} className={`clear-both border-l-4 pl-5 sm:pl-6 ${ctx.sombre ? "border-white" : "border-bordeaux-700"}`}>
                <blockquote className={`font-display text-xl italic leading-snug sm:text-2xl ${ctx.sombre ? "text-white" : "text-bordeaux-700"}`}>
                  <Enligne noeuds={b.c} ctx={ctx} />
                </blockquote>
                {b.auteur && (
                  <figcaption className={`mt-3 text-sm font-semibold uppercase tracking-[0.14em] ${ctx.sombre ? "text-white/80" : "text-ink-soft"}`}>
                    — <Enligne noeuds={b.auteur} ctx={ctx} />
                  </figcaption>
                )}
              </figure>
            );
          case "separateur":
            return <Ornement key={i} clair={ctx.sombre} className="clear-both py-4" />;
          case "image":
            return <FigureImage key={i} b={b} ctx={ctx} />;
          case "conteneur":
            return <Conteneur key={i} b={b} ctx={ctx} />;
          case "coupure":
            return null; // une coupure hors d'un bloc « colonnes » n'a pas de sens
        }
      })}
    </>
  );
}

// ─── Composants publics ────────────────────────────────────────────────────────

/** Corps d'un article (le texte, sans le titre ni l'image de couverture). */
export function CorpsArticle({ article, apercu = false }: { article: ArticleLu; apercu?: boolean }) {
  return (
    <div className="lettrine flow-root space-y-5 text-lg leading-relaxed">
      <Blocs blocs={article.blocs} ctx={{ sombre: false, apercu }} />
    </div>
  );
}

/** Sommaire cliquable (titres de section et sous-titres). */
export function SommaireArticle({ entrees }: { entrees: EntreeSommaire[] }) {
  if (entrees.length < 2) return null;
  return (
    <nav aria-label="Sommaire de l’article" className="border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-6">
      <p className="eyebrow text-bordeaux-500">Dans cet article</p>
      <ul className="mt-3 space-y-1.5">
        {entrees.map((e) => (
          <li key={e.id} className={e.niveau === 3 ? "pl-5 text-[0.95rem]" : "font-semibold"}>
            <a href={`#${e.id}`} className={classeLien}>
              {e.texte}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
