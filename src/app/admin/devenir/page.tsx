import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Panneau, EnTeteConsole, Vide, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { dictionnaireDomaines } from "@/lib/domaines";
import { dateCourte, libellePromo } from "@/lib/format";
import { SELECTION_CARTE, versCarteParcours } from "@/lib/parcours";
import { exigerBureau } from "@/lib/session";
import { FICHE_PUBLIQUE, FICHE_VISIBLE } from "@/lib/visibilite";
import { ListeCartes, type LigneCarte, type VueCartes } from "./liste-cartes";

export const metadata = { title: "Que sont-ils devenus ?" };

const OU_A_CONTROLER = { ...FICHE_PUBLIQUE, publicControleLe: null };
const OU_PUBLIEES = { ...FICHE_PUBLIQUE, publicControleLe: { not: null } };
const OU_RETIREES = { publicRetireLe: { not: null }, ...FICHE_VISIBLE };

const VUES: { cle: VueCartes; libelle: string; aide: string }[] = [
  {
    cle: "a-controler",
    libelle: "À contrôler",
    aide: "Cartes déjà visibles sur la page publique, que personne du bureau n’a encore relues (ou que la personne a modifiées depuis).",
  },
  { cle: "publiees", libelle: "Publiées", aide: "Cartes visibles sur la page publique et déjà contrôlées." },
  { cle: "retirees", libelle: "Retirées", aide: "Cartes retirées par le bureau : elles n’apparaissent plus tant que vous ne les rétablissez pas." },
];

export default async function AdminDevenir({ searchParams }: PageProps<"/admin/devenir">) {
  await exigerBureau();
  const p = await searchParams;
  const vue = VUES.find((v) => v.cle === p.vue)?.cle ?? "a-controler";

  const [nbAControler, nbPubliees, nbRetirees, domaines] = await Promise.all([
    prisma.personne.count({ where: OU_A_CONTROLER }),
    prisma.personne.count({ where: OU_PUBLIEES }),
    prisma.personne.count({ where: OU_RETIREES }),
    dictionnaireDomaines(),
  ]);
  const nombres: Record<VueCartes, number> = { "a-controler": nbAControler, publiees: nbPubliees, retirees: nbRetirees };

  const personnes = await prisma.personne.findMany({
    where: vue === "a-controler" ? OU_A_CONTROLER : vue === "publiees" ? OU_PUBLIEES : OU_RETIREES,
    select: {
      ...SELECTION_CARTE,
      consentementPublic: true,
      consentementPublicLe: true,
      publicControleLe: true,
      publicRetireLe: true,
      publicRetireMotif: true,
    },
    // Les plus anciennes d'abord : ce sont celles qui attendent depuis le plus longtemps.
    orderBy: vue === "a-controler" ? [{ consentementPublicLe: { sort: "asc", nulls: "first" } }, { nom: "asc" }] : [{ nom: "asc" }, { prenom: "asc" }],
  });

  const lignes: LigneCarte[] = personnes.map((pe) => {
    const carte = versCarteParcours(pe);
    return {
      id: pe.id,
      nom: `${pe.prenom} ${pe.nom}`,
      promo: libellePromo(pe.promoEntree),
      aujourdhui: carte.aujourdhui ? [carte.aujourdhui.titre, carte.aujourdhui.structure].filter(Boolean).join(" · ") : null,
      presentation: pe.presentation,
      conseil: pe.conseil,
      domaines: pe.secteurs.map((c) => domaines.court(c)),
      nbFormations: carte.etapes.filter((e) => !e.base).length,
      nbExperiences: carte.experiences.length + carte.erasmus.length,
      accordLe: pe.consentementPublicLe ? dateCourte(pe.consentementPublicLe) : null,
      controleLe: pe.publicControleLe ? dateCourte(pe.publicControleLe) : null,
      retireLe: pe.publicRetireLe ? dateCourte(pe.publicRetireLe) : null,
      motifRetrait: pe.publicRetireMotif,
      accordRetire: !pe.consentementPublic,
      carte,
    };
  });

  const courts = Object.fromEntries(domaines.domaines.map((d) => [d.code, d.court]));
  const actuelle = VUES.find((v) => v.cle === vue)!;

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Que sont-ils devenus ?"
        phrase={
          <>
            Une carte apparaît sur la page publique dès que la personne a donné son accord. Vous contrôlez <b className="text-ink">après coup</b> :
            validez ce qui est en ordre, retirez ce qui ne devrait pas être public (le motif est transmis à la personne). Quand quelqu’un
            modifie sa fiche, sa carte revient dans « À contrôler ».
          </>
        }
        action={
          <Link href="/promotions" className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
            Voir la page publique <ExternalLink size={14} aria-hidden />
          </Link>
        }
      />

      <nav aria-label="Cartes" className="flex flex-wrap gap-2">
        {VUES.map((v) => (
          <Link
            key={v.cle}
            href={v.cle === "a-controler" ? "/admin/devenir" : `/admin/devenir?vue=${v.cle}`}
            aria-current={v.cle === vue ? "page" : undefined}
            className={`inline-flex min-h-9 items-center gap-2 rounded-abm-pill border px-4 py-1.5 text-sm font-semibold transition-colors ${
              v.cle === vue
                ? "border-bordeaux-700 bg-bordeaux-700 text-white"
                : "border-bordeaux-700/30 bg-white text-bordeaux-700 hover:border-bordeaux-700 hover:bg-bordeaux-100"
            }`}
          >
            {v.libelle}
            <span className="tabular-nums opacity-80">{nombres[v.cle]}</span>
          </Link>
        ))}
      </nav>

      <Panneau titre={actuelle.libelle} corps={false} action={<span className="hidden max-w-[48ch] text-right text-sm text-ink-soft md:block">{actuelle.aide}</span>}>
        {lignes.length === 0 ? (
          <Vide>
            {vue === "a-controler"
              ? "Toutes les cartes publiées ont été contrôlées."
              : vue === "publiees"
                ? "Aucune carte contrôlée pour l’instant."
                : "Aucune carte retirée."}
          </Vide>
        ) : (
          // La clé remet la sélection à zéro quand on change d'onglet.
          <ListeCartes key={vue} lignes={lignes} vue={vue} courts={courts} />
        )}
      </Panneau>
    </div>
  );
}
