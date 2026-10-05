import { IdCard } from "lucide-react";
import { redirect } from "next/navigation";
import { creerMaFiche } from "@/actions/fiche";
import { AssistantFiche } from "@/components/fiche/assistant-fiche";
import { NotesBureau } from "@/components/fiche/notes-bureau";
import { buttonClasses } from "@/components/ui";
import { ETAPES_FICHE, completude, estEtapeFiche } from "@/lib/completude";
import { prisma } from "@/lib/db";
import { dictionnaireDomaines } from "@/lib/domaines";
import { SELECTION_CARTE, versCarteParcours } from "@/lib/parcours";
import { estPersonnel } from "@/lib/profils";
import { exigerCompte } from "@/lib/session";

export const metadata = { title: "Ma fiche" };

export default async function MaFiche({ searchParams }: PageProps<"/espace/ma-fiche">) {
  // Ouverte aussi aux comptes en attente : leur fiche reste cachée jusqu'à la validation.
  const { user } = await exigerCompte();
  // Le personnel de l'université n'a pas de fiche.
  if (estPersonnel(user)) redirect("/espace");
  const p = await searchParams;

  const [personne, pourCarte, domaines] = user.personneId
    ? await Promise.all([
        prisma.personne.findUnique({
          where: { id: user.personneId },
          include: {
            formations: { orderBy: [{ anneeDebut: "desc" }, { creeLe: "desc" }] },
            experiences: { orderBy: [{ debut: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }] },
            erasmus: { include: { universite: true }, orderBy: [{ annee: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }] },
            notes: { orderBy: { creeLe: "desc" }, take: 20 },
          },
        }),
        prisma.personne.findUnique({ where: { id: user.personneId }, select: SELECTION_CARTE }),
        dictionnaireDomaines(),
      ])
    : [null, null, null];

  if (!personne || !pourCarte || !domaines) {
    return (
      <div className="mx-auto max-w-2xl rounded-abm-lg border border-bordeaux-700/15 bg-white p-8 text-center shadow-abm-card">
        <IdCard size={32} aria-hidden className="mx-auto text-bordeaux-700" />
        <h1 className="mt-4 font-display text-3xl font-bold text-bordeaux-700">Ma fiche</h1>
        <p className="mx-auto mt-3 max-w-[48ch] text-ink-soft">
          Votre fiche raconte votre parcours après la bi-licence : situation, études, stages, Erasmus. Six étapes courtes, à
          remplir à votre rythme.
        </p>
        <form action={creerMaFiche} className="mt-6">
          <button type="submit" className={buttonClasses("primary")}>
            Commencer ma fiche
          </button>
        </form>
      </div>
    );
  }

  // Sans étape demandée : la première où il reste quelque chose à remplir.
  const avancement = completude({ ...personne, nbFormations: personne.formations.length, nbExperiences: personne.experiences.length });
  const etape = estEtapeFiche(p.etape)
    ? p.etape
    : (ETAPES_FICHE.find((e) => avancement.etapesIncompletes.has(e.cle))?.cle ?? "identite");

  return (
    <div className="space-y-8">
      {p.bienvenue === "1" && (
        <p role="status" className="rounded-abm-md border border-bordeaux-700/20 bg-white px-5 py-4 text-sm text-ink">
          <b className="text-bordeaux-700">Votre compte est activé, bienvenue !</b> Le bureau a préparé votre fiche : vérifiez
          les informations ci-dessous et complétez-les à votre rythme.
        </p>
      )}
      <NotesBureau notes={personne.notes} />
      <AssistantFiche
        personne={personne}
        etape={etape}
        enregistre={estEtapeFiche(p.enregistre) ? p.enregistre : null}
        carte={versCarteParcours(pourCarte)}
        courts={Object.fromEntries(domaines.domaines.map((d) => [d.code, d.court]))}
      />
    </div>
  );
}
