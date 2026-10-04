import { Check, ExternalLink, Mail, Plus } from "lucide-react";
import Link from "next/link";
import { publierOffre, refuserOffre, supprimerOffre } from "@/actions/offres";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { BlocDate, EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien, classeLisere } from "@/components/ui";
import type { Offre } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { LIBELLES_TYPE_OFFRE, dateCourte } from "@/lib/format";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Offres" };

type OffreAvecAuteur = Offre & { deposePar: { name: string } | null };

const classeDiscret = "text-sm text-ink-soft underline underline-offset-4 hover:text-bordeaux-700";

function DetailOffre({ o }: { o: OffreAvecAuteur }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="flex flex-wrap items-center gap-2">
        <Pastille>{LIBELLES_TYPE_OFFRE[o.type]}</Pastille>
        <span className="font-semibold">{o.titre}</span>
      </p>
      <p className="mt-0.5 text-sm text-ink-soft">{[o.organisation, o.lieu].filter(Boolean).join(" · ")}</p>
      <p className="text-xs text-ink-soft">
        Proposée par {o.deposePar?.name ?? "un compte supprimé"} le {dateCourte(o.creeLe)}
      </p>
    </div>
  );
}

export default async function AdminOffres() {
  await exigerBureau();
  const offres = await prisma.offre.findMany({
    include: { deposePar: { select: { name: true } } },
    orderBy: { creeLe: "desc" },
  });
  const enAttente = offres.filter((o) => o.statut === "EN_ATTENTE");
  const publiees = offres.filter((o) => o.statut === "PUBLIEE");
  const refusees = offres.filter((o) => o.statut === "REFUSEE");

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Offres"
        phrase="Relisez les offres proposées par les membres : la publication prévient tout le réseau par e-mail."
        action={
          <Link href="/espace/offres/proposer" className={buttonClasses("primary")}>
            <Plus size={16} aria-hidden /> Publier une offre
          </Link>
        }
      />

      <Panneau titre="À relire" compte={enAttente.length} compteAccent corps={false}>
        {enAttente.length === 0 ? (
          <Vide>Aucune offre en attente.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {enAttente.map((o) => (
              <li key={o.id} className={`flex flex-wrap gap-4 px-5 py-5 sm:px-6 ${classeLisere}`}>
                <BlocDate date={o.dateLimite} surtitre={o.dateLimite ? "avant le" : undefined} />
                <div className="min-w-0 flex-1">
                  <DetailOffre o={o} />
                  <p className="mt-3 max-w-[75ch] whitespace-pre-line text-sm">{o.description}</p>
                  {(o.lien || o.contact) && (
                    <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      {o.lien && (
                        <a href={o.lien} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${classeLien}`}>
                          <ExternalLink size={14} aria-hidden /> Annonce d’origine
                        </a>
                      )}
                      {o.contact && (
                        <span className="inline-flex items-center gap-1 text-ink-soft">
                          <Mail size={14} aria-hidden /> {o.contact}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <form action={publierOffre}>
                      <input type="hidden" name="id" value={o.id} />
                      <button type="submit" className={buttonClasses("primary", "petit")}>
                        <Check size={14} aria-hidden /> Publier et prévenir les membres
                      </button>
                    </form>
                    <form action={refuserOffre}>
                      <input type="hidden" name="id" value={o.id} />
                      <button type="submit" className={classeDiscret}>
                        Refuser
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Publiées" compte={publiees.length} corps={false}>
        {publiees.length === 0 ? (
          <Vide>Aucune offre publiée.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {publiees.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
                <BlocDate date={o.dateLimite} surtitre={o.dateLimite ? "avant le" : undefined} />
                <DetailOffre o={o} />
                <div className="flex items-center gap-4">
                  <form action={refuserOffre}>
                    <input type="hidden" name="id" value={o.id} />
                    <button type="submit" className={classeDiscret}>
                      Retirer
                    </button>
                  </form>
                  <BoutonSupprimer action={supprimerOffre} champs={{ id: o.id }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      {refusees.length > 0 && (
        <Panneau titre="Refusées ou retirées" compte={refusees.length} corps={false}>
          <ul className="divide-y divide-bordeaux-700/10">
            {refusees.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 opacity-90 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
                <DetailOffre o={o} />
                <div className="flex items-center gap-4">
                  <form action={publierOffre}>
                    <input type="hidden" name="id" value={o.id} />
                    <button type="submit" className={classeDiscret}>
                      Publier
                    </button>
                  </form>
                  <BoutonSupprimer action={supprimerOffre} champs={{ id: o.id }} />
                </div>
              </li>
            ))}
          </ul>
        </Panneau>
      )}
    </div>
  );
}
