import { Send, Upload } from "lucide-react";
import Link from "next/link";
import { supprimerCompte } from "@/actions/admin";
import { envoyerToutesInvitations, envoyerUneInvitation } from "@/actions/invitations";
import { BoutonSupprimer } from "@/components/bouton-supprimer";
import { EnTeteConsole, Panneau, Pastille, Vide, buttonClasses, classeLien, classesTableau } from "@/components/ui";
import { prisma } from "@/lib/db";
import { dateCourte, libellePromo } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { ImportPreComptes, LienACopier } from "./formulaires";

export const metadata = { title: "Pré-comptes" };

const classeBoutonDiscret = "text-sm text-ink-soft underline underline-offset-4 hover:text-bordeaux-700";

export default async function PreComptes() {
  await exigerAdmin();
  const invites = await prisma.user.findMany({
    where: { statut: "INVITE" },
    include: { personne: { select: { id: true, promoEntree: true } } },
    orderBy: [{ invitationEnvoyeeLe: { sort: "asc", nulls: "first" } }, { nom: "asc" }],
  });
  const aInviter = invites.filter((u) => !u.invitationEnvoyeeLe).length;

  return (
    <div className="space-y-8">
      <EnTeteConsole
        titre="Pré-comptes"
        phrase={
          <div className="space-y-2">
            <p>
              Créez à l’avance le compte des anciens connus (bases de master) : leur fiche existe tout de suite, visible des
              membres connectés. Envoyez-leur ensuite le lien d’invitation : la personne confirme son adresse, choisit son mot
              de passe et retrouve sa fiche déjà commencée. Son compte est alors actif (vous l’avez déjà validé en l’important).
            </p>
            <p className="text-sm">
              L’e-mail d’invitation indique d’où viennent les données et comment les modifier ou les supprimer. Les fichiers
              importés contiennent des données personnelles : ne les gardez pas plus que nécessaire.
            </p>
          </div>
        }
      />

      <Panneau titre="Importer une base" icone={<Upload size={18} aria-hidden />}>
        <ImportPreComptes />
      </Panneau>

      <Panneau
        titre="En attente d’activation"
        compte={invites.length}
        corps={false}
        action={
          aInviter > 0 && (
            <form action={envoyerToutesInvitations}>
              <button type="submit" className={buttonClasses("primary", "petit")}>
                <Send size={14} aria-hidden /> Inviter les {aInviter} pré-compte{aInviter > 1 ? "s" : ""} restant{aInviter > 1 ? "s" : ""}
              </button>
            </form>
          )
        }
      >
        {invites.length === 0 ? (
          <Vide>Aucun pré-compte en attente. Les comptes activés rejoignent les membres actifs (onglet Comptes).</Vide>
        ) : (
          <div className={classesTableau.conteneur}>
            <table className={`${classesTableau.table} min-w-[760px]`}>
              <thead className={classesTableau.tete}>
                <tr>
                  <th scope="col" className={classesTableau.th}>
                    Nom
                  </th>
                  <th scope="col" className={classesTableau.th}>
                    E-mail
                  </th>
                  <th scope="col" className={classesTableau.th}>
                    État
                  </th>
                  <th scope="col" className={classesTableau.th}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invites.map((u) => (
                  <tr key={u.id} className={classesTableau.ligne}>
                    <td className={classesTableau.td}>
                      {u.personne ? (
                        <Link href={`/admin/personnes/${u.personne.id}`} className={`font-semibold ${classeLien}`}>
                          {u.prenom} {u.nom}
                        </Link>
                      ) : (
                        <span className="font-semibold">{`${u.prenom} ${u.nom}`}</span>
                      )}
                      {u.personne && <span className="block text-xs text-ink-soft">Promotion {libellePromo(u.personne.promoEntree)}</span>}
                    </td>
                    <td className={`${classesTableau.td} text-ink-soft`}>{u.email}</td>
                    <td className={classesTableau.td}>
                      {u.invitationEnvoyeeLe ? (
                        <span className="text-ink-soft">Invité le {dateCourte(u.invitationEnvoyeeLe)}</span>
                      ) : (
                        <Pastille>Lien pas encore envoyé</Pastille>
                      )}
                    </td>
                    <td className={classesTableau.td}>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <form action={envoyerUneInvitation}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button type="submit" className={classeBoutonDiscret}>
                            {u.invitationEnvoyeeLe ? "Renvoyer l’e-mail" : "Envoyer l’e-mail"}
                          </button>
                        </form>
                        <LienACopier userId={u.id} />
                        <BoutonSupprimer
                          action={supprimerCompte}
                          champs={{ userId: u.id }}
                          libelle="Supprimer le pré-compte"
                          confirmation="Supprimer ce pré-compte ? La fiche de la personne est conservée."
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panneau>
    </div>
  );
}
