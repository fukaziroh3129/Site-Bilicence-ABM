import type { Metadata } from "next";
import Link from "next/link";
import { PageLegale, Valeur } from "@/components/page-legale";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergeur et conditions d’utilisation du site de l’association Alumni Bi-Licence Montpellier.",
};

const a = site.association;

export default function MentionsLegales() {
  return (
    <PageLegale
      titre="Mentions légales"
      intro="Informations prévues par la loi pour la confiance dans l’économie numérique (LCEN, article 6)."
      miseAJour={new Date("2026-10-03T12:00:00Z")}
      sections={[
        {
          id: "editeur",
          titre: "Éditeur du site",
          contenu: (
            <ul>
              <li>
                <strong>{site.nom}</strong> ({site.sigle}), {a.forme}
              </li>
              <li>
                Siège social : <Valeur valeur={a.siege} quoi="adresse du siège (statuts)" />
              </li>
              <li>
                Numéro RNA : <Valeur valeur={a.rna} quoi="numéro RNA (récépissé de déclaration)" />
              </li>
              <li>
                Contact : {a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : <Link href="/contact">formulaire de contact</Link>}
              </li>
            </ul>
          ),
        },
        {
          id: "publication",
          titre: "Directeur de la publication",
          contenu: <p>{a.directeurPublication}.</p>,
        },
        {
          id: "hebergeur",
          titre: "Hébergeur",
          contenu: (
            <ul>
              <li>
                <strong>{site.hebergeur.nom}</strong>
              </li>
              <li>{site.hebergeur.adresse}</li>
              <li>
                <a href={site.hebergeur.site} target="_blank" rel="noopener noreferrer">
                  {site.hebergeur.site.replace("https://", "")}
                </a>
              </li>
            </ul>
          ),
        },
        {
          id: "conception",
          titre: "Conception et réalisation",
          contenu: (
            <p>
              Site conçu et développé par le pôle Technique de l’association, à partir de la charte
              graphique ABM. Polices de caractères sous licence libre SIL Open Font License (Playfair
              Display, Anton, Great Vibes, Source Sans 3), hébergées sur nos propres serveurs ;
              pictogrammes Lucide (licence ISC).
            </p>
          ),
        },
        {
          id: "propriete",
          titre: "Propriété intellectuelle",
          contenu: (
            <>
              <p>
                Le nom, le sceau et la charte graphique de l’association, ainsi que les textes et photographies
                publiés sur ce site, sont la propriété de l’association ou de leurs auteurs. Toute reproduction
                ou réutilisation, totale ou partielle, sans autorisation écrite préalable est interdite.
              </p>
              <p>
                Les informations figurant dans l’annuaire et l’archive des stages sont réservées aux membres et
                ne peuvent être extraites, copiées en masse ni utilisées à des fins commerciales ou de
                prospection.
              </p>
            </>
          ),
        },
        {
          id: "donnees",
          titre: "Données personnelles",
          contenu: (
            <p>
              Le traitement des données personnelles est décrit dans la{" "}
              <Link href="/confidentialite">politique de confidentialité</Link>. Pour exercer vos droits
              (accès, rectification, suppression…), consultez la page{" "}
              <Link href="/vos-donnees">Vos données</Link>.
            </p>
          ),
        },
        {
          id: "cookies",
          titre: "Cookies",
          contenu: (
            <p>
              Le site n’utilise qu’un cookie strictement nécessaire : le cookie de session, déposé lorsque vous
              vous connectez à l’espace membres. Aucun cookie publicitaire ni de mesure d’audience n’est
              utilisé ; c’est pourquoi aucun bandeau de consentement n’est affiché.
            </p>
          ),
        },
        {
          id: "liens",
          titre: "Liens vers d’autres sites",
          contenu: (
            <p>
              Le site renvoie vers des services tiers (HelloAsso pour la boutique, Instagram, LinkedIn, Google Agenda,
              offres publiées par des structures extérieures). L’association n’est pas responsable de leur
              contenu ni de leur politique de confidentialité. La page Boutique affiche des modules fournis par
              HelloAsso&nbsp;: les commandes et les paiements y sont traités par HelloAsso, selon ses propres
              conditions.
            </p>
          ),
        },
      ]}
    />
  );
}
