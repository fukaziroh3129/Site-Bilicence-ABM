import { Plus } from "lucide-react";
import Link from "next/link";
import { parametre } from "@/components/filtres";
import { OffresInteractives, type OffreCarte } from "@/components/offres/offres-interactives";
import { BandeauEspace, Panneau, Pastille, buttonClasses } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_TYPE_OFFRE, dateCourte, libellePromo } from "@/lib/format";
import { exigerMembreActif } from "@/lib/session";

export const metadata = { title: "Offres" };

const LIBELLES_STATUT = { EN_ATTENTE: "En relecture", PUBLIEE: "Publiée", REFUSEE: "Non retenue" } as const;
const JOUR = 24 * 60 * 60 * 1000;

/** « Claire F. (2021-2024) » : prénom et initiale, comme dans un réseau d'anciens. */
function auteur(u: { prenom: string; nom: string; promoEntree: number | null } | null) {
  if (!u || !u.prenom) return null;
  const nom = u.nom ? ` ${u.nom.trim()[0].toUpperCase()}.` : "";
  return `${u.prenom}${nom}${u.promoEntree ? ` (${libellePromo(u.promoEntree)})` : ""}`;
}

export default async function Offres({ searchParams }: PageProps<"/espace/offres">) {
  const { user } = await exigerMembreActif();
  const p = await searchParams;
  const maintenant = new Date();
  const debutJournee = new Date(maintenant);
  debutJournee.setHours(0, 0, 0, 0);

  const [offres, mesOffres] = await Promise.all([
    prisma.offre.findMany({
      where: { statut: "PUBLIEE", OR: [{ dateLimite: null }, { dateLimite: { gte: debutJournee } }] },
      include: { deposePar: { select: { prenom: true, nom: true, promoEntree: true } } },
      orderBy: { publieeLe: "desc" },
    }),
    prisma.offre.findMany({ where: { deposeParId: user.id }, orderBy: { creeLe: "desc" }, take: 10 }),
  ]);

  const cartes: OffreCarte[] = offres.map((o) => ({
    id: o.id,
    titre: o.titre,
    type: o.type,
    typeLibelle: LIBELLES_TYPE_OFFRE[o.type],
    organisation: o.organisation,
    lieu: o.lieu,
    description: o.description,
    lien: o.lien,
    contact: o.contact,
    dateLimite: o.dateLimite?.getTime() ?? null,
    publieeLe: o.publieeLe?.getTime() ?? null,
    joursRestants: o.dateLimite ? Math.max(0, Math.ceil((o.dateLimite.getTime() - maintenant.getTime()) / JOUR)) : null,
    proposePar: auteur(o.deposePar),
  }));

  const tri = parametre(p.tri);
  const type = parametre(p.type);

  return (
    <div className="space-y-8">
      <BandeauEspace
        titre="Offres de stage et d’emploi"
        phrase="Transmises par les membres du réseau et relues par le bureau."
        chiffre={cartes.length}
        libelleChiffre={`offre${cartes.length > 1 ? "s" : ""} en cours`}
        action={
          <Link href="/espace/offres/proposer" className={buttonClasses("inverse")}>
            <Plus size={16} aria-hidden /> Proposer une offre
          </Link>
        }
      />
      <OffresInteractives
        offres={cartes}
        types={Object.entries(LIBELLES_TYPE_OFFRE).map(([valeur, libelle]) => ({ valeur, libelle }))}
        initial={{
          q: parametre(p.q) ?? "",
          type: type && type in LIBELLES_TYPE_OFFRE ? type : "",
          tri: tri === "limite" ? "limite" : "recent",
        }}
        aside={
          mesOffres.length > 0 ? (
            <Panneau titre="Mes offres" compte={mesOffres.length}>
              <ul className="divide-y divide-bordeaux-700/10 text-sm">
                {mesOffres.map((o) => (
                  <li key={o.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block font-semibold">{o.titre}</span>
                      <span className="text-ink-soft">proposée le {dateCourte(o.creeLe)}</span>
                    </span>
                    <span className="shrink-0">
                      <Pastille accent={o.statut === "PUBLIEE"}>{LIBELLES_STATUT[o.statut]}</Pastille>
                    </span>
                  </li>
                ))}
              </ul>
            </Panneau>
          ) : (
            <Panneau titre="Une offre à partager ?">
              <p className="text-sm text-ink-soft">
                Stage, alternance ou emploi : le bureau relit chaque proposition, puis tout le réseau est prévenu par e-mail.
              </p>
              <Link href="/espace/offres/proposer" className={`mt-4 ${buttonClasses("outline", "petit")}`}>
                <Plus size={14} aria-hidden /> Proposer une offre
              </Link>
            </Panneau>
          )
        }
      />
    </div>
  );
}
