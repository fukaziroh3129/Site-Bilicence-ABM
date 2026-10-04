// Génère src/lib/carte-monde.json : le dessin des pays (tracés SVG) pour la carte des Erasmus,
// et la liste des pays en français. À relancer seulement si l'on veut changer la carte :
//   node scripts/carte-monde.mjs
// Données : world-atlas (Natural Earth, domaine public). Rien n'est chargé depuis Internet par
// les visiteurs : la carte est dessinée par le site lui-même.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoNaturalEarth1 } from "d3-geo";
import countries from "i18n-iso-countries";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
countries.registerLocale(require("i18n-iso-countries/langs/fr.json"));

const monde = JSON.parse(readFileSync(require.resolve("world-atlas/countries-50m.json"), "utf8"));
const tous = feature(monde, monde.objects.countries).features.filter((f) => f.properties.name !== "Antarctica");

const LARGEUR = 1000;
const HAUTEUR = 520;
const projection = geoNaturalEarth1().fitSize([LARGEUR, HAUTEUR], { type: "FeatureCollection", features: tous });

// Tracé simplifié : on saute les points à moins de SEUIL pixel du précédent (invisibles à l'écran,
// même zoomé sur l'Europe), et les îlots minuscules.
const SEUIL = 0.5;
const ILOT = 1.5; // taille (px) en dessous de laquelle une île est ignorée
function anneau(points, garderTout) {
  const gardes = [];
  for (const [lon, lat] of points) {
    const p = projection([lon, lat]).map((v) => Math.round(v * 10)); // dixièmes de pixel, entiers
    const dernier = gardes.at(-1);
    if (!dernier || Math.hypot(p[0] - dernier[0], p[1] - dernier[1]) >= SEUIL * 10) gardes.push(p);
  }
  const xs = gardes.map((p) => p[0]);
  const ys = gardes.map((p) => p[1]);
  const taille = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 10;
  if (!garderTout && (gardes.length < 3 || taille < ILOT)) return "";
  // Coordonnées relatives (« l ») : plus courtes. Tout est en dixièmes de pixel (agrandi ×10 dans le viewBox).
  let d = `M${gardes[0][0]} ${gardes[0][1]}`;
  for (let i = 1; i < gardes.length; i++) d += `l${gardes[i][0] - gardes[i - 1][0]} ${gardes[i][1] - gardes[i - 1][1]}`;
  return d + "z";
}
function trace(f) {
  const g = f.geometry;
  const polygones = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  const d = polygones.map((poly) => poly.map((r) => anneau(r, false)).join("")).join("");
  if (d) return d;
  // Pays trop petit pour la carte (Malte…) : on garde au moins son île principale.
  const principale = polygones.map((poly) => poly[0]).sort((x, y) => y.length - x.length)[0];
  return principale ? anneau(principale, true) : "";
}

// Codes à deux lettres (« AT ») ; quelques territoires n'ont pas de code numérique dans les données.
const SANS_CODE = { Kosovo: "XK", "N. Cyprus": "CY", Somaliland: "SO" };
const parCode = new Map();
for (const f of tous) {
  const code = (f.id && countries.numericToAlpha2(f.id)) || SANS_CODE[f.properties.name];
  if (!code) continue;
  const d = trace(f);
  if (!d) continue;
  parCode.set(code, parCode.has(code) ? parCode.get(code) + d : d);
}

/** Cadre [x, y, largeur, hauteur] englobant une zone géographique (longitudes, latitudes). */
function cadre([lonMin, latMin, lonMax, latMax]) {
  const points = [];
  for (let lon = lonMin; lon <= lonMax; lon += 1) for (const lat of [latMin, latMax]) points.push(projection([lon, lat]));
  for (let lat = latMin; lat <= latMax; lat += 1) for (const lon of [lonMin, lonMax]) points.push(projection([lon, lat]));
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y].map((v) => Math.round(v));
}

const noms = countries.getNames("fr", { select: "official" });
noms.XK = "Kosovo";

const sortie = {
  // Cadres d'affichage (viewBox), en dixièmes de pixel comme les tracés.
  vues: { monde: [0, 0, LARGEUR * 10, HAUTEUR * 10], europe: cadre([-12, 34, 34, 66]).map((v) => v * 10) },
  noms,
  pays: [...parCode].map(([code, d]) => ({ code, d })),
};
writeFileSync(new URL("../src/lib/carte-monde.json", import.meta.url), JSON.stringify(sortie));
console.log(`${sortie.pays.length} pays dessinés, ${Object.keys(noms).length} noms de pays.`);
