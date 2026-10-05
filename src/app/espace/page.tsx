import { Archive, ArrowRight, BriefcaseBusiness, CalendarDays, Check, Clock, IdCard, MailCheck, Users } from "lucide-react";
import Link from "next/link";
import { creerMaFiche } from "@/actions/fiche";
import { SceauFiligrane } from "@/components/anime";
import { EncartCompletude } from "@/components/fiche/encart-completude";
import { BandeauEspace, BlocDate, Panneau, Vide, buttonClasses, classeLien } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LIBELLES_TYPE_OFFRE, heure } from "@/lib/format";
import { completude, encouragement } from "@/lib/completude";
import { estPersonnel } from "@/lib/profils";
import { exigerCompte } from "@/lib/session";

export const metadata = { title: "Accueil" };

const raccourcis = [
  { href: "/espace/annuaire", icone: Users, titre: "Annuaire", texte: "Retrouver les anciens par secteur, promotion ou formation." },
  { href: "/espace/stages", icone: Archive, titre: "Archive des stages", texte: "Tous les stages des membres, par structure et par secteur." },
  { href: "/espace/offres", icone: BriefcaseBusiness, titre: "Offres", texte: "Stages et emplois transmis par le réseau." },
  { href: "/actualites?type=evenements", icone: CalendarDays, titre: "Événements", texte: "Les prochains rendez-vous de l’association." },
];

