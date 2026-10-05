import { Download, IdCard, KeyRound, Mail, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { EncartCompletude } from "@/components/fiche/encart-completude";
import { BandeauEspace, Initiales, Panneau, buttonClasses, classeLien } from "@/components/ui";
import { completude } from "@/lib/completude";
import { prisma } from "@/lib/db";
import { libellePromo, moisAnnee } from "@/lib/format";
import { estPersonnel, libelleFonction } from "@/lib/profils";
import { LIBELLES_ROLE, type Role } from "@/lib/roles";
import { exigerCompte } from "@/lib/session";
import { FormulaireDoubleAuth, FormulaireEmail, FormulaireMotDePasse, FormulaireSuppression } from "./formulaires";

export const metadata = { title: "Mon compte" };

const SOMMAIRE = [
  { id: "ma-fiche", libelle: "Ma fiche", icone: IdCard },
  { id: "adresse", libelle: "Adresse e-mail", icone: Mail },
  { id: "mot-de-passe", libelle: "Mot de passe", icone: KeyRound },
  { id: "double-auth", libelle: "Double authentification", icone: ShieldCheck },
  { id: "donnees", libelle: "Mes données", icone: Download },
  { id: "suppression", libelle: "Supprimer le compte", icone: Trash2 },
];

export default async function MonCompte({ searchParams }: PageProps<"/espace/compte">) {
  // Accessible aussi aux comptes en attente de validation (mot de passe, adresse, suppression).
  const { user } = await exigerCompte();
  const { email, error, "double-auth": doubleAuth } = await searchParams;
  // Le personnel de l'université n'a pas de fiche : pas de rubrique « Ma fiche ».
  const personnel = estPersonnel(user);
  const sommaire = personnel ? SOMMAIRE.filter((s) => s.id !== "ma-fiche") : SOMMAIRE;

  const fiche = user.personneId
    ? await prisma.personne.findUnique({ where: { id: user.personneId }, include: { _count: { select: { formations: true, experiences: true } } } })
    : null;
  const avancement = fiche ? completude({ ...fiche, nbFormations: fiche._count.formations, nbExperiences: fiche._count.experiences }) : null;
  const prenom = user.prenom || user.name.split(" ")[0] || "";
  const nom = user.nom || user.name.split(" ").slice(1).join(" ") || "";

  return (
    <div className="space-y-8">
      <BandeauEspace
        titre="Mon compte"
        phrase={`${user.name} · ${user.email}`}
        avant={<span className="hidden sm:block"><Initiales prenom={prenom} nom={nom} taille="bandeau" /></span>}
        action={
          <div className="space-y-2 text-sm text-white/80">
            <span className="inline-block rounded-abm-pill border border-white/50 px-2.5 py-0.5 text-xs font-semibold text-white">
              {user.statut === "ACTIF" ? LIBELLES_ROLE[user.role as Role] : "En attente de validation"}
            </span>
            <p>
              {user.createdAt && `Compte créé en ${moisAnnee(new Date(user.createdAt))}`}
              {personnel ? ` · ${libelleFonction(user.fonction)}` : user.promoEntree && ` · promotion ${libellePromo(user.promoEntree)}`}
            </p>
          </div>
        }
      />

      {email === "modifie" && !error && (
        <p role="status" className="rounded-abm-md border border-bordeaux-700/20 bg-white px-4 py-3 text-sm font-semibold text-bordeaux-700 shadow-abm-card">
          Votre nouvelle adresse e-mail est confirmée : utilisez-la désormais pour vous connecter.
        </p>
      )}
      {(doubleAuth === "active" || doubleAuth === "desactivee") && (
        <p role="status" className="rounded-abm-md border border-bordeaux-700/20 bg-white px-4 py-3 text-sm font-semibold text-bordeaux-700 shadow-abm-card">
          {doubleAuth === "active"
            ? "Double authentification activée : un code vous sera demandé à chaque connexion."
            : "Double authentification désactivée."}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-abm-md border border-bordeaux-500 bg-bordeaux-100 px-4 py-3 text-sm text-bordeaux-800">
          Ce lien de confirmation n’est plus valable. Recommencez le changement d’adresse ci-dessous.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Sur cette page" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <p className="eyebrow text-bordeaux-500">Sur cette page</p>
          <ol className="mt-4 space-y-1 border-l border-bordeaux-700/15 text-sm">
            {sommaire.map(({ id, libelle, icone: Icone }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="-ml-px flex items-center gap-2 border-l-2 border-transparent py-1.5 pl-4 text-ink-soft transition-colors hover:border-bordeaux-700 hover:text-bordeaux-700"
                >
                  <Icone size={15} aria-hidden /> {libelle}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          {!personnel && <EncartCompletude avancement={avancement} id="ma-fiche" className="scroll-mt-28" />}

          <Panneau id="adresse" className="scroll-mt-28" titre="Adresse e-mail" icone={<Mail size={19} aria-hidden />}>
            <p className="mb-5 max-w-[62ch] text-[15px] text-ink-soft">
              Adresse actuelle : <b className="text-ink">{user.email}</b>. Un lien de confirmation sera envoyé à la nouvelle adresse.
            </p>
            <FormulaireEmail />
          </Panneau>

          <Panneau id="mot-de-passe" className="scroll-mt-28" titre="Mot de passe" icone={<KeyRound size={19} aria-hidden />}>
            <FormulaireMotDePasse />
          </Panneau>

          <Panneau id="double-auth" className="scroll-mt-28" titre="Double authentification" icone={<ShieldCheck size={19} aria-hidden />}>
            <p className="mb-5 max-w-[62ch] text-[15px] text-ink-soft">
              {user.twoFactorEnabled ? (
                <>
                  <b className="text-ink">Activée.</b> À chaque connexion, un code à 6 chiffres de votre application d’authentification
                  vous est demandé en plus du mot de passe.
                </>
              ) : (
                <>
                  Facultative. En plus du mot de passe, un code à 6 chiffres affiché par une application sur votre téléphone sera
                  demandé à chaque connexion : votre compte reste protégé même si votre mot de passe est découvert.
                </>
              )}
            </p>
            <FormulaireDoubleAuth active={!!user.twoFactorEnabled} />
          </Panneau>

          <Panneau id="donnees" className="scroll-mt-28" titre="Mes données" icone={<Download size={19} aria-hidden />}>
            <p className="max-w-[62ch] text-[15px] text-ink-soft">
              Téléchargez l’ensemble des informations que le site conserve sur vous (compte, fiche, formations, stages, offres
              proposées), dans un fichier lisible par d’autres services.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="/espace/compte/donnees" download className={buttonClasses("outline")}>
                <Download size={16} aria-hidden /> Télécharger mes données
              </a>
              <Link href="/vos-donnees" className={`text-sm ${classeLien}`}>
                Tous vos droits sur vos données
              </Link>
            </div>
          </Panneau>

          <Panneau id="suppression" className="scroll-mt-28" sensible titre="Supprimer mon compte" icone={<Trash2 size={19} aria-hidden />}>
            <p className="mb-5 max-w-[62ch] text-[15px] text-ink-soft">
              La suppression est définitive : votre compte, votre fiche, vos formations et vos stages sont effacés du site. Les offres
              que vous avez proposées restent publiées, sans votre nom.
            </p>
            <FormulaireSuppression />
          </Panneau>
        </div>
      </div>
    </div>
  );
}
