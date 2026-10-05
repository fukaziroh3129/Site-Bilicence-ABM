import { Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supprimerPostSocial } from "@/actions/admin";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { IconeInstagram, IconeLinkedin } from "@/components/icones-sociales";
import { EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Réseaux sociaux" };

export default async function AdminReseaux() {
  await exigerBureau();
  const posts = await prisma.postSocial.findMany({ orderBy: { publieLe: "desc" } });

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Réseaux sociaux"
        phrase="Les trois derniers posts publiés s’affichent sur l’accueil, dans la section « Suivez-nous »."
        action={
          <Link href="/admin/reseaux/nouveau" className={buttonClasses("primary")}>
            <Plus size={16} aria-hidden /> Ajouter un post
          </Link>
        }
      />
      <Panneau titre="Posts" compte={posts.length} corps={false}>
        {posts.length === 0 ? (
          <Vide>Aucun post. Ajoutez le lien d’un post Instagram ou LinkedIn et son visuel pour l’afficher sur l’accueil.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {posts.map((p) => {
              const Icone = p.reseau === "INSTAGRAM" ? IconeInstagram : IconeLinkedin;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
                  {p.image ? (
                    <Image src={p.image} alt="" width={64} height={64} unoptimized className="size-16 shrink-0 object-cover shadow-abm-card" />
                  ) : (
                    <span className="flex size-16 shrink-0 items-center justify-center border border-dashed border-bordeaux-300 text-center text-[11px] leading-tight text-ink-soft">
                      Visuel à ajouter
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      <Icone size={16} className="shrink-0 text-bordeaux-700" />
                      <span className="truncate">{p.legende}</span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                      {p.reseau === "INSTAGRAM" ? "Instagram" : "LinkedIn"} ·{" "}
                      {p.publieLe.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      {p.publie ? <Pastille accent>Publié</Pastille> : <Pastille>Brouillon</Pastille>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/admin/reseaux/${p.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
                      <Pencil size={14} aria-hidden /> Modifier
                    </Link>
                    <BoutonSupprimer action={supprimerPostSocial} champs={{ id: p.id }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panneau>
    </div>
  );
}
