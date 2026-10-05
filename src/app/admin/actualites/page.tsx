import { Eye, MapPin, Newspaper, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supprimerArticle } from "@/actions/admin";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import type { Article } from "@/generated/prisma/client";
import { BlocDate, EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_CATEGORIE_ARTICLE, dateCourte, heure } from "@/lib/format";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Publications" };

// Une seule liste pour les actualités et les événements (même table, même formulaire).

const FILTRES = [
  { valeur: null, libelle: "Tout" },
  { valeur: "actualites", libelle: "Actualités" },
  { valeur: "evenements", libelle: "Événements" },
] as const;

function Ligne({ a }: { a: Article }) {
  const evenement = a.type === "EVENEMENT";
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
      {evenement ? (
        <BlocDate date={a.debut} />
      ) : a.image ? (
        <Image src={a.image} alt="" width={96} height={60} unoptimized className="h-[52px] w-[84px] shrink-0 rounded-abm-sm object-cover" />
      ) : (
        <span aria-hidden className="fond-bordeaux grid h-[52px] w-[84px] shrink-0 place-items-center rounded-abm-sm">
          <Newspaper size={18} className="opacity-70" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {a.titre}
          <Pastille>{evenement ? "Événement" : "Actualité"}</Pastille>
          {a.aLaUne && <Pastille accent>À la une</Pastille>}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-soft">
          {evenement && a.debut ? (
            <>
              <span>{heure(a.debut)}</span>
              {a.lieu && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} aria-hidden /> {a.lieu}
                </span>
              )}
            </>
          ) : (
            <span>
              {LIBELLES_CATEGORIE_ARTICLE[a.categorie]}
              {a.publieLe && ` · publié le ${dateCourte(a.publieLe)}`}
            </span>
          )}
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

function Liste({ articles, vide }: { articles: Article[]; vide: string }) {
  if (articles.length === 0) return <Vide>{vide}</Vide>;
  return (
    <ul className="divide-y divide-bordeaux-700/10">
      {articles.map((a) => (
        <Ligne key={a.id} a={a} />
      ))}
    </ul>
  );
}

/** Date qui situe une publication : celle de l'événement, sinon celle de publication. */
function dateDe(a: Article) {
  return (a.type === "EVENEMENT" ? a.debut : null) ?? a.publieLe ?? a.creeLe;
}

export default async function AdminActualites({ searchParams }: PageProps<"/admin/actualites">) {
  await exigerBureau();
  const p = await searchParams;
  const filtre = p.type === "actualites" || p.type === "evenements" ? p.type : null;
  const maintenant = new Date();

  const articles = await prisma.article.findMany({
    where: filtre ? { type: filtre === "evenements" ? "EVENEMENT" : "ACTUALITE" } : {},
    orderBy: { creeLe: "desc" },
  });
  const brouillons = articles.filter((a) => !a.publie);
  const publies = articles.filter((a) => a.publie);
  // Événements publiés à venir : du plus proche au plus lointain, à part pour les repérer d'un coup d'œil.
  const aVenir = publies.filter((a) => a.type === "EVENEMENT" && a.debut && a.debut >= maintenant).sort((a, b) => a.debut!.getTime() - b.debut!.getTime());
  const autres = publies.filter((a) => !aVenir.includes(a)).sort((a, b) => dateDe(b).getTime() - dateDe(a).getTime());

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Publications"
        phrase="Actualités et événements, publiés sur la même page publique. Un brouillon reste invisible tant qu’il n’est pas publié."
        action={
          <Link href={filtre === "evenements" ? "/admin/actualites/nouveau?type=evenement" : "/admin/actualites/nouveau"} className={buttonClasses("primary")}>
            <Plus size={16} aria-hidden /> Nouvelle publication
          </Link>
        }
      />
      <nav aria-label="Filtrer les publications" className="flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <Link
            key={f.libelle}
            href={f.valeur ? `/admin/actualites?type=${f.valeur}` : "/admin/actualites"}
            aria-current={f.valeur === filtre ? "page" : undefined}
            className="rounded-abm-pill border border-bordeaux-700/30 px-3 py-1 text-sm font-semibold text-bordeaux-700 hover:bg-bordeaux-100 aria-[current=page]:border-bordeaux-700 aria-[current=page]:bg-bordeaux-700 aria-[current=page]:text-white"
          >
            {f.libelle}
          </Link>
        ))}
      </nav>
      {brouillons.length > 0 && (
        <Panneau titre="Brouillons" compte={brouillons.length} compteAccent corps={false}>
          <Liste articles={brouillons} vide="" />
        </Panneau>
      )}
      {aVenir.length > 0 && (
        <Panneau titre="Événements à venir" compte={aVenir.length} corps={false}>
          <Liste articles={aVenir} vide="" />
        </Panneau>
      )}
      <Panneau titre={aVenir.length > 0 ? "Autres publications" : "Publiées"} compte={autres.length} corps={false}>
        <Liste articles={autres} vide="Aucune publication." />
      </Panneau>
    </div>
  );
}
