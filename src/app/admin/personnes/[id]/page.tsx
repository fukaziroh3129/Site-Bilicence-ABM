import { Eye, History, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supprimerPersonne } from "@/actions/admin";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { EditeurFiche } from "@/components/fiche/editeur-fiche";
import { VueFiche } from "@/components/fiche/vue-fiche";
import { FilAriane, Initiales, Panneau, Vide, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { dateCourte, libellePromo } from "@/lib/format";
import { LIBELLES_ROLE, LIBELLES_STATUT_COMPTE, estAdministrateur, type Role } from "@/lib/roles";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Fiche" };

export default async function AdminPersonne({ params }: PageProps<"/admin/personnes/[id]">) {
  const { user } = await exigerBureau();
  const admin = estAdministrateur(user.role);
  const { id } = await params;

  const personne = await prisma.personne.findUnique({
    where: { id },
    include: {
      compte: { select: { id: true, email: true, statut: true, role: true } },
      formations: { orderBy: [{ anneeDebut: "desc" }, { creeLe: "desc" }] },
      experiences: { orderBy: [{ debut: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }] },
      erasmus: { include: { universite: true }, orderBy: [{ annee: { sort: "desc", nulls: "last" } }, { creeLe: "desc" }] },
      notes: { orderBy: { creeLe: "desc" } },
    },
  });
  if (!personne) notFound();

  // Modifier la fiche d'un membre (qui a un compte, autre que soi) : motif obligatoire, transmis à la personne.
  const demanderMotif = Boolean(personne.compte) && user.personneId !== personne.id;
  const infoCompte = (
    <>
      {personne.compte
        ? `Compte : ${personne.compte.email} (${LIBELLES_STATUT_COMPTE[personne.compte.statut].toLowerCase()}, ${LIBELLES_ROLE[personne.compte.role as Role].toLowerCase()})`
        : "Pas de compte : fiche gérée par le bureau."}
      {personne.consentementPublicLe && ` · Accord pour l’affichage public donné le ${dateCourte(personne.consentementPublicLe)}`}
    </>
  );

  const barre = (
    <div className="-mt-4 flex flex-wrap items-center justify-between gap-3">
      <FilAriane retour={{ href: "/admin/personnes", libelle: "Fiches" }} ici={`${personne.prenom} ${personne.nom}`} />
      <Link href={`/espace/annuaire/${personne.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
        <Eye size={16} aria-hidden /> Voir dans l’annuaire
      </Link>
    </div>
  );

  if (!admin) {
    return (
      <div className="space-y-6">
        {barre}
        <p className="rounded-abm-md border border-bordeaux-700/15 bg-white px-4 py-3 text-sm text-ink-soft shadow-abm-card">
          Consultation seule : la modification des fiches est réservée aux administrateurs. {infoCompte}
        </p>
        <VueFiche personne={personne} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {barre}

      <header className="flex flex-wrap items-center gap-5 rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-6">
        <Initiales prenom={personne.prenom} nom={personne.nom} taille="bandeau" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-bordeaux-500">Promotion {libellePromo(personne.promoEntree)}</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-bordeaux-700">
            {personne.prenom} {personne.nom}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">{infoCompte}</p>
        </div>
      </header>

      {demanderMotif && (
        <p className={`rounded-abm-md border border-bordeaux-700/20 bg-bordeaux-100 px-4 py-3 text-sm text-bordeaux-800`}>
          Cette fiche appartient à un membre : chaque modification demande un motif, qu’il verra sur sa fiche.
        </p>
      )}
      <div className="rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-8">
        <EditeurFiche personne={personne} pourAutrui demanderMotif={demanderMotif} />
      </div>

      <Panneau titre="Historique des modifications par le bureau" icone={<History size={18} aria-hidden />} compte={personne.notes.length} corps={false}>
        {personne.notes.length === 0 ? (
          <Vide>Aucune modification par le bureau.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10 text-sm">
            {personne.notes.map((n) => (
              <li key={n.id} className="px-5 py-3.5 sm:px-6">
                <p className="font-semibold text-ink">{n.objet}</p>
                <p className="mt-1 whitespace-pre-line text-ink">{n.motif}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {n.auteurNom}, le {dateCourte(n.creeLe)} · {n.lueLe ? `lu le ${dateCourte(n.lueLe)}` : "pas encore lu"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Supprimer la fiche" icone={<Trash2 size={18} aria-hidden />} sensible>
        <p className="mb-4 text-sm text-ink-soft">
          Efface la fiche, ses formations et ses expériences. Le compte éventuel est conservé mais n’a plus de fiche.
        </p>
        <BoutonSupprimer
          action={supprimerPersonne}
          champs={{ id: personne.id }}
          libelle="Supprimer définitivement cette fiche"
          confirmation={`Supprimer définitivement la fiche de ${personne.prenom} ${personne.nom} ?`}
        />
      </Panneau>
    </div>
  );
}
