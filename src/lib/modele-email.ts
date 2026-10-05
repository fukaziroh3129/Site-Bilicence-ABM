// Mise en page des e-mails du site (registre institutionnel : bandeau bordeaux, papier blanc, bouton bordeaux).
// Un e-mail en HTML s'écrit avec des tableaux et des styles « en ligne » : les messageries (Gmail, Outlook…)
// ignorent presque tout le CSS moderne. Le texte brut reste envoyé à côté, pour les messageries qui n'affichent
// pas le HTML. Tout texte inséré est échappé : les noms et formations viennent de la base de données.
import "server-only";
import { adresseSite } from "@/lib/email";
import { site } from "@/lib/site";

const BORDEAUX = "#5C1A1E";
const ENCRE = "#2a1a1b";
const GRIS = "#6b5557";
const ROSE_PALE = "#F2D9D9";
const FOND_PALE = "#F7F1F1";
const FILET = "#d9c3c3";
const TITRES = "Georgia, 'Times New Roman', serif";
const TEXTE = "Arial, Helvetica, sans-serif";

/** Un morceau de ligne du pied de page : du texte, ou un lien. */
type Segment = string | { libelle: string; url: string };

type Bloc =
  | { paragraphe: string; petit?: boolean }
  | { encadre: string[] }
  | { accroche: string }
  | { bouton: { libelle: string; url: string }; note?: string };

type Modele = {
  titre: string;
  /** Texte d'aperçu affiché par la messagerie à côté de l'objet. */
  apercu?: string;
  contenu: Bloc[];
  /** Lignes de bas de page (liens utiles, désinscription…). */
  pied?: Segment[][];
};

export function echapper(texte: string) {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function segments(ligne: Segment[]) {
  return ligne
    .map((s) =>
      typeof s === "string"
        ? echapper(s)
        : `<a href="${echapper(s.url)}" style="color:${BORDEAUX};text-decoration:underline;">${echapper(s.libelle)}</a>`,
    )
    .join("");
}

function bloc(b: Bloc) {
  if ("paragraphe" in b) {
    const taille = b.petit ? "13.5px" : "15px";
    return `<p style="margin:0 0 14px;font-family:${TITRES};font-size:${taille};line-height:1.7;color:${ENCRE};">${echapper(b.paragraphe)}</p>`;
  }
  if ("encadre" in b) {
    const lignes = b.encadre.map(echapper).join("<br>");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="background:${FOND_PALE};border-left:3px solid ${BORDEAUX};padding:10px 16px;font-family:${TITRES};font-size:14px;line-height:1.8;color:${ENCRE};">${lignes}</td></tr></table>`;
  }
  if ("accroche" in b) {
    return `<p style="margin:0 0 16px;font-family:${TITRES};font-size:17px;line-height:1.4;font-style:italic;text-align:center;color:${BORDEAUX};">${echapper(b.accroche)}</p>`;
  }
  const note = b.note
    ? `<p style="margin:8px 0 22px;font-family:${TEXTE};font-size:12px;line-height:1.5;text-align:center;color:${GRIS};">${echapper(b.note)}</p>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr><td bgcolor="${BORDEAUX}" style="background:${BORDEAUX};border-radius:2px;"><a href="${echapper(b.bouton.url)}" style="display:inline-block;padding:13px 30px;font-family:${TEXTE};font-size:14px;color:#ffffff;text-decoration:none;">${echapper(b.bouton.libelle)}</a></td></tr></table>${note}`;
}

/** Construit l'e-mail complet. Le lien du bouton est répété en clair dans le pied, au cas où le bouton ne marcherait pas. */
export function modeleEmail({ titre, apercu, contenu, pied = [] }: Modele) {
  const bouton = contenu.find((b): b is Extract<Bloc, { bouton: unknown }> => "bouton" in b);
  const lignesPied = [
    ...pied.map(segments),
    ...(bouton
      ? [`Le bouton ne marche pas ? Copiez ce lien dans votre navigateur :<br><span style="color:${BORDEAUX};word-break:break-all;">${echapper(bouton.bouton.url)}</span>`]
      : []),
  ];

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${echapper(titre)}</title></head>
<body style="margin:0;padding:0;background:#f3eded;">
${apercu ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(apercu)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eded;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
<tr><td align="center" bgcolor="${BORDEAUX}" style="background:${BORDEAUX};padding:26px 24px 20px;">
<img src="${echapper(adresseSite("/brand/logo-abm-seal-white.png"))}" width="64" height="64" alt="" style="display:block;margin:0 auto 10px;border:0;">
<div style="font-family:${TEXTE};font-size:11px;letter-spacing:2px;color:${ROSE_PALE};">${echapper(site.nom.toUpperCase())}</div>
</td></tr>
<tr><td style="padding:28px 30px 10px;">
<h1 style="margin:0 0 16px;font-family:${TITRES};font-size:23px;line-height:1.3;font-weight:normal;color:${BORDEAUX};">${echapper(titre)}</h1>
<div style="height:1px;background:${FILET};line-height:1px;font-size:1px;margin:0 0 20px;">&nbsp;</div>
${contenu.map(bloc).join("\n")}
</td></tr>
${lignesPied.length ? `<tr><td style="background:${FOND_PALE};padding:14px 30px;font-family:${TEXTE};font-size:11.5px;line-height:1.7;color:${GRIS};">${lignesPied.join("<br>")}</td></tr>` : ""}
<tr><td align="center" bgcolor="${BORDEAUX}" style="background:${BORDEAUX};padding:12px 30px;font-family:${TEXTE};font-size:11px;color:${ROSE_PALE};">${echapper(site.nom)}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
