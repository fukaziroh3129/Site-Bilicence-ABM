import type { Metadata } from "next";
import { connection } from "next/server";
import { type DestinationPays, type NiveauSejour, VueErasmus } from "@/components/erasmus/carte-erasmus";
import { prisma } from "@/lib/db";
import { libellePromo } from "@/lib/format";
import { LIBELLES_DUREE_ERASMUS, nomPays } from "@/lib/pays";
import { obtenirSession } from "@/lib/session";
import { FICHE_VISIBLE } from "@/lib/visibilite";

export const metadata: Metadata = {
  title: "Erasmus",
  description: "Les universités et les pays où sont partis les étudiants de la bi-licence Économie / Science politique de Montpellier.",
};

// Fonction définie ici : une fonction exportée d'un composant client ne peut pas être appelée par la page serveur.
const niveauxVides = (): Record<NiveauSejour, number> => ({ LICENCE: 0, MASTER: 0, AUCUN: 0 });

export default async function PageErasmus({ searchParams }: { searchParams: Promise<{ niveau?: string }> }) {
  await connection(); // lecture de la base à chaque visite
  const { niveau: niveauDemande } = await searchParams; // ?niveau=licence | master (lien partageable)
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

  // Chaque pays et chaque université garde le détail par niveau (licence, master, non précisé) :
  // le filtre Licence / Master de la page recalcule tout dans le navigateur à partir de ces chiffres.
  const parPays = new Map<string, DestinationPays>();
  for (const s of sejours) {
    const u = s.universite;
    const niveau: NiveauSejour = s.niveau ?? "AUCUN";
    const pays = parPays.get(u.pays) ?? { code: u.pays, nom: nomPays(u.pays), departs: 0, parNiveau: niveauxVides(), universites: [] };
    parPays.set(u.pays, pays);
    pays.departs++;
    pays.parNiveau[niveau]++;
    let univ = pays.universites.find((x) => x.id === u.id);
    if (!univ) {
      univ = { id: u.id, nom: u.nom, ville: u.ville, departs: 0, parNiveau: niveauxVides(), ...(membre ? { sejours: [] } : {}) };
      pays.universites.push(univ);
    }
    univ.departs++;
    univ.parNiveau[niveau]++;
    if (membre) {
      univ.sejours!.push({
        id: s.id,
        personneId: s.personne.id,
        nom: `${s.personne.prenom} ${s.personne.nom}`,
        niveau,
        details: [`Promo ${libellePromo(s.personne.promoEntree).replace("-", "–")}`, s.annee, s.duree && LIBELLES_DUREE_ERASMUS[s.duree]]
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

  return <VueErasmus destinations={destinations} membre={membre} niveauInitial={niveauDemande === "licence" || niveauDemande === "master" ? niveauDemande : "tous"} />;
}
