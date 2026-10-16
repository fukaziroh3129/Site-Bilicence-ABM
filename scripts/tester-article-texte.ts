// Tests du lecteur de texte des articles (src/lib/article-texte.ts).
// Lancer : npx tsx scripts/tester-article-texte.ts
import assert from "node:assert/strict";
import { adresseSure, imagesDuTexte, lireArticle, lireInline, texteDe, type Bloc } from "../src/lib/article-texte";

let nombre = 0;
function test(nom: string, corps: () => void) {
  try {
    corps();
    nombre++;
    console.log(`  ok  ${nom}`);
  } catch (e) {
    console.error(`  ÉCHEC  ${nom}\n`, e);
    process.exitCode = 1;
  }
}

const IMAGE = "/fichiers/123e4567-e89b-12d3-a456-426614174000.jpg";

// ─── Anciens articles en texte simple ───────────────────────────────────────────
test("texte simple : un paragraphe par bloc séparé d'une ligne vide, retours à la ligne conservés", () => {
  const { blocs } = lireArticle("Premier paragraphe.\nSuite sur une autre ligne.\n\nSecond paragraphe.");
  assert.equal(blocs.length, 2);
  assert.equal(blocs[0].t, "paragraphe");
  assert.deepEqual(blocs[0].t === "paragraphe" && blocs[0].c.map((n) => n.t), ["texte", "saut", "texte"]);
});

test("l'article d'ouverture (tirets cadratins, majuscules) reste en paragraphes", () => {
  const { blocs } = lireArticle("CE QUE TOUT LE MONDE PEUT FAIRE, SANS COMPTE\n\nSans rien créer, vous pouvez :\n— découvrir la formation ;\n— suivre les actualités.");
  assert.deepEqual(blocs.map((b) => b.t), ["paragraphe", "paragraphe"]);
});

test("fins de ligne Windows", () => {
  assert.equal(lireArticle("A\r\n\r\nB").blocs.length, 2);
});

test("texte vide ou absent", () => {
  assert.equal(lireArticle("").blocs.length, 0);
  assert.equal(lireArticle(null).blocs.length, 0);
});

// ─── Styles en ligne ────────────────────────────────────────────────────────────
test("gras, italique, souligné, barré, surligné", () => {
  const n = lireInline("**g** *i* ++s++ ~~b~~ ==h==").filter((x) => x.t !== "texte").map((x) => x.t);
  assert.deepEqual(n, ["gras", "italique", "souligne", "barre", "surligne"]);
});

test("une étoile isolée ou entourée d'espaces reste du texte", () => {
  assert.equal(texteDe(lireInline("2 * 3 * 4 et C++ et a == b")), "2 * 3 * 4 et C++ et a == b");
});

test("échappement", () => {
  assert.equal(texteDe(lireInline("\\*pas italique\\*")), "*pas italique*");
});

test("texte stylé : couleurs, tailles, polices ; classes inconnues ignorées", () => {
  const [n] = lireInline("[Bonjour]{.bordeaux .grand .script .nimportequoi}");
  assert.equal(n.t, "style");
  assert.deepEqual(n.t === "style" && n.classes, ["bordeaux", "grand", "script"]);
  const [seul] = lireInline("[Bonjour]{.inconnue}");
  assert.equal(seul.t, "texte");
});

test("styles imbriqués dans le gras", () => {
  const [gras] = lireInline("**un [mot]{.rose} important**");
  assert.equal(gras.t, "gras");
  assert.equal(texteDe(lireInline("**un [mot]{.rose} important**")), "un mot important");
});

test("liens : adresses sûres seulement", () => {
  assert.equal(adresseSure("https://exemple.fr/page"), "https://exemple.fr/page");
  assert.equal(adresseSure("www.exemple.fr"), "https://www.exemple.fr");
  assert.equal(adresseSure("/actualites"), "/actualites");
  assert.equal(adresseSure("mailto:a@b.fr"), "mailto:a@b.fr");
  assert.equal(adresseSure("javascript:alert(1)"), null);
  assert.equal(adresseSure("JaVaScRiPt:alert(1)"), null);
  assert.equal(adresseSure("data:text/html;base64,AAAA"), null);
  assert.equal(adresseSure("//evil.example"), null);
  assert.equal(adresseSure("vbscript:x"), null);
});

test("lien refusé : le texte reste, sans lien", () => {
  const n = lireInline("[cliquez](javascript:alert(1))");
  assert.equal(n.some((x) => x.t === "lien"), false);
  assert.equal(texteDe(n), "cliquez");
});

