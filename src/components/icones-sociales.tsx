// Icônes Instagram et LinkedIn (lucide-react n'a plus d'icônes de marque) et rangée de liens vers les
// réseaux de l'association. Adresses : `site.liens` dans src/lib/site.ts ; un lien à null n'est pas affiché.

import { site } from "@/lib/site";

type PropsIcone = { size?: number; className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function IconeInstagram({ size = 18, className }: PropsIcone) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function IconeLinkedin({ size = 18, className }: PropsIcone) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

/** Les réseaux de l'association configurés dans `site.liens`. */
export function reseauxDeLAssociation() {
  return [
    { cle: "instagram", nom: "Instagram", lien: site.liens.instagram, Icone: IconeInstagram },
    { cle: "linkedin", nom: "LinkedIn", lien: site.liens.linkedin, Icone: IconeLinkedin },
  ].flatMap((r) => (r.lien ? [{ ...r, lien: r.lien }] : []));
}

/**
 * Pastilles rondes vers Instagram et LinkedIn. `clair` : sur fond bordeaux ; `sombre` : sur fond clair.
 * Ne rend rien si aucun réseau n'est renseigné.
 */
export function LiensReseaux({ variante = "clair", className = "" }: { variante?: "clair" | "sombre"; className?: string }) {
  const reseaux = reseauxDeLAssociation();
  if (reseaux.length === 0) return null;
  const style =
    variante === "clair"
      ? "border-white/55 text-white hover:bg-white hover:text-bordeaux-700"
      : "border-bordeaux-700 text-bordeaux-700 hover:bg-bordeaux-700 hover:text-white";
  return (
    <ul className={`flex items-center gap-2.5 ${className}`}>
      {reseaux.map(({ cle, nom, lien, Icone }) => (
        <li key={cle}>
          <a
            href={lien}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${nom} (nouvel onglet)`}
            className={`inline-flex size-9 items-center justify-center rounded-full border transition-colors ${style}`}
          >
            <Icone size={18} />
          </a>
        </li>
      ))}
    </ul>
  );
}
