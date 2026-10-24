import { RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  fusionnerFormationsComplementaires,
  garderCommeMaster,
  rangerFormation,
  relancerDetection,
  renommerFormationComplementaire,
  toutRanger,
} from "@/actions/complementaires";
import { EnTeteConsole, Panneau, Vide, buttonClasses, classeLien, classeLisere, classeSaisie, classesTableau } from "@/components/ui";
import { LIBELLES_COMPLEMENTAIRE, TYPES_COMPLEMENTAIRES, detecterComplementaire, regrouperFormations } from "@/lib/complementaires";
import { prisma } from "@/lib/db";
import { anneesFormation, libellePromo } from "@/lib/format";
import { estAdministrateur } from "@/lib/roles";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Formations complémentaires" };

const VUES = [
  { cle: "reclasser", libelle: "À reclasser" },
  { cle: "regrouper", libelle: "Regroupements" },
] as const;

export default async function AdminComplementaires({ searchParams }: PageProps<"/admin/formations-complementaires">) {
  const { user } = await exigerBureau();
  const admin = estAdministrateur(user.role);
  const p = await searchParams;
  const vue = VUES.find((v) => v.cle === p.vue)?.cle ?? "reclasser";

  const [aReclasser, complementaires] = await Promise.all([
    prisma.formation.findMany({
      where: { complementaireSuggere: { not: null }, complementaireEcarte: false },
      include: { personne: { select: { id: true, prenom: true, nom: true, promoEntree: true } } },
      orderBy: [{ personne: { nom: "asc" } }, { creeLe: "asc" }],
    }),
    prisma.formationComplementaire.findMany({ select: { titre: true, type: true, personneId: true } }),
  ]);
  const groupes = regrouperFormations(complementaires).sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
  const nombres = { reclasser: aReclasser.length, regrouper: groupes.length };

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Formations complémentaires"
        phrase="Ranger les DU, licences en parallèle, certifications et MOOC saisis comme des masters, et regrouper les écritures d’une même formation."
        action={
          <Link href="/espace/formations-complementaires" className={`text-sm ${classeLien}`}>
            Voir la page des membres
          </Link>
        }
      />

      <nav aria-label="Vues" className="flex flex-wrap gap-2">
        {VUES.map((v) => (
          <Link
            key={v.cle}
            href={v.cle === "reclasser" ? "/admin/formations-complementaires" : `/admin/formations-complementaires?vue=${v.cle}`}
            aria-current={v.cle === vue ? "page" : undefined}
            className={`inline-flex min-h-9 items-center gap-2 rounded-abm-pill border px-4 py-1.5 text-sm font-semibold transition-colors ${
              v.cle === vue
                ? "border-bordeaux-700 bg-bordeaux-700 text-white"
                : "border-bordeaux-700/30 bg-white text-bordeaux-700 hover:border-bordeaux-700 hover:bg-bordeaux-100"
            }`}
          >
            {v.libelle}
            <span className="tabular-nums opacity-80">{nombres[v.cle]}</span>
          </Link>
        ))}
      </nav>

      {vue === "reclasser" ? (
        <>
          <Panneau
            titre="Repérées parmi les formations « master »"
            compte={aReclasser.length}
            compteAccent
            corps={false}
            action={
              <form action={relancerDetection}>
                <button type="submit" className={buttonClasses("outline", "petit")}>
                  <RefreshCw size={14} aria-hidden /> Relancer la détection
                </button>
              </form>
            }
          >
            <p className="border-b border-bordeaux-700/10 px-5 py-4 text-sm text-ink-soft sm:px-6">
              Vérifiez le type proposé puis rangez la formation : elle quitte le parcours (et les statistiques de masters) pour la rubrique
              « Formations complémentaires » de la fiche, et la personne en est prévenue sur « Ma fiche ». « C’est un master » la retire de
              cette liste pour de bon.
              {!admin && " Seuls les administrateurs peuvent ranger une formation."}
            </p>
            {aReclasser.length === 0 ? (
              <div className="p-5 sm:p-6">
                <Vide>Aucune formation à reclasser.</Vide>
              </div>
            ) : (
              <div className={classesTableau.conteneur}>
                <table className={classesTableau.table}>
                  <thead className={classesTableau.tete}>
                    <tr>
                      <th className={classesTableau.th}>Personne</th>
                      <th className={classesTableau.th}>Formation saisie</th>
                      <th className={classesTableau.th}>Pourquoi repérée</th>
                      {admin && <th className={classesTableau.th}>Ranger comme</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {aReclasser.map((f) => (
                      <tr key={f.id} className={classesTableau.ligne}>
                        <td className={`${classesTableau.td} ${classeLisere}`}>
                          <Link href={`/admin/personnes/${f.personne.id}`} className="font-semibold text-bordeaux-700 hover:underline">
                            {f.personne.prenom} {f.personne.nom}
                          </Link>
                          <span className="block text-xs text-ink-soft">Promotion {libellePromo(f.personne.promoEntree)}</span>
                        </td>
                        <td className={classesTableau.td}>
                          {f.intitule}
                          <span className="block text-xs text-ink-soft">{[f.parcours, f.etablissement, anneesFormation(f)].filter(Boolean).join(" · ")}</span>
                        </td>
                        <td className={`${classesTableau.td} text-ink-soft`}>{detecterComplementaire(f, f.personne.promoEntree)?.raison ?? "—"}</td>
                        {admin && (
                          <td className={classesTableau.td}>
                            <form action={rangerFormation} className="flex flex-wrap items-center gap-2">
                              <input type="hidden" name="id" value={f.id} />
                              <select name="type" defaultValue={f.complementaireSuggere ?? "DU"} aria-label="Type de formation" className={`${classeSaisie} w-auto py-1.5 text-sm`}>
                                {TYPES_COMPLEMENTAIRES.map((t) => (
                                  <option key={t} value={t}>
                                    {LIBELLES_COMPLEMENTAIRE[t].un}
                                  </option>
                                ))}
                              </select>
                              <button type="submit" className={buttonClasses("primary", "petit")}>
                                Ranger
                              </button>
                              <button type="submit" formAction={garderCommeMaster} className={buttonClasses("outline", "petit")}>
                                C’est un master
                              </button>
                            </form>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {admin && aReclasser.length > 1 && (
              <form action={toutRanger} className="flex flex-wrap items-center justify-between gap-3 border-t border-bordeaux-700/10 bg-bordeaux-100/25 px-5 py-4 sm:px-6">
                <span className="text-sm text-ink-soft">Chaque formation est rangée avec le type proposé par la détection.</span>
                <button type="submit" className={buttonClasses("primary", "petit")}>
                  Tout ranger ({aReclasser.length})
                </button>
              </form>
            )}
          </Panneau>

          <Panneau titre="La détection">
            <div className="space-y-3 text-sm">
              <p>
                Sont repérés : <b>DU, DIU, diplôme universitaire, certificat d’université</b> · une <b>licence</b> commencée pendant la bi-licence
                · <b>TOEIC, TOEFL, IELTS, Cambridge, Voltaire, PIX, CLES, DELF, DELE, Goethe…</b> · <b>MOOC, FUN, Coursera, edX, OpenClassrooms</b>.
                Un intitulé qui commence par « Master », « M1 », « M2 », « MSc »… n’est jamais repéré.
              </p>
              <p className="text-ink-soft">
                La détection a lieu à chaque formation enregistrée par un membre. Pour relire toutes les formations (après un import, par
                exemple) : le bouton « Relancer la détection » ci-dessus, ou en ligne de commande{" "}
                <code className="rounded-abm-sm bg-bordeaux-100/60 px-1.5 py-0.5 text-[13px]">npm run complementaires:detecter</code> (simulation,
                puis <code className="rounded-abm-sm bg-bordeaux-100/60 px-1.5 py-0.5 text-[13px]">-- --confirmer</code>).
              </p>
            </div>
          </Panneau>
        </>
      ) : (
        <Panneau titre="Écritures regroupées" compte={groupes.length} corps={false}>
          <p className="border-b border-bordeaux-700/10 px-5 py-4 text-sm text-ink-soft sm:px-6">
            Les titres identiques (majuscules, accents et ponctuation ignorés) sont regroupés automatiquement sur la page des membres. Renommez
            une formation pour corriger son titre partout, ou réunissez deux écritures d’une même formation (« Projet Voltaire » dans
            « Certificat Voltaire ») : elle prend le titre et le type de la seconde.
          </p>
          {groupes.length === 0 ? (
            <div className="p-5 sm:p-6">
              <Vide>Aucune formation complémentaire saisie.</Vide>
            </div>
          ) : (
            <div className={classesTableau.conteneur}>
              <datalist id="titres-formations">
                {groupes.map((g) => (
                  <option key={g.cle} value={g.titre} />
                ))}
              </datalist>
              <table className={classesTableau.table}>
                <thead className={classesTableau.tete}>
                  <tr>
                    <th className={classesTableau.th}>Formation</th>
                    <th className={classesTableau.th}>Écritures</th>
                    <th className={classesTableau.th}>Personnes</th>
                    <th className={classesTableau.th}>Renommer · Réunir</th>
                  </tr>
                </thead>
                <tbody>
                  {groupes.map((g) => {
                    const ecritures = [...new Set(g.elements.map((e) => e.titre.trim()))];
                    return (
                      <tr key={g.cle} className={classesTableau.ligne}>
                        <td className={classesTableau.td}>
                          <span className="font-semibold">{g.titre}</span>
                          <span className="block text-xs text-ink-soft">{LIBELLES_COMPLEMENTAIRE[g.type].un}</span>
                        </td>
                        <td className={classesTableau.td}>
                          {ecritures.length > 1 ? (
                            <ul className="flex flex-wrap gap-1.5">
                              {ecritures.map((e) => (
                                <li key={e} className="rounded-abm-sm border border-dashed border-bordeaux-700/30 bg-paper px-2 py-0.5 text-xs">
                                  {e}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-ink-soft">—</span>
                          )}
                        </td>
                        <td className={`${classesTableau.td} tabular-nums`}>{new Set(g.elements.map((e) => e.personneId)).size}</td>
                        <td className={classesTableau.td}>
                          <div className="grid gap-2">
                            <form action={renommerFormationComplementaire} className="flex gap-2">
                              <input type="hidden" name="cle" value={g.cle} />
                              <input name="titre" defaultValue={g.titre} required maxLength={160} aria-label={`Nouveau titre pour ${g.titre}`} className={`${classeSaisie} py-1.5 text-sm`} />
                              <button type="submit" className={buttonClasses("outline", "petit")}>
                                Renommer
                              </button>
                            </form>
                            {groupes.length > 1 && (
                              <form action={fusionnerFormationsComplementaires} className="flex gap-2">
                                <input type="hidden" name="cle" value={g.cle} />
                                <input
                                  name="cible"
                                  list="titres-formations"
                                  required
                                  placeholder="Réunir dans…"
                                  autoComplete="off"
                                  aria-label={`Réunir ${g.titre} dans une autre formation`}
                                  className={`${classeSaisie} py-1.5 text-sm`}
                                />
                                <button type="submit" className={buttonClasses("outline", "petit")}>
                                  Réunir
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panneau>
      )}
    </div>
  );
}
