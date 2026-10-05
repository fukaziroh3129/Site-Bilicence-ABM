// Export des événements vers les agendas (Google Agenda, Apple, Outlook…).
import type { Article } from "@/generated/prisma/client";
import { adresseSite } from "@/lib/email";

/** Publication de type événement (sa date de début est alors toujours renseignée). */
export type Evenement = Article & { debut: Date };

/** Vrai si la publication est un événement daté. */
export function estEvenement(a: Article): a is Evenement {
  return a.type === "EVENEMENT" && a.debut !== null;
}

/** Durée par défaut d'un événement sans heure de fin. */
const DUREE_PAR_DEFAUT = 2 * 60 * 60 * 1000;

/** Date au format des agendas : 20261212T173000Z */
function formatAgenda(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function fin(e: Evenement) {
  return e.fin ?? new Date(e.debut.getTime() + DUREE_PAR_DEFAUT);
}

/** Adresse de la page de l'événement sur le site. */
function page(e: Evenement) {
  return adresseSite(`/actualites/${e.slug}`);
}

/** Texte joint à l'événement dans l'agenda : le chapô, sinon le texte. */
function resume(e: Evenement) {
  return e.chapo ?? e.contenu;
}

/** Lien « Ajouter à Google Agenda ». */
export function lienGoogleAgenda(e: Evenement) {
  const parametres = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titre,
    dates: `${formatAgenda(e.debut)}/${formatAgenda(fin(e))}`,
    details: [resume(e), page(e)].filter(Boolean).join("\n\n"),
    location: e.lieu ?? "",
  });
  return `https://calendar.google.com/calendar/render?${parametres}`;
}

function echapper(texte: string) {
  return texte.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fichier .ics d'un événement (s'ouvre dans n'importe quel agenda). */
export function fichierIcs(e: Evenement) {
  const texte = resume(e);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ABM//Site bilicence//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@bilicence.fr`,
    `DTSTAMP:${formatAgenda(new Date())}`,
    `DTSTART:${formatAgenda(e.debut)}`,
    `DTEND:${formatAgenda(fin(e))}`,
    `SUMMARY:${echapper(e.titre)}`,
    e.lieu ? `LOCATION:${echapper(e.lieu)}` : null,
    texte ? `DESCRIPTION:${echapper(texte)}` : null,
    `URL:${page(e)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
