import { Download, Eye, EyeOff, Mail, PenLine, ShieldCheck, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ElementGroupe, Groupe, Ornement } from "@/components/anime";
import { TableauLegal } from "@/components/page-legale";
import { PageHeader, classeLien } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vos données (RGPD)",
  description: "Consulter, corriger, télécharger ou supprimer vos données personnelles sur le site ABM.",
};

const droits = [
  {
    icone: Eye,
    titre: "Consulter vos données",
    texte: "Voir votre fiche telle que les autres membres la voient.",
    action: { href: "/espace/ma-fiche", libelle: "Ma fiche" },
  },
  {
    icone: PenLine,
    titre: "Les corriger",
    texte: "Modifier à tout moment votre situation, vos formations, vos stages et vos coordonnées.",
    action: { href: "/espace/ma-fiche", libelle: "Modifier ma fiche" },
  },
  {
    icone: Download,
    titre: "Les télécharger",
    texte: "Récupérer l’ensemble de vos données dans un fichier (droit d’accès et de portabilité).",
    action: { href: "/espace/compte/donnees", libelle: "Télécharger mes données", telechargement: true },
  },
  {
    icone: EyeOff,
    titre: "Retirer votre accord",
    texte: "Décocher l’affichage sur la page publique « Que sont-ils devenus ? » : effet immédiat.",
    action: { href: "/espace/ma-fiche", libelle: "Gérer la visibilité" },
  },
  {
    icone: Trash2,
    titre: "Tout supprimer",
    texte: "Supprimer définitivement votre compte, votre fiche, vos formations et vos stages.",
    action: { href: "/espace/compte", libelle: "Mon compte" },
  },
];

export default function VosDonnees() {
  const email = site.association.email;

  return (
    <>
      <PageHeader
        eyebrow="RGPD"
        title="Vos données, vos choix"
        lead="Vos informations vous appartiennent. Voici ce que vous pouvez faire, en quelques clics, depuis votre espace."
      />

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-20">
        <Groupe className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {droits.map(({ icone: Icone, titre, texte, action }) => (
            <ElementGroupe key={titre} className="carte-premium cadre-fin flex flex-col rounded-abm-md border border-bordeaux-700/20 bg-white p-7">
              <span className="flex size-11 items-center justify-center rounded-full bg-bordeaux-100 text-bordeaux-700">
                <Icone size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-bordeaux-700">{titre}</h2>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{texte}</p>
              {"telechargement" in action ? (
                <a href={action.href} download className={`mt-5 text-sm font-semibold ${classeLien}`}>
                  {action.libelle}
                </a>
              ) : (
                <Link href={action.href} className={`mt-5 text-sm font-semibold ${classeLien}`}>
                  {action.libelle}
                </Link>
              )}
            </ElementGroupe>
          ))}

          <ElementGroupe className="fond-bordeaux cadre-fin flex flex-col rounded-abm-md p-7">
            <Mail size={22} strokeWidth={1.5} aria-hidden className="text-white/80" />
            <h2 className="mt-4 font-display text-xl font-bold">Pas de compte&nbsp;?</h2>
            <p className="mt-2 flex-1 text-sm text-white/80">
              Vous figurez peut-être dans l’annuaire grâce au fichier historique de l’association. Pour consulter,
              corriger ou supprimer ces informations, écrivez-nous.
            </p>
            <p className="mt-5 text-sm font-semibold">
              {email ? (
                <a href={`mailto:${email}`} className="underline underline-offset-4">
                  {email}
                </a>
              ) : (
                <Link href="/contact?objet=donnees" className="underline underline-offset-4">
                  Écrire au bureau
                </Link>
              )}
            </p>
          </ElementGroupe>
        </Groupe>

        <Ornement className="py-16" />

        <section className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-bordeaux-700">Qui voit quoi</h2>
          <TableauLegal
            entetes={["", "Public", "Membres connectés", "Bureau"]}
            lignes={[
              ["Nom, promotion, formations, situation", "Seulement avec votre accord", "Oui", "Oui"],
              ["Stages et retours d’expérience", "Non", "Oui", "Oui"],
              ["E-mail, téléphone, LinkedIn", "Jamais", "Seulement ceux que vous cochez", "Oui"],
              ["Adresse e-mail de connexion", "Jamais", "Jamais", "Oui"],
            ]}
          />
          <p className="flex items-start gap-3 text-sm text-ink-soft">
            <ShieldCheck size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-bordeaux-700" aria-hidden />
            <span>
              Aucune donnée n’est vendue ni utilisée à des fins publicitaires. Le détail complet figure dans la{" "}
              <Link href="/confidentialite" className={classeLien}>
                politique de confidentialité
              </Link>
              .
            </span>
          </p>
        </section>
      </div>
    </>
  );
}
