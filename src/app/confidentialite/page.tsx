import type { Metadata } from "next";
import Link from "next/link";
import { PageLegale, TableauLegal, Valeur } from "@/components/page-legale";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment l’association Alumni Bi-Licence Montpellier traite vos données personnelles (RGPD).",
};

const a = site.association;
// Sans adresse e-mail officielle, les demandes passent par le formulaire de contact (transmis au bureau).
const contact = a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : <Link href="/contact?objet=donnees">le formulaire de contact</Link>;

export default function Confidentialite() {
  return (
    <PageLegale
      titre="Politique de confidentialité"
      intro="Ce que nous collectons, pourquoi, qui y a accès et combien de temps, conformément au Règlement général sur la protection des données (RGPD)."
      miseAJour={new Date("2026-10-03T12:00:00Z")}
      sections={[
        {
          id: "responsable",
          titre: "Responsable du traitement",
          contenu: (
            <p>
              {site.nom}, {a.forme.toLowerCase()}, dont le siège est situé{" "}
              <Valeur valeur={a.siege} quoi="adresse du siège" />. Pour toute question sur vos données : {contact}.
            </p>
          ),
        },
        {
          id: "donnees",
          titre: "Données traitées",
          contenu: (
            <TableauLegal
              entetes={["Catégorie", "Données"]}
              lignes={[
                ["Compte", "Prénom, nom, adresse e-mail, promotion, mot de passe (chiffré, jamais stocké en clair), rôle et statut du compte."],
                ["Fiche", "Situation actuelle, ville, domaines, présentation, conseil aux étudiants, formations suivies, séjours Erasmus (université, période, descriptif, retour d’expérience), expériences (structure, poste, dates, missions, façon dont le stage a été obtenu, rapport de stage en PDF)."],
                ["Contact d’un stage", "Si vous choisissez de le partager : fonction et organisme de la personne qui vous a aidé à obtenir le stage ; son nom et son moyen de contact seulement si vous déclarez avoir son accord."],
                ["Coordonnées facultatives", "Profil LinkedIn, e-mail de contact, téléphone : affichés aux membres uniquement si vous l’avez choisi."],
                ["Historique de l’association", "Pour les anciens n’ayant pas encore créé de compte : prénom, nom, promotion, master suivi et, le cas échéant, e-mail, téléphone et ville, repris du fichier de suivi tenu par le bureau."],
                ["Offres et contenus", "Offres de stage ou d’emploi que vous proposez ; pour les membres du bureau, nom, rôle et photo affichés sur la page Bureau."],
                ["Messages de contact", "Nom, e-mail et message envoyés par le formulaire de contact : transmis par e-mail au bureau, jamais enregistrés sur le site."],
                ["Données techniques", "Adresse IP et navigateur associés à vos sessions de connexion, utilisés pour la sécurité."],
              ]}
            />
          ),
        },
        {
          id: "finalites",
          titre: "Finalités et bases légales",
          contenu: (
            <TableauLegal
              entetes={["Pourquoi", "Sur quelle base (article 6 du RGPD)"]}
              lignes={[
                ["Créer et gérer votre compte, valider l’adhésion au réseau", "Exécution de la relation entre vous et l’association (6.1.b)"],
                ["Annuaire et archive des stages réservés aux membres", "Intérêt légitime de l’association à faire vivre le réseau de ses anciens (6.1.f) ; vous choisissez quelles coordonnées sont visibles"],
                ["Page publique « Que sont-ils devenus ? »", "Votre consentement (6.1.a), que vous pouvez retirer à tout moment"],
                ["E-mails de service (confirmation, mot de passe, compte validé, nouvelles offres)", "Exécution de la relation (6.1.b) et intérêt légitime (6.1.f)"],
                ["Sécurité du site (sessions, limitation des tentatives de connexion)", "Intérêt légitime (6.1.f)"],
              ]}
            />
          ),
        },
        {
          id: "destinataires",
          titre: "Qui peut voir vos données",
          contenu: (
            <>
              <TableauLegal
                entetes={["Qui", "Ce qui est visible"]}
                lignes={[
                  ["Le public (sans compte)", "Uniquement si vous l’avez accepté : prénom, nom, promotion, situation, poste ou formation actuelle et structure, ville, domaines, formations, présentation, conseil, Erasmus (université, pays, période, descriptif) et expériences (type, poste, structure, résumé). La carte publique des Erasmus n’affiche que des chiffres anonymes (pays, université, nombre de départs), calculés sur toutes les fiches. Jamais vos coordonnées, le détail de vos stages, vos rapports ni vos contacts."],
                  ["Les membres connectés (comptes validés)", "Votre fiche (situation, formations, stages, domaines) et les seules coordonnées que vous avez rendues visibles ; le contact et le rapport d’un stage seulement si vous avez choisi de les partager. Tant que votre compte n’est pas validé, votre fiche n’est visible de personne d’autre que le bureau."],
                  ["Le bureau (administrateurs)", "L’ensemble des données, pour valider les comptes, modérer les offres et tenir les fiches à jour."],
                ]}
              />
              <p>
                Prestataires techniques, qui agissent uniquement sur instruction de l’association : <strong>{site.hebergeur.nom}</strong>{" "}
                ({site.hebergeur.adresse}) pour l’hébergement du site et de la base de données (serveur situé :{" "}
                <Valeur valeur={site.hebergeur.localisationServeur} quoi="pays du centre de données" />) ;{" "}
                <strong>{site.emailing.nom}</strong> ({site.emailing.adresse}) pour l’envoi des e-mails.
              </p>
              <p>Vos données ne sont ni vendues, ni louées, ni cédées à des tiers, ni utilisées à des fins publicitaires.</p>
            </>
          ),
        },
        {
          id: "conservation",
          titre: "Durées de conservation",
          contenu: (
            <ul>
              <li>
                <strong>Compte et fiche</strong> : tant que votre compte existe. La suppression depuis « Mon compte » efface
                immédiatement et définitivement le compte, la fiche, les formations et les stages.
              </li>
              <li>
                <strong>Fiches issues de l’historique</strong> : conservées tant que la personne ne s’y oppose pas ; jamais
                publiques sans son accord.
              </li>
              <li>
                <strong>Inscriptions non confirmées</strong> : supprimées automatiquement 30 jours après l’inscription si
                l’adresse e-mail n’a pas été confirmée.
              </li>
              <li>
                <strong>Sessions de connexion</strong> : 7 jours, renouvelés lorsque vous utilisez le site.
              </li>
              <li>
                <strong>Offres</strong> : jusqu’à leur suppression par le bureau. Si vous supprimez votre compte, les offres que
                vous avez proposées restent publiées sans votre nom.
              </li>
              <li>
                <strong>Sauvegardes</strong> : copies techniques de la base, renouvelées automatiquement.
              </li>
            </ul>
          ),
        },
        {
          id: "securite",
          titre: "Sécurité",
          contenu: (
            <p>
              Mots de passe chiffrés (algorithme scrypt), connexion chiffrée (HTTPS), vérification de l’adresse e-mail,
              validation manuelle de chaque compte par le bureau, limitation des tentatives de connexion, accès à
              l’administration réservé au bureau, sauvegardes régulières de la base de données.
            </p>
          ),
        },
        {
          id: "droits",
          titre: "Vos droits",
          contenu: (
            <>
              <p>
                Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de
                portabilité de vos données, ainsi que du droit de retirer votre consentement à tout moment et de définir
                des directives sur le sort de vos données après votre décès.
              </p>
              <p>
                La plupart s’exercent directement depuis votre espace : voir la page{" "}
                <Link href="/vos-donnees">Vos données</Link>. Sinon, écrivez à {contact} ; nous répondons dans un délai
                d’un mois.
              </p>
              <p>
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
                  cnil.fr
                </a>
                , 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07).
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          titre: "Cookies",
          contenu: (
            <p>
              Un seul cookie est utilisé : le cookie de session de l’espace membres, strictement nécessaire à la
              connexion (exempté de consentement). Aucun outil de mesure d’audience ni de publicité. Les polices de
              caractères sont servies par notre propre serveur : aucune donnée n’est transmise à Google lors de votre
              visite.
            </p>
          ),
        },
        {
          id: "modifications",
          titre: "Modifications",
          contenu: (
            <p>
              Cette politique peut évoluer avec le site. La date de mise à jour figure dans le sommaire ; en cas de
              changement important, les membres en sont informés par e-mail.
            </p>
          ),
        },
      ]}
    />
  );
}
