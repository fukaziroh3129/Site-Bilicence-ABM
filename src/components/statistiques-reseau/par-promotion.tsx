"use client";

// « Par promotion » : pour chaque promotion, la répartition entre master à l'université, IEP, école
// ou étranger (formation la plus récente), en poste, et encore en bi-licence. Barres à 100 %.

import { personnes, type Ouvrir, type PersonneStat } from "./outils";

const CATEGORIES = [
  { cle: "UNIVERSITE", libelle: "Master à l’université", fond: "#5C1A1E", clair: false },
  { cle: "IEP", libelle: "IEP", fond: "#B85C5F", clair: false },
  { cle: "ECOLE", libelle: "École ou étranger", fond: "#E6BDBE", clair: true },
  { cle: "POSTE", libelle: "En poste", fond: "#5A4446", clair: false },
  { cle: "LICENCE", libelle: "En bi-licence", fond: "#EDE3D3", clair: true },
] as const;
type Categorie = (typeof CATEGORIES)[number]["cle"];

function categorie(p: PersonneStat): Categorie | null {
  const f = p.formations[0];
  if (f) return f.type === "ETRANGER" ? "ECOLE" : f.type;
  if (p.enLicence) return "LICENCE";
  if (p.travaille) return "POSTE";
  return null;
}

const hachures = "repeating-linear-gradient(135deg, rgba(92,26,30,.22) 0 1.5px, transparent 1.5px 6px)";

export function ParPromotion({ liste, ouvrir, survol }: { liste: PersonneStat[]; ouvrir: Ouvrir; survol: (contenu: React.ReactNode) => Record<string, unknown> }) {
  const classees = liste.map((p) => ({ p, c: categorie(p) })).filter((x): x is { p: PersonneStat; c: Categorie } => x.c !== null);
  const promos = [...new Set(classees.map((x) => x.p.promo))].sort((a, b) => b - a);
  if (promos.length === 0) return <p className="text-sm text-ink-soft">Pas encore assez de fiches renseignées.</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-soft">
        {CATEGORIES.map((c) => (
          <span key={c.cle} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={`size-3 rounded-[3px] ${c.clair ? "ring-1 ring-inset ring-bordeaux-700/30" : ""}`}
              style={{ backgroundColor: c.fond, backgroundImage: c.cle === "LICENCE" ? hachures : undefined }}
            />
            {c.libelle}
          </span>
        ))}
      </div>
      <ul className="space-y-1.5">
        {promos.map((promo) => {
          const de = classees.filter((x) => x.p.promo === promo);
          const libelle = de[0].p.libellePromo;
          return (
            <li key={promo} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-3">
              <span className="text-sm font-semibold tabular-nums">{libelle}</span>
              <span className="flex h-7 gap-[2px]">
                {CATEGORIES.map((c) => {
                  const ps = de.filter((x) => x.c === c.cle).map((x) => x.p);
                  if (ps.length === 0) return null;
                  return (
                    <button
                      key={c.cle}
                      type="button"
                      onClick={() => ouvrir({ surtitre: `Promotion ${libelle}`, titre: c.libelle, personnes: ps })}
                      aria-label={`Promotion ${libelle}, ${c.libelle} : ${personnes(ps.length)} sur ${de.length}`}
                      className={`grid h-full min-w-[3px] place-items-center overflow-hidden text-xs font-semibold first:rounded-l-[4px] last:rounded-r-[4px] hover:brightness-110 focus-visible:brightness-110 ${
                        c.clair ? "text-ink ring-1 ring-inset ring-bordeaux-700/25" : "text-white"
                      }`}
                      style={{ flex: ps.length, backgroundColor: c.fond, backgroundImage: c.cle === "LICENCE" ? hachures : undefined }}
                      {...survol(
                        <>
                          <b className="block text-sm">Promotion {libelle}</b>
                          {c.libelle} : {personnes(ps.length)} sur {de.length}
                          <br />
                          <span className="text-bordeaux-200">Cliquer pour la liste</span>
                        </>,
                      )}
                    >
                      {ps.length / de.length > 0.12 ? ps.length : ""}
                    </button>
                  );
                })}
              </span>
              <span className="text-right text-[13px] text-ink-soft tabular-nums">{de.length}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-soft">
        Formation la plus récente de chacun ; le nombre à droite compte les fiches renseignées de la promotion.
      </p>
    </div>
  );
}
