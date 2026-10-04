import { Eye, Newspaper, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supprimerArticle } from "@/actions/admin";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import type { Article } from "@/generated/prisma/client";
import { EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_CATEGORIE_ARTICLE, dateCourte } from "@/lib/format";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Actualités" };

function Ligne({ a }: { a: Article }) {
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
      {a.image ? (
        <Image src={a.image} alt="" width={96} height={60} unoptimized className="h-[52px] w-[84px] shrink-0 rounded-abm-sm object-cover" />
      ) : (
        <span aria-hidden className="fond-bordeaux grid h-[52px] w-[84px] shrink-0 place-items-center rounded-abm-sm">
          <Newspaper size={18} className="opacity-70" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {a.titre}
          {a.aLaUne && <Pastille accent>À la une</Pastille>}
        </p>
        <p className="text-sm text-ink-soft">
          {LIBELLES_CATEGORIE_ARTICLE[a.categorie]}
          {a.publieLe && ` · publié le ${dateCourte(a.publieLe)}`}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {a.publie && (
          <Link href={`/actualites/${a.slug}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
            <Eye size={14} aria-hidden /> Voir
          </Link>
        )}
        <Link href={`/admin/actualites/${a.id}`} className={`inline-flex items-center gap-1 text-sm ${classeLien}`}>
          <Pencil size={14} aria-hidden /> Modifier
        </Link>
        <BoutonSupprimer action={supprimerArticle} champs={{ id: a.id }} />
      </div>
    </li>
  );
}

export default async function AdminActualites() {
  await exigerBureau();
  const articles = await prisma.article.findMany({ orderBy: [{ publie: "asc" }, { publieLe: "desc" }, { creeLe: "desc" }] });
  const brouillons = articles.filter((a) => !a.publie);
  const publies = articles.filter((a) => a.publie);

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Actualités"
        phrase="Portraits, vie de la licence et de l’association. Un brouillon reste invisible tant qu’il n’est pas publié."
        action={
          <Link href="/admin/actualites/nouveau" className={buttonClasses("primary")}>
            <Plus size={16} aria-hidden /> Nouvel article
          </Link>
        }
      />
      {brouillons.length > 0 && (
        <Panneau titre="Brouillons" compte={brouillons.length} compteAccent corps={false}>
          <ul className="divide-y divide-bordeaux-700/10">
            {brouillons.map((a) => (
              <Ligne key={a.id} a={a} />
            ))}
          </ul>
        </Panneau>
      )}
      <Panneau titre="Publiés" compte={publies.length} corps={false}>
        {publies.length === 0 ? (
          <Vide>Aucun article publié.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {publies.map((a) => (
              <Ligne key={a.id} a={a} />
            ))}
          </ul>
        )}
      </Panneau>
    </div>
  );
}
