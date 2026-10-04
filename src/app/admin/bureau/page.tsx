import { Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supprimerMembreBureau } from "@/actions/admin";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { EnTeteConsole, Initiales, Panneau, Pastille, Vide, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { exigerBureau } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata = { title: "Bureau" };

function nomPole(code: string | null) {
  const pole = site.poles.find((p) => p.code === code);
  return pole ? `Pôle ${pole.nom}` : "Bureau restreint";
}

export default async function AdminBureau() {
  await exigerBureau();
  const membres = await prisma.membreBureau.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }] });

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Composition du bureau"
        phrase="Affichée sur la page publique « Le bureau », dans l’ordre indiqué."
        action={
          <Link href="/admin/bureau/nouveau" className={buttonClasses("primary")}>
            <Plus size={16} aria-hidden /> Ajouter un membre
          </Link>
        }
      />
      <Panneau titre="Membres du bureau" compte={membres.length} corps={false}>
        {membres.length === 0 ? (
          <Vide>Aucun membre du bureau renseigné.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {membres.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-3 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
                <span className="w-7 text-right font-impact text-lg text-bordeaux-300 tabular-nums" title="Ordre d’affichage">
                  {m.ordre}
                </span>
                {m.photo ? (
                  <Image src={m.photo} alt="" width={52} height={52} unoptimized className="size-[52px] shrink-0 rounded-full object-cover shadow-abm-card" />
                ) : (
                  <Initiales prenom={m.prenom} nom={m.nom} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {m.prenom} {m.nom}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                    {m.role} · {nomPole(m.pole)}
                    {!m.photo && <Pastille>Photo à ajouter</Pastille>}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/admin/bureau/${m.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
                    <Pencil size={14} aria-hidden /> Modifier
                  </Link>
                  <BoutonSupprimer action={supprimerMembreBureau} champs={{ id: m.id }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </div>
  );
}