/** Accueil d'un compte en attente de validation : ce qui est fait, ce qui reste, ce qu'il peut faire. */
async function AccueilEnAttente({ prenom, personneId, personnel }: { prenom: string; personneId: string | null; personnel: boolean }) {
  const fiche = personneId && !personnel
    ? await prisma.personne.findUnique({ where: { id: personneId }, include: { _count: { select: { formations: true, experiences: true } } } })
    : null;
  const avancement = fiche
    ? completude({ ...fiche, nbFormations: fiche._count.formations, nbExperiences: fiche._count.experiences })
    : null;

  const etapes = [
    { icone: MailCheck, titre: "Adresse e-mail confirmée", texte: "C’est fait, merci.", etat: "fait" as const },
    // Le personnel de l'université n'a pas de fiche : seulement l'e-mail et la validation.
    ...(personnel
      ? []
      : [
    {
      icone: IdCard,
      titre: "Votre fiche",
      texte: avancement ? `Complète à ${avancement.pourcentage} %. ${encouragement(avancement.pourcentage)}` : "Pas encore commencée.",
      etat: avancement && avancement.pourcentage >= 100 ? ("fait" as const) : ("encours" as const),
    },
        ]),
    {
      icone: Clock,
      titre: "Validation par le bureau",
      texte: personnel
        ? "Le bureau vérifie que vous faites bien partie du personnel de l’université. Vous recevrez un e-mail dès que votre compte sera validé."
        : "Le bureau vérifie que vous avez bien suivi la bi-licence. Vous recevrez un e-mail dès que votre compte sera validé.",
      etat: "attente" as const,
    },
  ];

  return (
    <div className="space-y-10">
      <div className="fond-bordeaux filigrane relative overflow-hidden rounded-abm-lg px-6 py-10 sm:px-10">
        <SceauFiligrane className="-right-20 -top-24 size-[340px]" />
        <p className="apparait eyebrow relative text-white/76">Compte en attente de validation</p>
        <h1 className="apparait relative mt-2 font-display text-4xl font-bold">Bienvenue {prenom}</h1>
        <p className="apparait relative mt-3 max-w-[60ch] text-white/80" style={{ animationDelay: "100ms" }}>
          {personnel
            ? "Votre compte doit encore être validé par le bureau. Vous aurez ensuite accès à l’annuaire, à l’archive des stages et aux offres."
            : "Votre compte doit encore être validé par le bureau. En attendant, vous pouvez déjà remplir votre fiche : elle apparaîtra dans l’annuaire dès la validation."}
        </p>
      </div>

      <ol className={`grid gap-4 ${personnel ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {etapes.map(({ icone: Icone, titre, texte, etat }, i) => (
          <li
            key={titre}
            className={`relative rounded-abm-md border bg-white p-5 shadow-abm-card ${
              etat === "encours" ? "border-bordeaux-700" : "border-bordeaux-700/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid size-10 place-items-center rounded-abm-pill ${
                  etat === "fait" ? "bg-bordeaux-700 text-white" : etat === "encours" ? "bg-bordeaux-100 text-bordeaux-700" : "border border-dashed border-bordeaux-300 text-ink-soft"
                }`}
              >
                {etat === "fait" ? <Check size={18} aria-hidden /> : <Icone size={18} aria-hidden />}
              </span>
              <p className="eyebrow text-ink-soft">Étape {i + 1}</p>
            </div>
            <p className="mt-3 font-display text-lg font-bold text-bordeaux-700">{titre}</p>
            <p className="mt-1 text-sm text-ink-soft">{texte}</p>
            {etat === "encours" && avancement && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-abm-pill bg-bordeaux-100" aria-hidden>
                <div className="h-full bg-[image:var(--degrade-bouton)]" style={{ width: `${avancement.pourcentage}%` }} />
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-4">
        {personnel ? null : fiche ? (
          <Link href="/espace/ma-fiche" className={buttonClasses("primary")}>
            <IdCard size={16} aria-hidden /> Compléter ma fiche
          </Link>
        ) : (
          <form action={creerMaFiche}>
            <button type="submit" className={buttonClasses("primary")}>
              <IdCard size={16} aria-hidden /> Commencer ma fiche
            </button>
          </form>
        )}
        <Link href="/espace/compte" className={`text-sm ${classeLien}`}>
          Gérer mon compte
        </Link>
      </div>
    </div>
  );
}

export default async function AccueilEspace() {
  const { user } = await exigerCompte();
  const personnel = estPersonnel(user);
  if (user.statut !== "ACTIF") return <AccueilEnAttente prenom={user.prenom} personneId={user.personneId ?? null} personnel={personnel} />;

  const maintenant = new Date();
  // Même règle que la page Offres : une offre reste visible jusqu'au soir de sa date limite.
  const debutJournee = new Date(maintenant);
  debutJournee.setHours(0, 0, 0, 0);
  const [evenements, offres, fiche] = await Promise.all([
    prisma.article.findMany({ where: { type: "EVENEMENT", publie: true, debut: { gte: maintenant } }, orderBy: { debut: "asc" }, take: 3 }),
    prisma.offre.findMany({
      where: { statut: "PUBLIEE", OR: [{ dateLimite: null }, { dateLimite: { gte: debutJournee } }] },
      orderBy: { publieeLe: "desc" },
      take: 3,
    }),
    user.personneId && !personnel
      ? prisma.personne.findUnique({ where: { id: user.personneId }, include: { _count: { select: { formations: true, experiences: true } } } })
      : null,
  ]);

  const avancement = fiche ? completude({ ...fiche, nbFormations: fiche._count.formations, nbExperiences: fiche._count.experiences }) : null;

  return (
    <div className="space-y-10">
      <BandeauEspace titre={`Bonjour ${user.prenom}`} phrase="Bienvenue dans l’espace membres d’Alumni Bi-Licence Montpellier." />

      {!personnel && (!avancement || avancement.pourcentage < 100) && <EncartCompletude avancement={avancement} />}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {raccourcis.map(({ href, icone: Icone, titre, texte }) => (
          <li key={href}>
            <Link
              href={href}
              className="group block h-full rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card carte-premium"
            >
              <span className="grid size-10 place-items-center rounded-abm-sm bg-bordeaux-100 text-bordeaux-700 transition-colors duration-200 group-hover:bg-bordeaux-700 group-hover:text-white">
                <Icone size={20} aria-hidden />
              </span>
              <p className="mt-3 font-display text-lg font-bold text-bordeaux-700">{titre}</p>
              <p className="mt-1 text-sm text-ink-soft">{texte}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Panneau
          titre="Prochains événements"
          corps={false}
          action={
            <Link href="/actualites?type=evenements" className={`text-sm ${classeLien}`}>
              Tout voir
            </Link>
          }
        >
          {evenements.length === 0 ? (
            <Vide>Aucun événement à venir pour le moment.</Vide>
          ) : (
            <ul className="divide-y divide-bordeaux-700/10">
              {evenements.map((e) => (
                <li key={e.id}>
                  <Link href={`/actualites/${e.slug}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
                    <BlocDate date={e.debut} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold group-hover:text-bordeaux-700">{e.titre}</span>
                      <span className="block text-sm text-ink-soft">
                        {e.debut && heure(e.debut)}
                        {e.lieu && ` · ${e.lieu}`}
                      </span>
                    </span>
                    <ArrowRight size={16} aria-hidden className="fleche shrink-0 text-bordeaux-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Dernières offres"
          corps={false}
          action={
            <Link href="/espace/offres" className={`text-sm ${classeLien}`}>
              Tout voir
            </Link>
          }
        >
          {offres.length === 0 ? (
            <Vide>Aucune offre en cours.</Vide>
          ) : (
            <ul className="divide-y divide-bordeaux-700/10">
              {offres.map((o) => (
                <li key={o.id}>
                  <Link href="/espace/offres" className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bordeaux-100/25 sm:px-6">
                    <BlocDate date={o.dateLimite} surtitre={o.dateLimite ? "avant le" : undefined} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold group-hover:text-bordeaux-700">{o.titre}</span>
                      <span className="block text-sm text-ink-soft">
                        {LIBELLES_TYPE_OFFRE[o.type]} · {o.organisation}
                      </span>
                    </span>
                    <ArrowRight size={16} aria-hidden className="fleche shrink-0 text-bordeaux-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </div>
    </div>
  );
}
