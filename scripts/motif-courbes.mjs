// Génère le motif de courbes de niveau du bandeau d'accueil : public/brand/motif-courbes.svg
// Utilisation : `node scripts/motif-courbes.mjs` (le résultat est déterministe, même graine = même motif).
// Motif original, raccordable sur 600 × 600 px.
// Relief = bruit de gradient périodique (le relief se referme sur lui-même aux bords),
// découpé en lignes de niveau par « marching squares », puis assemblé en tracés continus.
import fs from "node:fs";

const TUILE = 600; // px
const N = 240; // échantillons par côté (2,5 px)
const NIVEAUX = 22; // nombre de lignes de niveau
const MAJEURE = 5; // une ligne sur cinq plus marquée

function alea(graine) {
  return function () {
    graine |= 0; graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bruit de Perlin périodique de période P (en cellules de réseau)
function bruitPeriodique(P, r) {
  const g = Array.from({ length: P * P }, () => {
    const a = r() * Math.PI * 2;
    return [Math.cos(a), Math.sin(a)];
  });
  const lisse = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    // x, y dans [0, 1)
    const X = x * P, Y = y * P;
    const x0 = Math.floor(X), y0 = Math.floor(Y);
    const fx = X - x0, fy = Y - y0;
    const coin = (i, j) => {
      const v = g[((y0 + j) % P) * P + ((x0 + i) % P)];
      return v[0] * (fx - i) + v[1] * (fy - j);
    };
    const u = lisse(fx), v = lisse(fy);
    const a = coin(0, 0) + u * (coin(1, 0) - coin(0, 0));
    const b = coin(0, 1) + u * (coin(1, 1) - coin(0, 1));
    return a + v * (b - a);
  };
}

const r = alea(1983);
const octaves = [
  [bruitPeriodique(3, r), 1],
  [bruitPeriodique(6, r), 0.45],
  [bruitPeriodique(12, r), 0.18],
];
const champ = new Float64Array(N * N);
let min = Infinity, max = -Infinity;
for (let j = 0; j < N; j++)
  for (let i = 0; i < N; i++) {
    let h = 0;
    for (const [f, a] of octaves) h += f(i / N, j / N) * a;
    champ[j * N + i] = h;
    min = Math.min(min, h); max = Math.max(max, h);
  }
const H = (i, j) => champ[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
const pas = TUILE / N;

// Marching squares : segments pour un niveau donné (les cellules du bord bouclent sur l'autre bord)
function segments(niv) {
  const segs = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = H(i, j), b = H(i + 1, j), c = H(i + 1, j + 1), d = H(i, j + 1);
      const k = (a > niv) | ((b > niv) << 1) | ((c > niv) << 2) | ((d > niv) << 3);
      if (k === 0 || k === 15) continue;
      const t = (p, q) => (niv - p) / (q - p);
      const haut = [i + t(a, b), j], droite = [i + 1, j + t(b, c)];
      const bas = [i + t(d, c), j + 1], gauche = [i, j + t(a, d)];
      const table = {
        1: [[gauche, haut]], 2: [[haut, droite]], 3: [[gauche, droite]], 4: [[droite, bas]],
        5: [[gauche, haut], [droite, bas]], 6: [[haut, bas]], 7: [[gauche, bas]], 8: [[bas, gauche]],
        9: [[bas, haut]], 10: [[haut, droite], [bas, gauche]], 11: [[bas, droite]], 12: [[droite, gauche]],
        13: [[droite, haut]], 14: [[haut, gauche]],
      };
      for (const s of table[k]) segs.push(s);
    }
  return segs;
}

// Assemble les segments en polylignes continues
function assembler(segs) {
  const cle = (p) => Math.round(p[0] * 1000) + "," + Math.round(p[1] * 1000);
  const parBout = new Map();
  segs.forEach((s, n) => {
    for (const p of s) {
      const k = cle(p);
      if (!parBout.has(k)) parBout.set(k, []);
      parBout.get(k).push(n);
    }
  });
  const pris = new Uint8Array(segs.length);
  const lignes = [];
  const prolonger = (ligne) => {
    for (;;) {
      const bout = ligne[ligne.length - 1];
      const suivant = (parBout.get(cle(bout)) || []).find((n) => !pris[n]);
      if (suivant === undefined) return;
      pris[suivant] = 1;
      const [p, q] = segs[suivant];
      ligne.push(cle(p) === cle(bout) ? q : p);
    }
  };
  segs.forEach((s, n) => {
    if (pris[n]) return;
    pris[n] = 1;
    const ligne = [s[0], s[1]];
    prolonger(ligne);
    ligne.reverse();
    prolonger(ligne);
    lignes.push(ligne);
  });
  return lignes;
}

// Simplification Ramer-Douglas-Peucker (tolérance en px) : allège le fichier sans changer le dessin
function simplifier(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  // Boucle fermée : on la coupe en deux pour que la simplification ne l'écrase pas
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) {
    const mi = Math.floor(pts.length / 2);
    return simplifier(pts.slice(0, mi + 1), tol).slice(0, -1).concat(simplifier(pts.slice(mi), tol));
  }
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9;
  let dmax = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= tol) return [a, b];
  return simplifier(pts.slice(0, idx + 1), tol).slice(0, -1).concat(simplifier(pts.slice(idx), tol));
}
const r1 = (v) => Math.round(v * 10) / 10;
function tracer(l) {
  const pts = simplifier(l.map(([x, y]) => [x * pas, y * pas]), 0.4).map(([x, y]) => [r1(x), r1(y)]);
  let d = "M" + pts[0][0] + " " + pts[0][1] + "l";
  for (let m = 1; m < pts.length; m++) {
    const dx = r1(pts[m][0] - pts[m - 1][0]), dy = r1(pts[m][1] - pts[m - 1][1]);
    d += (m > 1 && dx >= 0 ? " " : "") + dx + (dy >= 0 ? " " : "") + dy;
  }
  return d;
}
let mineures = "", majeures = "";
for (let n = 1; n < NIVEAUX; n++) {
  const niv = min + ((max - min) * n) / NIVEAUX;
  let d = "";
  for (const l of assembler(segments(niv))) {
    if (l.length < 3) continue;
    d += tracer(l);
  }
  if (n % MAJEURE === 0) majeures += d; else mineures += d;
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TUILE}" height="${TUILE}" viewBox="0 0 ${TUILE} ${TUILE}">` +
  `<g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">` +
  `<path stroke-width="1" d="${mineures}"/>` +
  `<path stroke-width="1.8" d="${majeures}"/>` +
  `</g></svg>`;
fs.writeFileSync(new URL("../public/brand/motif-courbes.svg", import.meta.url), svg);
console.log("taille", (svg.length / 1024).toFixed(0), "ko");
