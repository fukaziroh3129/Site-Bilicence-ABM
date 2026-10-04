import { ChevronDown, Plus, Upload } from "lucide-react";
import Link from "next/link";
import {
  creerEtablissement,
  enregistrerEtablissement,
  fusionnerEtablissement,
  supprimerEtablissement,
  toutMarquerControle,
} from "@/actions/etablissements";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { Filtres, parametre } from "@/components/filtres";
import { EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien, classeLisere } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_TYPE_ETABLISSEMENT, type TypeEtablissement } from "@/lib/etablissements";
import { correspond, dateCourte } from "@/lib/format";
import { libelleEtablissement, optionsPays } from "@/lib/liste-etablissements";
import { nomPays } from "@/lib/pays";
import { exigerBureau } from "@/lib/session";
import { ImportEtablissements } from "./import";

export const metadata = { title: "Établissements" };

const classeSaisie = "block rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-2 text-sm text-ink focus:border-bordeaux-700";
const optionsType = Object.entries(LIBELLES_TYPE_ETABLISSEMENT).map(([valeur, libelle]) => ({ valeur, libelle }));
/** Au-delà, la liste complète n'est affichée qu'après une recherche (page plus légère). */
const AFFICHAGE_MAX = 120;

function charger() {
  return prisma.etablissement.findMany({
    include: {
      ajoutePar: { select: { prenom: true, nom: true } },
      sejours: { select: { personne: { select: { id: true, prenom: true, nom: true } } } },
      formations: { select: { personne: { select: { id: true, prenom: true, nom: true } } } },
    },
    orderBy: [{ nom: "asc" }],
  });
}
type EtablissementComplet = Awaited<ReturnType<typeof charger>>[number];

