// Contenu détaillé d'une expérience (stage, alternance…) : fenêtre « Voir le détail » de l'archive
// des stages et fiches de l'annuaire. Membres connectés uniquement. Le contact et le rapport ne
// s'affichent que si l'auteur a choisi de les partager (le nom du contact, seulement avec son accord).

import { CalendarRange, Download, GraduationCap, MapPin, Tags, UserRound } from "lucide-react";
import type { Experience } from "@/generated/prisma/client";
import { LIBELLES_NIVEAU, moisAnnee } from "@/lib/format";

type ExperienceDetaillee = Pick<
  Experience,
  | "id"
  | "ville"
  | "debut"
  | "fin"
  | "niveau"
  | "resume"
  | "missions"
  | "obtention"
  | "partagerContact"
  | "contactFonction"
  | "contactAccord"
  | "contactNom"
  | "contactMoyen"
  | "rapportFichier"
  | "partagerRapport"
>;

/** Le moyen de contact devient un lien quand c'est une adresse e-mail ou une adresse web. */
function LienContact({ valeur }: { valeur: string }) {
  const classe = "text-bordeaux-700 underline underline-offset-4 hover:text-bordeaux-500";
  if (/^\S+@\S+\.\S+$/.test(valeur)) return <a href={`mailto:${valeur}`} className={classe}>{valeur}</a>;
  if (/^https?:\/\/\S+$/.test(valeur)) {
    return (
      <a href={valeur} target="_blank" rel="noopener noreferrer" className={classe}>
        {valeur}
      </a>
    );
  }
  return <span>{valeur}</span>;
}

/** Le contact et le rapport sont-ils visibles pour ce lecteur ? (`voitTout` : auteur ou bureau) */
export function partages(e: ExperienceDetaillee, voitTout = false) {
  return {
    contact: (e.partagerContact || voitTout) && !!(e.contactFonction || e.contactNom),
    rapport: !!e.rapportFichier && (e.partagerRapport || voitTout),
  };
}

export function LienRapport({ id, className }: { id: string; className: string }) {
  return (
    <a href={`/espace/rapports/${id}`} className={className}>
      <Download size={16} aria-hidden /> Télécharger le rapport de stage (PDF)
    </a>
  );
}

export function DetailExperience({
  e,
  domaines,
  voitTout = false,
  avecRapport = true,
  avecInfos = true,
}: {
  e: ExperienceDetaillee;
  /** Libellés des domaines, déjà traduits. */
  domaines: string[];
  voitTout?: boolean;
  /** false quand le lien du rapport est déjà affiché ailleurs (pied de la fenêtre). */
  avecRapport?: boolean;
  /** false quand ville, dates et domaines sont déjà affichés juste au-dessus. */
  avecInfos?: boolean;
}) {
  const visible = partages(e, voitTout);
  const infos = [
    e.ville && { icone: MapPin, libelle: "Ville", valeur: e.ville },
    (e.debut || e.fin) && {
      icone: CalendarRange,
      libelle: "Dates",
      valeur: [e.debut ? `Début : ${moisAnnee(e.debut)}` : null, e.fin ? `fin : ${moisAnnee(e.fin)}` : null].filter(Boolean).join(" · "),
    },
    e.niveau && { icone: GraduationCap, libelle: "Effectué en", valeur: LIBELLES_NIVEAU[e.niveau] },
    domaines.length > 0 && { icone: Tags, libelle: domaines.length > 1 ? "Domaines" : "Domaine", valeur: domaines.join(", ") },
  ].filter((x) => !!x);

  return (
    <div className="space-y-7">
      {avecInfos && infos.length > 0 && (
        <dl className="grid gap-3 sm:grid-cols-2">
          {infos.map(({ icone: Icone, libelle, valeur }) => (
            <div key={libelle} className="flex items-start gap-3 rounded-abm-sm border border-bordeaux-700/10 bg-white px-3 py-2.5">
              <Icone size={17} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
              <div>
                <dt className="eyebrow text-[0.68rem] text-ink-soft">{libelle}</dt>
                <dd className="text-sm">{valeur}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}

      {e.resume && (
        <section>
          <h3 className="eyebrow text-bordeaux-500">En bref</h3>
          <p className="mt-2 font-display text-lg italic leading-snug text-ink">{e.resume}</p>
        </section>
      )}

      {e.missions && (
        <section>
          <h3 className="eyebrow text-bordeaux-500">Missions principales et déroulé</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{e.missions}</p>
        </section>
      )}

      {e.obtention && (
        <section className="rounded-abm-md border-l-2 border-bordeaux-700 bg-white p-5">
          <h3 className="eyebrow text-bordeaux-500">Comment j’ai obtenu ce stage</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{e.obtention}</p>
        </section>
      )}

      {visible.contact && (
        <section className="flex items-start gap-3 rounded-abm-md bg-bordeaux-100/60 p-4">
          <UserRound size={20} aria-hidden className="mt-0.5 shrink-0 text-bordeaux-700" />
          <div className="text-sm">
            <h3 className="eyebrow text-bordeaux-500">Contact</h3>
            <p className="mt-1">
              {e.contactAccord && e.contactNom && <strong>{e.contactNom}</strong>}
              {e.contactAccord && e.contactNom && e.contactFonction && ", "}
              {e.contactFonction}
            </p>
            {e.contactAccord && e.contactMoyen && (
              <p className="mt-1">
                <LienContact valeur={e.contactMoyen} />
              </p>
            )}
            {!e.partagerContact && <p className="mt-1 text-xs text-ink-soft">Non partagé : visible de vous et du bureau seulement.</p>}
          </div>
        </section>
      )}

      {avecRapport && visible.rapport && (
        <LienRapport id={e.id} className="inline-flex items-center gap-2 text-sm font-semibold text-bordeaux-700 underline underline-offset-4 hover:text-bordeaux-500" />
      )}

      {!e.resume && !e.missions && !e.obtention && !visible.contact && !visible.rapport && (
        <p className="text-sm italic text-ink-soft">Pas encore de détail pour cette expérience.</p>
      )}
    </div>
  );
}
