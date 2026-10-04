import { Check, UserPlus } from "lucide-react";
import Link from "next/link";
import { changerRole, envoyerLienMotDePasse, refuserCompte, supprimerCompte, transfererPropriete, validerCompte } from "@/actions/admin";
import { BoutonConfirme } from "@/components/bouton-confirme";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien, classeLisere, classeSaisie, classesTableau } from "@/components/ui";
import { prisma } from "@/lib/db";
import { dateCourte, ilYa, libellePromo, normaliser } from "@/lib/format";
import { LIBELLES_ROLE, estAdministrateur, peutChangerRole, peutGererCompte, type Role } from "@/lib/roles";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Comptes" };

const classeBoutonDiscret = "text-sm text-ink-soft underline underline-offset-4 hover:text-bordeaux-700";

const ROLES_ATTRIBUABLES: Role[] = ["ADMIN", "ANIMATEUR", "MEMBRE"];
const RANG: Record<Role, number> = { MEMBRE: 0, ANIMATEUR: 1, ADMIN: 2, PROPRIETAIRE: 3 };

/** Libellé du bouton : « Rendre animateur », « Retirer le rôle d’administrateur », « Redevenir simple membre »… */
function libelleChangement(actuel: Role, nouveau: Role, estMoi: boolean) {
  const libelle = LIBELLES_ROLE[nouveau].toLowerCase();
  if (estMoi) return nouveau === "MEMBRE" ? "Redevenir simple membre" : `Passer ${libelle}`;
  if (RANG[nouveau] > RANG[actuel]) return `Rendre ${libelle}`;
  return nouveau === "MEMBRE" ? `Retirer le rôle d’${LIBELLES_ROLE[actuel].toLowerCase()}` : `Repasser ${libelle}`;
}

