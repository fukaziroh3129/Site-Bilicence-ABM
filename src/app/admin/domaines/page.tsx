import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { creerDomaine, enregistrerDomaine, fusionnerDomaine, supprimerDomaine } from "@/actions/domaines";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien, classeLisere, classeSaisie } from "@/components/ui";
import { prisma } from "@/lib/db";
import { GROUPES_DOMAINES } from "@/lib/domaines";
import { dateCourte } from "@/lib/format";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Domaines" };

const saisie = `${classeSaisie} mt-1 text-sm`;

export default async function AdminDomaines() {
  await exigerBureau();
  const [domaines, personnes, experiences] = await Promise.all([
    prisma.domaine.findMany({ include: { ajoutePar: { select: { prenom: true, nom: true } } }, orderBy: [{ ordre: "asc" }, { libelle: "asc" }] }),
    prisma.personne.findMany({ select: { id: true, prenom: true, nom: true, secteurs: true } }),
    prisma.experience.findMany({ select: { secteurs: true } }),
  ]);

  // Qui utilise chaque domaine (fiches) et combien d'expériences y sont rattachées.
  const utilisation = (code: string) => ({
    fiches: personnes.filter((p) => p.secteurs.includes(code)),
    experiences: experiences.filter((e) => e.secteurs.includes(code)).length,
  });
  const proposes = domaines.filter((d) => d.aControler);
  const controles = domaines.filter((d) => !d.aControler);

  /** Formulaires d'un domaine : renommer (ou marquer contrôlé), fusionner, supprimer. */
  function Edition({ d }: { d: (typeof domaines)[number] }) {
    const u = utilisation(d.code);
    const aValider = d.aControler;
    return (
      <div className="space-y-3">
        <form action={enregistrerDomaine} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="id" value={d.id} />
          <label className="text-sm font-semibold text-ink">
            Libellé complet
            <input name="libelle" defaultValue={d.libelle} required maxLength={80} className={saisie} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Libellé court (filtres, cartes)
            <input name="court" defaultValue={d.court} required maxLength={28} className={saisie} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Groupe
            <select name="groupe" defaultValue={d.groupe ?? ""} className={saisie}>
              <option value="">Autres domaines</option>
              {GROUPES_DOMAINES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClasses(aValider ? "primary" : "outline", "petit")}>
            {aValider ? "Marquer contrôlé" : "Renommer"}
          </button>
        </form>

        <p className="text-sm text-ink-soft">
          {u.fiches.length} fiche{u.fiches.length > 1 ? "s" : ""}
          {u.fiches.length > 0 && aValider && (
            <>
              {" "}(
              {u.fiches.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ", "}
                  <Link href={`/admin/personnes/${p.id}`} className={classeLien}>
                    {p.prenom} {p.nom}
                  </Link>
                </span>
              ))}
              )
            </>
          )}
          {" · "}
          {u.experiences} expérience{u.experiences > 1 ? "s" : ""}
          {aValider && (
            <>
              {" · "}ajouté {d.ajoutePar ? `par ${d.ajoutePar.prenom} ${d.ajoutePar.nom} ` : ""}le {dateCourte(d.creeLe)}
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <form action={fusionnerDomaine} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={d.id} />
            <label htmlFor={`cible-${d.id}`} className="text-sm text-ink-soft">
              Fusionner dans
            </label>
            <select id={`cible-${d.id}`} name="cible" required className={`${classeSaisie} w-auto max-w-full text-sm`} defaultValue="">
              <option value="" disabled>
                — Choisir un domaine —
              </option>
              {domaines
                .filter((v) => v.id !== d.id)
                .map((v) => (
                  <option key={v.id} value={v.code}>
                    {v.libelle}
                  </option>
                ))}
            </select>
            <button type="submit" className="text-sm font-semibold text-bordeaux-700 underline underline-offset-4 hover:text-bordeaux-500">
              Fusionner
            </button>
          </form>
          <span className="sm:ml-auto">
            <BoutonSupprimer
              action={supprimerDomaine}
              champs={{ id: d.id }}
              confirmation={`Supprimer « ${d.libelle} » ? Il sera retiré de ${u.fiches.length} fiche(s) et ${u.experiences} expérience(s).`}
            />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Domaines"
        phrase="Les domaines servent aux fiches, à l’archive des stages et aux filtres de « Que sont-ils devenus ? ». Un domaine ajouté par un membre est utilisable tout de suite et apparaît ici « à contrôler ». Pour un doublon (« Banque » et « Finance »), fusionnez-le dans le domaine existant : les fiches concernées sont mises à jour."
      />

      <Panneau titre="À contrôler" compte={proposes.length} compteAccent corps={false}>
        {proposes.length === 0 ? (
          <Vide>Aucun domaine à contrôler.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {proposes.map((d) => (
              <li key={d.id} className={`px-5 py-5 sm:px-6 ${classeLisere}`}>
                <Edition d={d} />
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Tous les domaines" compte={controles.length} action={<span className="text-sm text-ink-soft">Cliquez sur un domaine pour le modifier</span>} corps={false}>
        <ul className="divide-y divide-bordeaux-700/10">
          {controles.map((d) => {
            const u = utilisation(d.code);
            return (
              <li key={d.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 transition-colors hover:bg-bordeaux-100/25 sm:px-6 [&::-webkit-details-marker]:hidden">
                    <span className="font-semibold">{d.libelle}</span>
                    <Pastille>{d.court}</Pastille>
                    <span className="text-xs text-ink-soft">{d.groupe ?? "Autres domaines"}</span>
                    <span className="text-sm text-ink-soft">
                      {u.fiches.length} fiche{u.fiches.length > 1 ? "s" : ""} · {u.experiences} expérience{u.experiences > 1 ? "s" : ""}
                    </span>
                    <ChevronDown size={18} aria-hidden className="ml-auto text-ink-soft transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-bordeaux-700/10 bg-paper/60 px-5 py-4 sm:px-6">
                    <Edition d={d} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </Panneau>

      <Panneau titre="Ajouter un domaine" icone={<Plus size={18} aria-hidden />}>
        <form action={creerDomaine} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-semibold text-ink">
            Libellé complet
            <input name="libelle" required maxLength={80} placeholder="Ex. Santé / social" className={saisie} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Libellé court
            <input name="court" required maxLength={28} placeholder="Ex. Santé" className={saisie} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Groupe
            <select name="groupe" defaultValue={""} className={saisie}>
              <option value="">Autres domaines</option>
              {GROUPES_DOMAINES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClasses("primary", "petit")}>
            Ajouter
          </button>
        </form>
      </Panneau>
    </div>
  );
}
