import { MapPin, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { supprimerEvenement } from "@/actions/admin";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import type { Evenement } from "@/generated/prisma/client";
import { BlocDate, EnTeteConsole, Panneau, Vide, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { heure } from "@/lib/format";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Événements" };

function Ligne({ e }: { e: Evenement }) {
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
      <BlocDate date={e.debut} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{e.titre}</p>
        <p className="flex flex-wrap gap-x-3 text-sm text-ink-soft">
          <span>{heure(e.debut)}</span>
          {e.lieu && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} aria-hidden /> {e.lieu}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Link href={`/admin/evenements/${e.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
          <Pencil size={14} aria-hidden /> Modifier
        </Link>
        <BoutonSupprimer action={supprimerEvenement} champs={{ id: e.id }} />
      </div>
    </li>
  );
}

export default async function AdminEvenements() {
  await exigerBureau();
  const evenements = await prisma.evenement.findMany({ orderBy: { debut: "desc" } });
  const maintenant = new Date();
  const aVenir = evenements.filter((e) => e.debut >= maintenant).reverse();
  const passes = evenements.filter((e) => e.debut < maintenant);

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Événements"
        phrase="Les rendez-vous affichés dans l’espace membres, avec compte à rebours pour le prochain."
        action={
          <Link href="/admin/evenements/nouveau" className={buttonClasses("primary")}>
            <Plus size={16} aria-hidden /> Nouvel événement
          </Link>
        }
      />
      <Panneau titre="À venir" compte={aVenir.length} corps={false}>
        {aVenir.length === 0 ? (
          <Vide>Aucun événement à venir.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {aVenir.map((e) => (
              <Ligne key={e.id} e={e} />
            ))}
          </ul>
        )}
      </Panneau>
      {passes.length > 0 && (
        <Panneau titre="Passés" compte={passes.length} corps={false}>
          <ul className="divide-y divide-bordeaux-700/10">
            {passes.map((e) => (
              <Ligne key={e.id} e={e} />
            ))}
          </ul>
        </Panneau>
      )}
    </div>
  );
}