export default async function Comptes() {
  const { user: moi } = await exigerBureau();
  const admin = estAdministrateur(moi.role);

  const [enAttente, nonConfirmes, actifs, refuses, fichesLibres] = await Promise.all([
    prisma.user.findMany({ where: { statut: "EN_ATTENTE", emailVerified: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { statut: "EN_ATTENTE", emailVerified: false }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({
      where: { statut: "ACTIF" },
      include: { personne: { select: { id: true } } },
      orderBy: [{ role: "desc" }, { nom: "asc" }],
    }),
    prisma.user.findMany({ where: { statut: "REFUSE" }, orderBy: { createdAt: "desc" } }),
    // Fiches sans compte, auxquelles un nouveau compte peut être rattaché
    prisma.personne.findMany({
      where: { compte: null },
      select: { id: true, prenom: true, nom: true, promoEntree: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Comptes"
        phrase="Validez les inscriptions, gérez les rôles et aidez un membre à retrouver l’accès à son compte."
        action={
          admin ? (
            <Link href="/admin/invitations" className={buttonClasses("primary")}>
              <UserPlus size={16} aria-hidden /> Inviter des membres
            </Link>
          ) : undefined
        }
      />

      <Panneau titre="À valider" compte={enAttente.length} compteAccent corps={false}>
        <p className="border-b border-bordeaux-700/10 px-5 py-3 text-sm text-ink-soft sm:px-6">
          Vérifiez que la personne fait bien partie de la bi-licence. Si sa fiche existe déjà (import de l’Excel, saisie par le
          bureau), rattachez le compte à cette fiche plutôt que d’en créer une nouvelle.
        </p>
        {enAttente.length === 0 ? (
          <Vide>Aucun compte en attente.</Vide>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {enAttente.map((u) => {
              const memeNom = fichesLibres.filter((f) => normaliser(f.nom) === normaliser(u.nom));
              const suggestion = memeNom.find((f) => normaliser(f.prenom) === normaliser(u.prenom));
              const autres = fichesLibres.filter((f) => !memeNom.includes(f));
              return (
                <li key={u.id} className={`px-5 py-4 sm:px-6 ${classeLisere}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-semibold">
                      {u.prenom} {u.nom}
                      {u.promoEntree && <span className="font-normal text-ink-soft"> · promotion {libellePromo(u.promoEntree)}</span>}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {u.email} · inscription {ilYa(u.createdAt)}
                    </p>
                  </div>
                  {u.personneId && (
                    <p className="mt-2 text-sm">
                      La personne a déjà commencé sa fiche (cachée jusqu’à la validation) :{" "}
                      <Link href={`/admin/personnes/${u.personneId}`} className={classeLien}>
                        la consulter
                      </Link>
                      . Si une fiche existait déjà pour elle, choisissez-la : les deux seront regroupées.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <form action={validerCompte} className="flex flex-wrap items-end gap-3">
                      <input type="hidden" name="userId" value={u.id} />
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold">Fiche</span>
                        <select name="rattachement" defaultValue={suggestion?.id ?? "nouvelle"} className={`${classeSaisie} min-w-64 text-sm`}>
                          <option value="nouvelle">{u.personneId ? "Garder la fiche commencée" : "Créer une nouvelle fiche"}</option>
                          {memeNom.length > 0 && (
                            <optgroup label="Même nom">
                              {memeNom.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.prenom} {f.nom} ({libellePromo(f.promoEntree)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {autres.length > 0 && (
                            <optgroup label="Autres fiches sans compte">
                              {autres.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.prenom} {f.nom} ({libellePromo(f.promoEntree)})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </label>
                      <button type="submit" className={buttonClasses("primary", "petit")}>
                        <Check size={14} aria-hidden /> Valider
                      </button>
                    </form>
                    <form action={refuserCompte}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className={`${classeBoutonDiscret} py-2`}>
                        Refuser
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Membres actifs" compte={actifs.length} corps={false}>
        <p className="border-b border-bordeaux-700/10 px-5 py-3 text-sm text-ink-soft sm:px-6">
          <b>Animateur</b> : valide les comptes, gère actualités, événements, offres, bureau, domaines et établissements.{" "}
          <b>Administrateur</b> : en plus, modifie les fiches et gère les comptes et les animateurs.{" "}
          <b>Propriétaire</b> : le président ; seul à nommer ou retirer les administrateurs, il transmet son titre lors de
          la passation. Chacun peut renoncer lui-même à son rôle.
        </p>
        <div className={classesTableau.conteneur}>
          <table className={classesTableau.table}>
            <thead className={classesTableau.tete}>
              <tr>
                <th scope="col" className={classesTableau.th}>
                  Nom
                </th>
                <th scope="col" className={classesTableau.th}>
                  E-mail
                </th>
                <th scope="col" className={classesTableau.th}>
                  Rôle
                </th>
                <th scope="col" className={classesTableau.th}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {actifs.map((u) => {
                const estMoi = u.id === moi.id;
                const roles = ROLES_ATTRIBUABLES.filter((r) => peutChangerRole(moi, u, r));
                const gerable = peutGererCompte(moi, u);
                const transfert = moi.role === "PROPRIETAIRE" && !estMoi;
                return (
                  <tr key={u.id} className={classesTableau.ligne}>
                    <td className={classesTableau.td}>
                      {u.personne ? (
                        <Link href={`/admin/personnes/${u.personne.id}`} className={`font-semibold ${classeLien}`}>
                          {u.prenom} {u.nom}
                        </Link>
                      ) : (
                        <span className="font-semibold">{`${u.prenom} ${u.nom}`}</span>
                      )}
                      {estMoi && <span className="ml-2 text-xs text-ink-soft">(vous)</span>}
                    </td>
                    <td className={`${classesTableau.td} text-ink-soft`}>{u.email}</td>
                    <td className={classesTableau.td}>
                      {u.role === "MEMBRE" ? "Membre" : <Pastille accent={u.role !== "ANIMATEUR"}>{LIBELLES_ROLE[u.role as Role]}</Pastille>}
                    </td>
                    <td className={classesTableau.td}>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {roles.map((r) => (
                          <form key={r} action={changerRole}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="role" value={r} />
                            <BoutonConfirme
                              classe={classeBoutonDiscret}
                              confirmation={estMoi ? "Renoncer à votre rôle ? Vous ne pourrez pas le reprendre vous-même." : undefined}
                            >
                              {libelleChangement(u.role as Role, r, estMoi)}
                            </BoutonConfirme>
                          </form>
                        ))}
                        {transfert && (
                          <form action={transfererPropriete}>
                            <input type="hidden" name="userId" value={u.id} />
                            <BoutonConfirme
                              classe={classeBoutonDiscret}
                              confirmation={`Transmettre le titre de propriétaire à ${u.prenom} ${u.nom} ? Vous deviendrez administrateur.`}
                            >
                              Transmettre le titre de propriétaire
                            </BoutonConfirme>
                          </form>
                        )}
                        {gerable && (
                          <form action={envoyerLienMotDePasse}>
                            <input type="hidden" name="userId" value={u.id} />
                            <BoutonConfirme classe={classeBoutonDiscret} confirmation={`Envoyer à ${u.email} un lien pour choisir un nouveau mot de passe ?`}>
                              Lien de mot de passe
                            </BoutonConfirme>
                          </form>
                        )}
                        {gerable && (
                          <BoutonSupprimer
                            action={supprimerCompte}
                            champs={{ userId: u.id }}
                            libelle="Supprimer le compte"
                            confirmation="Supprimer ce compte ? La fiche de la personne est conservée."
                          />
                        )}
                        {roles.length === 0 && !gerable && !transfert && <span className="text-xs text-ink-soft">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panneau>

      {nonConfirmes.length > 0 && (
        <Panneau titre="E-mail non confirmé" compte={nonConfirmes.length} corps={false}>
          <p className="border-b border-bordeaux-700/10 px-5 py-3 text-sm text-ink-soft sm:px-6">
            Ces personnes se sont inscrites mais n’ont pas encore cliqué sur le lien de confirmation reçu par e-mail.
          </p>
          <ul className="divide-y divide-bordeaux-700/10 text-sm">
            {nonConfirmes.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 sm:px-6">
                <span>
                  <b>
                    {u.prenom} {u.nom}
                  </b>{" "}
                  <span className="text-ink-soft">
                    · {u.email} · {dateCourte(u.createdAt)}
                  </span>
                </span>
                {admin && <BoutonSupprimer action={supprimerCompte} champs={{ userId: u.id }} />}
              </li>
            ))}
          </ul>
        </Panneau>
      )}

      {refuses.length > 0 && (
        <Panneau titre="Comptes refusés" compte={refuses.length} corps={false}>
          <ul className="divide-y divide-bordeaux-700/10 text-sm">
            {refuses.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 sm:px-6">
                <span>
                  <b>
                    {u.prenom} {u.nom}
                  </b>{" "}
                  <span className="text-ink-soft">· {u.email}</span>
                </span>
                <div className="flex items-center gap-4">
                  <form action={validerCompte}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="rattachement" value="nouvelle" />
                    <button type="submit" className={classeBoutonDiscret}>
                      Valider finalement
                    </button>
                  </form>
                  {admin && <BoutonSupprimer action={supprimerCompte} champs={{ userId: u.id }} />}
                </div>
              </li>
            ))}
          </ul>
        </Panneau>
      )}
    </div>
  );
}
