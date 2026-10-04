// Pays et universités d'Erasmus : ramène les écritures du fichier Erasmus (souvent la seule ville) à
// un établissement unique. Partagé par `import-donnees-reelles.ts` et `exporter-csv-precomptes.ts`.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sansAccent } from "./compilation-donnees";


/** Codes des pays connus du site (ceux de la carte du monde) : « ES », « CZ »… */
const CODES_PAYS: string[] = Object.keys(JSON.parse(readFileSync(join("src", "lib", "carte-monde.json"), "utf8")).noms);

/** « Espagne » → « ES » : cherche parmi les pays de la carte, nommés en français. */
export function codePays(nom: string) {
  const alias: Record<string, string> = { "rep.tcheque": "CZ", "pays bas": "NL" };
  const cle = sansAccent(nom).trim();
  if (alias[cle]) return alias[cle];
  const noms = new Intl.DisplayNames(["fr"], { type: "region" });
  return CODES_PAYS.find((code) => sansAccent(noms.of(code) ?? "") === cle) ?? null;
}

/** Établissements de poursuite d'études situés hors de France (la liste est reliée avec « FR » par défaut). */
export const PAYS_FORMATIONS: Record<string, string> = {
  "london school of economics": "GB",
  "universite de lausanne": "CH",
  "universite d'ottawa": "CA",
};

/**
 * Le fichier Erasmus donne souvent la VILLE (« Grenade », « Bologne ») plutôt que l'université : on
 * ramène chaque écriture à un établissement unique. Tous sont marqués « à contrôler » (le bureau
 * corrige dans Administration → Établissements).
 */
const UNIVERSITES: { motif: RegExp; nom: string; ville: string }[] = [
  { motif: /gatineau/, nom: "Gatineau (université à préciser)", ville: "Gatineau" },
  { motif: /budapest|elte/, nom: "ELTE University", ville: "Budapest" },
  { motif: /grenade/, nom: "Université de Grenade", ville: "Grenade" },
  { motif: /bologne|forli/, nom: "Université de Bologne", ville: "Bologne" },
  { motif: /potsdam/, nom: "Université de Potsdam", ville: "Potsdam" },
  { motif: /prague|charles/, nom: "Université Charles de Prague", ville: "Prague" },
  { motif: /turku/, nom: "Université de Turku", ville: "Turku" },
  { motif: /coimbra/, nom: "Université de Coimbra", ville: "Coimbra" },
  { motif: /bergen/, nom: "Université de Bergen", ville: "Bergen" },
  { motif: /javeriana|cali/, nom: "Pontificia Universidad Javeriana", ville: "Cali" },
  { motif: /utrecht/, nom: "Université d’Utrecht", ville: "Utrecht" },
];

export function universiteDe(lieu: string, pays: string) {
  const cle = sansAccent(lieu);
  const trouvee = cle ? UNIVERSITES.find((u) => u.motif.test(cle)) : undefined;
  if (trouvee) return { nom: trouvee.nom, ville: trouvee.ville, devine: !/\buniversit|\buniversity|\bcharles|\belte/.test(cle) };
  if (!cle) return { nom: `Université à préciser (${pays})`, ville: null, devine: true };
  return { nom: lieu, ville: null, devine: true };
}

