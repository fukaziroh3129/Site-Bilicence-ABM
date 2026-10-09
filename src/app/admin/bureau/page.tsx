import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supprimerMembreBureau } from "@/actions/admin";
import { deplacerFonction, supprimerFonction } from "@/actions/fonctions";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { EnTeteConsole, Initiales, Panneau, Pastille, Vide, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { trierFonctions } from "@/lib/fonctions-bureau";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Bureau" };

const VUES = [
  { cle: "membres", libelle: "Membres" },
  { cle: "etiquettes", libelle: "Fonctions et pôles" },
] as const;

export default async function AdminBureau({ searchParams }: PageProps<"/admin/bureau">) {
  await exigerBureau();
  const { vue: vueBrute } = await searchParams;
  const vue = vueBrute === "etiquettes" ? "etiquettes" : "membres";

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Composition du bureau"
        phrase="Affichée sur la page publique « Le bureau » : les fonctions du bureau en haut, puis les pôles."
        action={
          vue === "membres" ? (
            <Link href="/admin/bureau/nouveau" className={buttonClasses("primary")}>
              <Plus size={16} aria-hidden /> Ajouter un membre
            </Link>
          ) : (
            <Link href="/admin/bureau/etiquette/nouveau" className={buttonClasses("primary")}>
              <Plus size={16} aria-hidden /> Ajouter une fonction ou un pôle
            </Link>
          )
        }
      />

      <nav aria-label="Sections du bureau" className="-mt-4 flex gap-1 border-b border-bordeaux-700/15">
        {VUES.map((v) => (
          <Link
            key={v.cle}
            href={v.cle === "membres" ? "/admin/bureau" : `/admin/bureau?vue=${v.cle}`}
            aria-current={v.cle === vue ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              v.cle === vue ? "border-bordeaux-700 text-bordeaux-700" : "border-transparent text-ink-soft hover:text-bordeaux-700"
            }`}
          >
            {v.libelle}
          </Link>
        ))}
      </nav>

      {vue === "membres" ? <OngletMembres /> : <OngletEtiquettes />}
    </div>
  );
}

async function OngletMembres() {
  const membres = await prisma.membreBureau.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    include: { fonctions: true },
  });

  return (
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
                  {m.role && <span className="font-normal text-ink-soft"> · {m.role}</span>}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                  {trierFonctions(m.fonctions).map((f) => (
                    <Pastille key={f.id} accent={f.niveau === "BUREAU"}>
                      {f.niveau === "POLE" ? `Pôle ${f.nom}` : f.nom}
                    </Pastille>
                  ))}
                  {m.fonctions.length === 0 && <Pastille>Sans étiquette : non affiché</Pastille>}
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
  );
}

async function OngletEtiquettes() {
  const fonctions = trierFonctions(await prisma.fonction.findMany({ include: { _count: { select: { membres: true } } } }));
  const groupes = [
    { niveau: "BUREAU" as const, titre: "Fonctions du bureau", vide: "Aucune fonction du bureau. Ex. Présidence, Trésorerie, Secrétariat." },
    { niveau: "POLE" as const, titre: "Pôles", vide: "Aucun pôle. Les pôles s’affichent en grand sous le bureau." },
  ];

  return (
    <div className="space-y-8">
      <p className="max-w-[75ch] text-sm text-ink-soft">
        Une étiquette se donne à une ou plusieurs personnes, depuis la fiche de chaque membre. Les flèches changent l’ordre
        d’affichage : le plus haut est affiché en premier sur la page publique.
      </p>
      {groupes.map((g) => {
        const liste = fonctions.filter((f) => f.niveau === g.niveau);
        return (
          <Panneau key={g.niveau} titre={g.titre} compte={liste.length} corps={false}>
            {liste.length === 0 ? (
              <Vide>{g.vide}</Vide>
            ) : (
              <ul className="divide-y divide-bordeaux-700/10">
                {liste.map((f, i) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-4 px-5 py-3 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
                    <div className="flex gap-1">
                      <BoutonDeplacer id={f.id} sens="haut" desactive={i === 0} />
                      <BoutonDeplacer id={f.id} sens="bas" desactive={i === liste.length - 1} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{f.nom}</p>
                      <p className="text-sm text-ink-soft">
                        {f._count.membres === 0 ? "Personne pour l’instant" : `${f._count.membres} ${f._count.membres > 1 ? "personnes" : "personne"}`}
                        {f.description && ` · ${f.description}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href={`/admin/bureau/etiquette/${f.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
                        <Pencil size={14} aria-hidden /> Modifier
                      </Link>
                      <BoutonSupprimer
                        action={supprimerFonction}
                        champs={{ id: f.id }}
                        confirmation={`Supprimer « ${f.nom} » ? Les personnes concernées restent dans le bureau, mais n’ont plus cette étiquette.`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>
        );
      })}
    </div>
  );
}

function BoutonDeplacer({ id, sens, desactive }: { id: string; sens: "haut" | "bas"; desactive: boolean }) {
  const Fleche = sens === "haut" ? ArrowUp : ArrowDown;
  return (
    <form action={deplacerFonction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="sens" value={sens} />
      <button
        type="submit"
        disabled={desactive}
        aria-label={sens === "haut" ? "Monter" : "Descendre"}
        className="grid size-9 place-items-center rounded-abm-sm border border-bordeaux-700/25 text-bordeaux-700 transition-colors hover:bg-bordeaux-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Fleche size={16} aria-hidden />
      </button>
    </form>
  );
}
