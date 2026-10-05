// Section « Suivez-nous » de l'accueil : boutons vers les profils Instagram et LinkedIn de l'association,
// puis les derniers posts choisis par le bureau (admin « Réseaux »). Aucun contenu n'est chargé depuis
// les réseaux : pas de cookie tiers, les visuels sont des fichiers téléversés par le bureau.

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Apparition, CarteProjecteur, ElementGroupe, Groupe } from "@/components/anime";
import { IconeInstagram, IconeLinkedin, reseauxDeLAssociation } from "@/components/icones-sociales";
import { ImageAFaire, buttonClasses } from "@/components/ui";
import type { PostSocial } from "@/generated/prisma/client";

export function SectionReseaux({ posts }: { posts: PostSocial[] }) {
  const reseaux = reseauxDeLAssociation();
  if (reseaux.length === 0 && posts.length === 0) return null;

  return (
    <section className="fond-papier">
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-20">
        <Apparition className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl font-bold text-bordeaux-700">Suivez-nous</h2>
            <p className="mt-3 max-w-[48ch] text-ink-soft">L’actualité de l’association passe d’abord par nos réseaux.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {reseaux.map(({ cle, nom, lien, Icone }, i) => (
              <a
                key={cle}
                href={lien}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses(i === 0 ? "primary" : "outline")}
              >
                <Icone size={16} />
                {nom}
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            ))}
          </div>
        </Apparition>

        {posts.length > 0 && (
          <Groupe as="div" className="mt-10 grid gap-4 md:grid-cols-3">
            {posts.map((p) => {
              const Icone = p.reseau === "INSTAGRAM" ? IconeInstagram : IconeLinkedin;
              const nom = p.reseau === "INSTAGRAM" ? "Instagram" : "LinkedIn";
              return (
                <ElementGroupe key={p.id} as="div">
                  <CarteProjecteur className="carte-premium h-full overflow-hidden rounded-abm-lg border border-bordeaux-700/20 bg-white">
                    <a
                      href={p.lien}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-full flex-col"
                      aria-label={`${p.legende} — voir le post sur ${nom} (nouvel onglet)`}
                    >
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt=""
                          width={600}
                          height={450}
                          unoptimized
                          className="aspect-[4/3] w-full border-b border-bordeaux-700/10 object-cover"
                        />
                      ) : (
                        <ImageAFaire label="Visuel à ajouter" ratio="4 / 3" />
                      )}
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bordeaux-700">
                          <Icone size={15} />
                          {nom}
                        </span>
                        <p className="flex-1 text-ink">{p.legende}</p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-bordeaux-700">
                          Voir le post <ArrowUpRight size={16} className="fleche" aria-hidden />
                        </span>
                      </div>
                    </a>
                  </CarteProjecteur>
                </ElementGroupe>
              );
            })}
          </Groupe>
        )}
      </div>
    </section>
  );
}
