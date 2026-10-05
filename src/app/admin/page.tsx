import { ArrowRight, CalendarPlus, Check, Download, Globe, Landmark, Newspaper, Tags, UserPlus } from "lucide-react";
import Link from "next/link";
import { BandeauEspace, Panneau, TitreSection, buttonClasses, classeLisere } from "@/components/ui";
import { prisma } from "@/lib/db";
import { dateLongue, ilYa, libellePromo } from "@/lib/format";
import { maintenance } from "@/lib/maintenance";
import { estPersonnel, libelleFonction } from "@/lib/profils";
import { LIBELLES_ROLE, estAdministrateur, type Role } from "@/lib/roles";
import { exigerBureau } from "@/lib/session";

export const metadata = { title: "Tableau de bord" };

/** « 1 compte à valider », « 2 comptes à valider ». */
const accorde = (n: number, singulier: string, pluriel: string) => `${n > 1 ? pluriel : singulier}`;

export default async function TableauDeBord() {
  const { user } = await exigerBureau();
  await maintenance().catch((e) => console.error("Maintenance :", e));
  const admin = estAdministrateur(user.role);

  const filtreComptes = { statut: "EN_ATTENTE" as const, emailVerified: true };
  const [
    nbComptes,
    comptes,
    nbOffres,
    offres,
    domainesAControler,
    etablissementsAControler,
    membresActifs,
    fiches,
    fichesPubliques,
    stages,
    sejours,
    parPromo,
    actifsParPromo,
  ] = await Promise.all([
    prisma.user.count({ where: filtreComptes }),
    prisma.user.findMany({
      where: filtreComptes,
      select: { id: true, prenom: true, nom: true, name: true, promoEntree: true, profil: true, fonction: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 3,
    }),
    prisma.offre.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.offre.findMany({
      where: { statut: "EN_ATTENTE" },
      select: { id: true, titre: true, creeLe: true, deposePar: { select: { prenom: true, nom: true } } },
      orderBy: { creeLe: "asc" },
      take: 3,
    }),
    prisma.domaine.findMany({
      where: { aControler: true },
      select: { id: true, libelle: true, creeLe: true, ajoutePar: { select: { prenom: true, nom: true } } },
      orderBy: { creeLe: "desc" },
    }),
    prisma.etablissement.findMany({
      where: { aControler: true },
      select: { id: true, nom: true, creeLe: true, ajoutePar: { select: { prenom: true, nom: true } }, _count: { select: { sejours: true } } },
      orderBy: { creeLe: "desc" },
    }),
    prisma.user.count({ where: { statut: "ACTIF" } }),
    prisma.personne.count(),
    prisma.personne.count({ where: { consentementPublic: true } }),
    prisma.experience.count({ where: { type: { in: ["STAGE", "ALTERNANCE"] } } }),
    prisma.erasmus.count(),
    prisma.personne.groupBy({ by: ["promoEntree"], _count: true, orderBy: { promoEntree: "asc" } }),
    prisma.personne.groupBy({ by: ["promoEntree"], where: { compte: { is: { statut: "ACTIF" } } }, _count: true }),
  ]);

  const universitesErasmus = etablissementsAControler.filter((e) => e._count.sejours > 0);
  const autresEtablissements = etablissementsAControler.filter((e) => e._count.sejours === 0);
  const aControler = domainesAControler.length + etablissementsAControler.length;
  const enAttente = nbComptes + nbOffres;

  // Fil des derniers ajouts des membres, du plus récent au plus ancien.
  const ajouts = [
    ...etablissementsAControler.map((e) => ({
      id: e.id,
      icone: e._count.sejours > 0 ? Globe : Landmark,
      quoi: e._count.sejours > 0 ? "Université Erasmus" : "Établissement",
      nom: e.nom,
      par: e.ajoutePar,
      le: e.creeLe,
      href: "/admin/etablissements",
    })),
    ...domainesAControler.map((d) => ({ id: d.id, icone: Tags, quoi: "Domaine", nom: d.libelle, par: d.ajoutePar, le: d.creeLe, href: "/admin/domaines" })),
  ]
    .sort((a, b) => b.le.getTime() - a.le.getTime())
    .slice(0, 8);

  const actifs = new Map(actifsParPromo.map((g) => [g.promoEntree, g._count]));
  const promos = parPromo.map((g) => ({ promo: g.promoEntree, total: g._count, avecCompte: actifs.get(g.promoEntree) ?? 0 }));
  const plusGrande = Math.max(1, ...promos.map((p) => p.total));
  const partPublique = fiches ? Math.round((fichesPubliques / fiches) * 100) : 0;

  const actionsRapides = [
    { href: "/admin/actualites/nouveau", libelle: "Nouvelle actualité", icone: Newspaper, visible: true },
    { href: "/admin/actualites/nouveau?type=evenement", libelle: "Nouvel événement", icone: CalendarPlus, visible: true },
    { href: "/admin/invitations", libelle: "Inviter des membres", icone: UserPlus, visible: admin },
    { href: "/admin/personnes/export", libelle: "Exporter les fiches", icone: Download, visible: admin, telechargement: true },
  ].filter((a) => a.visible);

  return (
    <div className="space-y-8">
      <BandeauEspace
        titre={`Bonjour ${user.prenom}`}
        phrase={`${LIBELLES_ROLE[user.role as Role]} · ${dateLongue(new Date())}`}
        chiffre={enAttente > 0 ? enAttente : undefined}
        libelleChiffre={accorde(enAttente, "action en attente", "actions en attente")}
        action={
          enAttente === 0 ? (
            <span className="inline-flex items-center gap-2 rounded-abm-pill border border-white/45 px-3.5 py-1.5 text-sm font-semibold">
              <Check size={16} aria-hidden /> Tout est à jour
            </span>
          ) : undefined
        }
      />

      <section aria-label="À traiter" className="grid gap-4 md:grid-cols-2">
        <CarteAction
          nombre={nbComptes}
          libelle={accorde(nbComptes, "compte à valider", "comptes à valider")}
          href="/admin/comptes"
          lignes={comptes.map((c) => ({
            id: c.id,
            gauche: (
              <>
                <b>{[c.prenom, c.nom].filter(Boolean).join(" ") || c.name}</b>
                {estPersonnel(c) ? (
                  <span className="text-ink-soft"> · {libelleFonction(c.fonction)}</span>
                ) : (
                  c.promoEntree && <span className="text-ink-soft"> · promotion {libellePromo(c.promoEntree)}</span>
                )}
              </>
            ),
            droite: `inscription ${ilYa(c.createdAt)}`,
          }))}
          vide="Aucun compte en attente."
        />
        <CarteAction
          nombre={nbOffres}
          libelle={accorde(nbOffres, "offre à relire", "offres à relire")}
          href="/admin/offres"
          lignes={offres.map((o) => ({
            id: o.id,
            gauche: (
              <>
                <b>{o.titre}</b>
                {o.deposePar && (
                  <span className="text-ink-soft">
                    {" "}
                    · par {o.deposePar.prenom} {o.deposePar.nom.slice(0, 1)}.
                  </span>
                )}
              </>
            ),
            droite: ilYa(o.creeLe),
          }))}
          vide="Aucune offre à relire."
        />
      </section>

      <nav aria-label="Accès rapides" className="flex flex-wrap gap-2.5">
        {actionsRapides.map(({ href, libelle, icone: Icone, telechargement }) =>
          telechargement ? (
            <a key={href} href={href} download className={buttonClasses("outline", "petit")}>
              <Icone size={15} aria-hidden /> {libelle}
            </a>
          ) : (
            <Link key={href} href={href} className={buttonClasses("outline", "petit")}>
              <Icone size={15} aria-hidden /> {libelle}
            </Link>
          ),
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Panneau
          titre="À contrôler"
          compte={aControler}
          compteAccent
          action={<span className="text-sm text-ink-soft">Ajouts des membres, déjà utilisables</span>}
        >
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              { n: universitesErasmus.length, libelle: accorde(universitesErasmus.length, "université Erasmus", "universités Erasmus"), href: "/admin/etablissements" },
              { n: autresEtablissements.length, libelle: accorde(autresEtablissements.length, "établissement de formation", "établissements de formation"), href: "/admin/etablissements" },
              { n: domainesAControler.length, libelle: accorde(domainesAControler.length, "domaine", "domaines"), href: "/admin/domaines" },
            ].map((t) => (
              <li key={t.libelle}>
                <Link
                  href={t.href}
                  className="group flex h-full items-center gap-3 rounded-abm-md border border-bordeaux-700/10 bg-paper px-4 py-3 transition-colors hover:border-bordeaux-700/40 hover:bg-white"
                >
                  <span className={`font-impact text-3xl leading-none ${t.n > 0 ? "text-bordeaux-700" : "text-bordeaux-300"}`}>{t.n}</span>
                  <span className="text-[13px] leading-tight text-ink-soft">{t.libelle}</span>
                  <ArrowRight size={15} aria-hidden className="fleche ml-auto shrink-0 text-bordeaux-400" />
                </Link>
              </li>
            ))}
          </ul>
          {ajouts.length === 0 ? (
            <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft">
              <Check size={16} aria-hidden className="text-bordeaux-500" /> Rien à contrôler.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-bordeaux-700/10 text-sm">
              {ajouts.map(({ id, icone: Icone, quoi, nom, par, le, href }) => (
                <li key={id} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-abm-sm bg-bordeaux-100 text-bordeaux-700" title={quoi}>
                    <Icone size={16} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="sr-only">{quoi} : </span>
                    <Link href={href} className="font-semibold text-bordeaux-700 hover:underline">
                      {nom}
                    </Link>
                    {par && (
                      <span className="text-ink-soft">
                        {" "}
                        · par {par.prenom} {par.nom.slice(0, 1)}.
                      </span>
                    )}
                  </span>
                  <span className="ml-auto shrink-0 text-[13px] text-ink-soft">{ilYa(le)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau titre="Fiches publiques">
          <p className="flex items-baseline gap-2">
            <span className="font-impact text-4xl leading-none text-bordeaux-700">{fichesPubliques}</span>
            <span className="text-sm text-ink-soft">
              sur {fiches} fiche{fiches > 1 ? "s" : ""} · {partPublique} %
            </span>
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-abm-pill bg-bordeaux-100">
            <div className="h-full rounded-abm-pill bg-[image:var(--degrade-bouton)]" style={{ width: `${partPublique}%` }} />
          </div>
          <p className="mt-3 text-sm text-ink-soft">Visibles sur « Que sont-ils devenus ? », avec l’accord des personnes.</p>
        </Panneau>
      </div>

      <section className="space-y-5">
        <TitreSection>En chiffres</TitreSection>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { nombre: membresActifs, libelle: accorde(membresActifs, "membre actif", "membres actifs") },
            { nombre: fiches, libelle: accorde(fiches, "fiche au total", "fiches au total") },
            { nombre: stages, libelle: accorde(stages, "stage dans l’archive", "stages dans l’archive") },
            { nombre: sejours, libelle: accorde(sejours, "séjour Erasmus", "séjours Erasmus") },
          ].map((c) => (
            <div key={c.libelle} className="flex flex-col-reverse rounded-abm-lg border border-bordeaux-700/15 bg-white px-5 py-4 shadow-abm-card">
              <dt className="mt-1.5 text-sm text-ink-soft">{c.libelle}</dt>
              <dd className="font-impact text-4xl leading-none text-bordeaux-700 tabular-nums">{c.nombre}</dd>
            </div>
          ))}
        </dl>

        {promos.length > 0 && (
          <Panneau titre="Fiches par promotion" action={<span className="text-sm text-ink-soft">Pour savoir qui inviter en priorité</span>}>
            <ul className="space-y-3">
              {promos.map((p) => (
                <li key={p.promo} className="grid grid-cols-[88px_minmax(0,1fr)_64px] items-center gap-3 text-sm sm:grid-cols-[110px_minmax(0,1fr)_80px]">
                  <span>{libellePromo(p.promo)}</span>
                  <span
                    role="img"
                    aria-label={`${p.avecCompte} avec un compte actif, ${p.total - p.avecCompte} sans compte actif`}
                    className="flex h-3.5 overflow-hidden rounded-abm-pill bg-bordeaux-100"
                    style={{ width: `${Math.max(8, (p.total / plusGrande) * 100)}%` }}
                  >
                    <span className="h-full bg-[image:var(--degrade-bouton)]" style={{ width: `${(p.avecCompte / p.total) * 100}%` }} />
                    <span className="rayures-iep h-full flex-1" />
                  </span>
                  <span className="text-right tabular-nums text-ink-soft">
                    {p.avecCompte} / {p.total}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-3 rounded-[3px] bg-bordeaux-700" /> avec un compte actif
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="rayures-iep size-3 rounded-[3px]" /> sans compte actif (à inviter)
              </span>
            </p>
          </Panneau>
        )}
      </section>
    </div>
  );
}

function CarteAction({
  nombre,
  libelle,
  href,
  lignes,
  vide,
}: {
  nombre: number;
  libelle: string;
  href: string;
  lignes: { id: string; gauche: React.ReactNode; droite: string }[];
  vide: string;
}) {
  const calme = nombre === 0;
  return (
    <div
      className={`flex flex-col gap-4 rounded-abm-lg border p-5 sm:p-6 ${
        calme ? "border-bordeaux-700/10 bg-white/60" : `border-bordeaux-700/15 bg-white shadow-abm-card ${classeLisere}`
      }`}
    >
      <p className="flex items-baseline gap-3">
        <span className={`font-impact text-6xl leading-none ${calme ? "text-bordeaux-200" : "text-bordeaux-700"}`}>{nombre}</span>
        <span className={`font-display text-xl font-bold ${calme ? "text-ink-soft" : "text-bordeaux-700"}`}>{libelle}</span>
      </p>
      {calme ? (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Check size={16} aria-hidden className="text-bordeaux-500" /> {vide}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-bordeaux-700/10 border-t border-bordeaux-700/10 text-sm">
            {lignes.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2">
                <span className="min-w-0">{l.gauche}</span>
                <span className="shrink-0 text-[13px] text-ink-soft">{l.droite}</span>
              </li>
            ))}
            {nombre > lignes.length && <li className="py-2 text-[13px] text-ink-soft">et {nombre - lignes.length} autre(s)…</li>}
          </ul>
          <Link href={href} className={`${buttonClasses("primary", "petit")} self-start`}>
            Traiter <ArrowRight size={14} aria-hidden className="fleche" />
          </Link>
        </>
      )}
    </div>
  );
}