export default async function AdminEtablissements({ searchParams }: PageProps<"/admin/etablissements">) {
  await exigerBureau();
  const p = await searchParams;
  const q = parametre(p.q);
  const type = parametre(p.type);
  const etablissements = await charger();
  const pays = optionsPays();

  const aControler = etablissements.filter((e) => e.aControler);
  const filtres = etablissements.filter((e) => (!type || e.type === type) && (!q || correspond(q, [e.nom, e.ville, nomPays(e.pays)])));
  const affiches = q || type ? filtres : filtres.slice(0, AFFICHAGE_MAX);

  function Fiche({ e }: { e: EtablissementComplet }) {
    const personnes = [...e.sejours, ...e.formations].map((x) => x.personne);
    const usages = e.sejours.length + e.formations.length;
    return (
      <div className="space-y-3">
        <form action={enregistrerEtablissement} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
          <input type="hidden" name="id" value={e.id} />
          <label className="text-sm font-semibold text-ink">
            Nom
            <input name="nom" defaultValue={e.nom} required maxLength={160} className={`mt-1 w-full ${classeSaisie}`} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Ville
            <input name="ville" defaultValue={e.ville ?? ""} maxLength={80} className={`mt-1 w-full ${classeSaisie}`} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Pays
            <input name="pays" list="liste-pays" defaultValue={nomPays(e.pays)} required autoComplete="off" className={`mt-1 w-full ${classeSaisie}`} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Type
            <select name="type" defaultValue={e.type} required className={`mt-1 w-full ${classeSaisie}`}>
              {optionsType.map((o) => (
                <option key={o.valeur} value={o.valeur}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClasses(e.aControler ? "primary" : "outline", "petit")}>
            {e.aControler ? "Marquer contrôlé" : "Corriger"}
          </button>
        </form>

        <p className="text-sm text-ink-soft">
          {e.sejours.length} séjour{e.sejours.length > 1 ? "s" : ""} Erasmus · {e.formations.length} formation{e.formations.length > 1 ? "s" : ""}
          {personnes.length > 0 && e.aControler && (
            <>
              {" "}(
              {personnes.map((pe, i) => (
                <span key={`${pe.id}-${i}`}>
                  {i > 0 && ", "}
                  <Link href={`/admin/personnes/${pe.id}`} className={classeLien}>
                    {pe.prenom} {pe.nom}
                  </Link>
                </span>
              ))}
              )
            </>
          )}
          {e.aControler && (
            <>
              {" · "}ajouté {e.ajoutePar ? `par ${e.ajoutePar.prenom} ${e.ajoutePar.nom} ` : ""}le {dateCourte(e.creeLe)}
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <form action={fusionnerEtablissement} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={e.id} />
            <label htmlFor={`cible-${e.id}`} className="text-sm text-ink-soft">
              Fusionner dans
            </label>
            <input
              id={`cible-${e.id}`}
              name="cible"
              list="tous-etablissements"
              required
              autoComplete="off"
              placeholder="Tapez le nom du bon établissement…"
              className={`w-72 max-w-full ${classeSaisie}`}
            />
            <button type="submit" className="text-sm font-semibold text-bordeaux-700 underline underline-offset-4 hover:text-bordeaux-500">
              Fusionner
            </button>
          </form>
          <span className="sm:ml-auto">
            {usages === 0 ? (
              <BoutonSupprimer action={supprimerEtablissement} champs={{ id: e.id }} confirmation={`Supprimer « ${e.nom} » ?`} />
            ) : (
              <span className="text-xs text-ink-soft">Utilisé par des fiches : fusionnez-le plutôt que de le supprimer.</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Établissements"
        phrase={
          <div className="space-y-2">
            <p>
              La liste commune des universités, IEP et écoles, utilisée à la fois pour les séjours Erasmus (carte publique) et
              pour les formations des fiches (statistiques « Que deviennent-ils ? »). Le <b>type</b> sert aux statistiques : tous
              les IEP y forment une barre « Sciences Po Paris / autres IEP ».
            </p>
            <p>
              Un membre qui ne trouve pas son établissement l’ajoute lui-même : il est utilisable tout de suite et apparaît
              ci-dessous, « à contrôler ». <b>Fusionner</b> sert aux doublons (« IEP de Paris » et « Sciences Po Paris ») : toutes
              les fiches passent sur le bon établissement, puis le doublon disparaît.
            </p>
          </div>
        }
      />

      {/* Listes de suggestions partagées par toute la page (une seule fois, pour qu'elle reste légère). */}
      <datalist id="liste-pays">
        {pays.map((o) => (
          <option key={o.valeur} value={o.libelle} />
        ))}
      </datalist>
      <datalist id="tous-etablissements">
        {etablissements.map((e) => (
          <option key={e.id} value={libelleEtablissement(e)} />
        ))}
      </datalist>

      <Panneau
        titre="À contrôler"
        compte={aControler.length}
        compteAccent
        corps={false}
        action={
          aControler.length > 1 && (
            <form action={toutMarquerControle}>
              <button type="submit" className="text-sm font-semibold text-bordeaux-700 underline underline-offset-4 hover:text-bordeaux-500">
                Tout marquer comme contrôlé
              </button>
            </form>
          )
        }
      >
        {aControler.length === 0 ? (
          <Vide>Aucun établissement à contrôler.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {aControler.map((e) => (
              <li key={e.id} className={`px-5 py-5 sm:px-6 ${classeLisere}`}>
                <p className="mb-3">
                  <Pastille accent>{e.sejours.length > 0 ? "Nouvelle université Erasmus" : "Nouvel établissement"}</Pastille>
                </p>
                <Fiche e={e} />
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Tous les établissements" compte={etablissements.length} corps={false}>
        <div className="border-b border-bordeaux-700/10 px-5 py-4 sm:px-6">
          <Filtres
            action="/admin/etablissements"
            recherche={q}
            placeholder="Nom, ville, pays…"
            filtres={[{ nom: "type", libelle: "Type", valeur: type, options: optionsType }]}
          />
        </div>
        {affiches.length === 0 ? (
          <Vide>Aucun établissement.</Vide>
        ) : (
          <>
            <ul className="divide-y divide-bordeaux-700/10">
              {affiches.map((e) => (
                <li key={e.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm transition-colors hover:bg-bordeaux-100/25 sm:px-6 [&::-webkit-details-marker]:hidden">
                      <span>
                        <b className="text-ink">{e.nom}</b>
                        <span className="text-ink-soft"> · {[e.ville, nomPays(e.pays)].filter(Boolean).join(", ")}</span>
                      </span>
                      <span className="ml-auto flex items-center gap-2 text-xs text-ink-soft">
                        <Pastille>{LIBELLES_TYPE_ETABLISSEMENT[e.type as TypeEtablissement]}</Pastille>
                        {e.sejours.length + e.formations.length} fiche(s)
                        {e.aControler && <Pastille accent>À contrôler</Pastille>}
                        <ChevronDown size={18} aria-hidden className="transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="border-t border-bordeaux-700/10 bg-paper/60 px-5 py-4 sm:px-6">
                      <Fiche e={e} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
            {affiches.length < filtres.length && (
              <p className="border-t border-bordeaux-700/10 px-5 py-3 text-sm text-ink-soft sm:px-6">
                {AFFICHAGE_MAX} premiers établissements affichés sur {filtres.length} : utilisez la recherche pour trouver les autres.
              </p>
            )}
          </>
        )}
      </Panneau>

      <Panneau titre="Ajouter un établissement" icone={<Plus size={18} aria-hidden />}>
        <form action={creerEtablissement} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
          <label className="text-sm font-semibold text-ink">
            Nom
            <input name="nom" required maxLength={160} placeholder="Ex. Université de Vienne" className={`mt-1 w-full ${classeSaisie}`} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Ville
            <input name="ville" maxLength={80} className={`mt-1 w-full ${classeSaisie}`} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Pays
            <input name="pays" list="liste-pays" required defaultValue={nomPays("FR")} autoComplete="off" className={`mt-1 w-full ${classeSaisie}`} />
          </label>
          <label className="text-sm font-semibold text-ink">
            Type
            <select name="type" required defaultValue="UNIVERSITE" className={`mt-1 w-full ${classeSaisie}`}>
              {optionsType.map((o) => (
                <option key={o.valeur} value={o.valeur}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClasses("primary", "petit")}>
            Ajouter
          </button>
        </form>
      </Panneau>

      <Panneau titre="Importer une liste" icone={<Upload size={18} aria-hidden />}>
        <ImportEtablissements />
      </Panneau>
    </div>
  );
}
