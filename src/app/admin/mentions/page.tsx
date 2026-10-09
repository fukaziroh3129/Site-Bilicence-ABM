import { EnTeteConsole } from "@/components/ui";
import { prisma } from "@/lib/db";
import { libellePromo } from "@/lib/format";
import { FORMATION_A_CLASSER } from "@/lib/liste-mentions";
import { estBiLicence } from "@/lib/mentions";
import { exigerBureau } from "@/lib/session";
import { GestionMentions } from "./gestion-mentions";

export const metadata = { title: "Mentions de master" };

export default async function AdminMentions() {
  await exigerBureau();
  const [familles, aClasser] = await Promise.all([
    prisma.familleMention.findMany({
      orderBy: [{ ordre: "asc" }, { libelle: "asc" }],
      include: { mentions: { orderBy: { libelle: "asc" }, include: { _count: { select: { formations: true } } } } },
    }),
    prisma.formation.findMany({
      where: FORMATION_A_CLASSER,
      select: {
        id: true,
        intitule: true,
        parcours: true,
        etablissement: true,
        mentionId: true,
        mentionAControler: true,
        personne: { select: { id: true, prenom: true, nom: true, promoEntree: true } },
      },
      orderBy: { creeLe: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Mentions de master"
        phrase={
          <>
            Les formations des anciens sont rangées en <b className="text-ink">grands domaines d’études</b> (ex. « Économie »), qui
            regroupent des <b className="text-ink">mentions</b> (ex. « Économie appliquée »). La mention est reconnue
            automatiquement à partir de l’intitulé saisi ; ce qui n’est pas reconnu arrive ici. Tout changement est repris
            aussitôt dans les statistiques, les filtres et les fiches.
          </>
        }
      />
      <GestionMentions
        familles={familles.map((f) => ({
          id: f.id,
          libelle: f.libelle,
          mentions: f.mentions.map((m) => ({ id: m.id, libelle: m.libelle, variantes: m.variantes, familleId: f.id, nbFormations: m._count.formations })),
        }))}
        aClasser={aClasser
          .filter((f) => !estBiLicence(f.intitule, f.etablissement))
          .map((f) => ({
            id: f.id,
            intitule: f.intitule,
            parcours: f.parcours,
            etablissement: f.etablissement,
            mentionId: f.mentionId,
            choisieParMembre: f.mentionAControler && !!f.mentionId,
            personne: { id: f.personne.id, nom: `${f.personne.prenom} ${f.personne.nom}`, promo: libellePromo(f.personne.promoEntree) },
          }))}
      />
    </div>
  );
}