test("bouton", () => {
  const [n] = lireInline("[Je m'inscris](https://exemple.fr){.bouton}");
  assert.ok(n.t === "lien" && n.bouton);
});

test("HTML saisi : traité comme du texte (jamais interprété)", () => {
  const n = lireInline("<script>alert(1)</script> <b>x</b>");
  assert.equal(n.length, 1);
  assert.equal(n[0].t, "texte");
});

test("crochets non fermés et imbrications profondes ne plantent pas", () => {
  lireInline("[[[[[[ texte");
  lireInline("[".repeat(5000) + "x" + "]{.rose}".repeat(5000));
  lireInline("*".repeat(5000));
  lireInline("**a ".repeat(3000));
});

// ─── Blocs ──────────────────────────────────────────────────────────────────────
test("titres : niveaux, identifiants uniques et sommaire", () => {
  const { blocs, sommaire } = lireArticle("# Un\n\n## Deux\n\n### Trois\n\n## Deux");
  assert.deepEqual(blocs.map((b) => b.t === "titre" && b.niveau), [2, 2, 3, 2]);
  assert.deepEqual(sommaire.map((s) => s.id), ["un", "deux", "trois", "deux-2"]);
});

test("listes : puces, numérotées, cases", () => {
  const { blocs } = lireArticle("- a\n- b\n\n1. un\n2. deux\n\n- [ ] à faire\n- [x] fait");
  assert.deepEqual(blocs.map((b) => b.t === "liste" && [b.ordonnee, b.items.length]), [[false, 2], [true, 2], [false, 2]]);
  const cases = blocs[2];
  assert.ok(cases.t === "liste" && cases.items[0].case === false && cases.items[1].case === true);
});

test("une année en début de ligne ne devient pas une liste", () => {
  assert.equal(lireArticle("En\n2026. Une année").blocs.length, 1);
});

test("citation avec auteur", () => {
  const [b] = lireArticle("> Une phrase.\n> — Marie").blocs;
  assert.ok(b.t === "citation" && b.auteur !== null && texteDe(b.auteur) === "Marie");
});

test("séparateur", () => {
  assert.equal(lireArticle("A\n\n---\n\nB").blocs[1].t, "separateur");
});

test("images : téléversées seulement ; taille et position", () => {
  const [ok, ko] = lireArticle(`![Légende](${IMAGE}){.petite .droite}\n\n![x](https://exemple.fr/a.jpg)`).blocs;
  assert.ok(ok.t === "image" && ok.src === IMAGE && ok.taille === "petite" && ok.position === "droite" && ok.legende === "Légende");
  assert.ok(ko.t === "image" && ko.src === null);
});

test("conteneurs : titre, imbrication, non fermé", () => {
  const { blocs } = lireArticle(":::info À savoir\nTexte\n\n:::conseil\nAstuce\n:::\n:::\n\nAprès\n\n:::important\nSans fin");
  assert.equal(blocs.length, 3);
  const info = blocs[0];
  assert.ok(info.t === "conteneur" && info.nom === "info" && info.titre !== null && texteDe(info.titre) === "À savoir");
  assert.ok(info.t === "conteneur" && info.c.some((x: Bloc) => x.t === "conteneur" && x.nom === "conseil"));
  assert.ok(blocs[2].t === "conteneur" && blocs[2].nom === "important");
});

test("conteneur inconnu : traité comme du texte, fermeture orpheline ignorée", () => {
  const { blocs } = lireArticle(":::inconnu\nTexte\n:::");
  assert.deepEqual(blocs.map((b) => b.t), ["paragraphe"]);
});

test("colonnes", () => {
  const { blocs } = lireArticle(":::colonnes\nGauche\n\n+++\n\nDroite\n:::");
  const c = blocs[0];
  assert.ok(c.t === "conteneur" && c.c.map((x) => x.t).join() === "paragraphe,coupure,paragraphe");
});

test("imbrication excessive : pas de plantage", () => {
  lireArticle(":::info\n".repeat(5000) + "x");
});

// ─── Outils ─────────────────────────────────────────────────────────────────────
test("temps de lecture et comptage des mots", () => {
  const { mots, minutes } = lireArticle("mot ".repeat(450));
  assert.equal(mots, 450);
  assert.equal(minutes, 2);
  assert.equal(lireArticle("Court.").minutes, 1);
});

test("images du texte (nettoyage des fichiers)", () => {
  assert.deepEqual(imagesDuTexte(`![a](${IMAGE})\n![b](${IMAGE})`), [IMAGE]);
  assert.deepEqual(imagesDuTexte(null), []);
});

console.log(`\n${nombre} tests réussis.`);
