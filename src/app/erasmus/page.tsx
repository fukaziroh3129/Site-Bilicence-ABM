import type { Metadata } from "next";
import { connection } from "next/server";
import { CarteErasmus, type DestinationPays } from "@/components/erasmus/carte-erasmus";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_NIVEAU, libellePromo } from "@/lib/format";
import { LIBELLES_DUREE_ERASMUS, nomPays } from "@/lib/pays";
import { obtenirSession } from "@/lib/session";
import { FICHE_VISIBLE } from "@/lib/visibilite";

export const metadata: Metadata = {
  title: "Erasmus",
  description: "Les universités et les pays où sont partis les étudiants de la bi-licence Économie / Science politique de Montpellier.",
};

export default async function PageErasmus() {
  await connection(); // lecture de la base à chaque visite
  const session = await obtenirSession();
  const membre = session?.user.statut === "ACTIF";

  // Tous les séjours sont comptés (chiffres anonymes : pays, université, nombre de départs).
  // Les noms et les détails ne sont envoyés au navigateur que pour les membres connectés.
  const sejours = await prisma.erasmus.findMany({
    where: { personne: FICHE_VISIBLE },
    include: {
      universite: true,
      personne: { select: { id: true, prenom: true, nom: true, promoEntree: true } },
    },
    orderBy: [{ annee: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }],
  });

  const parPays = new Map<string, DestinationPays>();
  for (const s of sejours) {
    const u = s.universite;
    const pays = parPays.get(u.pays) ?? { code: u.pays, nom: nomPays(u.pays), departs: 0, universites: [] };
    parPays.set(u.pays, pays);
    pays.departs++;
    let univ = pays.universites.find((x) => x.id === u.id);
    if (!univ) {
      univ = { id: u.id, nom: u.nom, ville: u.ville, departs: 0, ...(membre ? { sejours: [] } : {}) };
      pays.universites.push(univ);
    }
    univ.departs++;
    if (membre) {
      univ.sejours!.push({
        id: s.id,
        personneId: s.personne.id,
        nom: `${s.personne.prenom} ${s.personne.nom}`,
        details: [
          `Promo ${libellePromo(s.personne.promoEntree).replace("-", "–")}`,
          s.niveau && LIBELLES_NIVEAU[s.niveau],
          s.annee,
          s.duree && LIBELLES_DUREE_ERASMUS[s.duree],
        ]
          .filter(Boolean)
          .join(" · "),
        descriptif: s.descriptif,
        aUnRetour: !!s.retour,
      });
    }
  }
  const destinations = [...parPays.values()]
    .map((p) => ({ ...p, universites: p.universites.sort((a, b) => b.departs - a.departs || a.nom.localeCompare(b.nom, "fr")) }))
    .sort((a, b) => b.departs - a.departs || a.nom.localeCompare(b.nom, "fr"));

  const nbUniversites = destinations.reduce((n, p) => n + p.universites.length, 0);
  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

  return (
    <>
      <PageHeader
        eyebrow="Partir pendant ses études"
        title="Erasmus"
        lead="Où sont partis les étudiants de la bi-licence : pays, universités et nombre de départs. Erasmus désigne ici tout séjour d’études à l’étranger, en Europe ou ailleurs."
        aside={
          destinations.length > 0 && (
            <div className="border-l border-white/30 pl-6 lg:min-w-56">
              <p className="font-impact text-7xl leading-none sm:text-8xl">{destinations.length}</p>
              <p className="mt-1 font-display text-xl font-bold">{destinations.length > 1 ? "pays différents" : "pays"}</p>
              <p className="mt-3 text-sm text-white/76">
                {pluriel(sejours.length, "départ")} · {pluriel(nbUniversites, "université")}
              </p>
            </div>
          )
        }
      />

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-8">
        <CarteErasmus destinations={destinations} membre={membre} />

        <p className="border-t border-bordeaux-700/20 pt-6 text-sm text-ink-soft">
          Sans compte, seuls les chiffres sont visibles : aucun nom n’apparaît sur cette page. Les membres
          connectés voient qui est parti et peuvent lire les retours d’expérience sur les fiches.
        </p>
      </div>
    </>
  );
}
