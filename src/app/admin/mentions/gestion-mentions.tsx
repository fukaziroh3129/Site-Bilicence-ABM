"use client";

// Écran de gestion des mentions de master et des grands domaines d'études (/admin/mentions).
// Chaque modification passe par une fenêtre qui dit « ce qui va changer » avant de confirmer ; un
// message (lu par les lecteurs d'écran) confirme ensuite le changement.

import { Check, GitMerge, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  classerFormation,
  creerFamille,
  creerMention,
  fusionnerFamille,
  fusionnerMention,
  modifierMention,
  relancerDetection,
  renommerFamille,
  supprimerFamille,
  supprimerMention,
} from "@/actions/mentions";
import { Fenetre } from "@/components/fenetre/fenetre";
import { Champ, ZoneTexte } from "@/components/formulaire";
import { Panneau, Pastille, buttonClasses, classeLien, classeLisere, classeSaisie } from "@/components/ui";
import type { EtatFormulaire } from "@/lib/formulaire";
import { LIBELLES_METHODE, cleTexte, couleurFamille, detecterMention, estBiLicence } from "@/lib/mentions";

type MentionAdmin = { id: string; libelle: string; variantes: string[]; familleId: string; nbFormations: number };
type FamilleAdmin = { id: string; libelle: string; mentions: MentionAdmin[] };
type FormationAClasser = {
  id: string;
  intitule: string;
  parcours: string | null;
  etablissement: string;
  mentionId: string | null;
  choisieParMembre: boolean;
  personne: { id: string; nom: string; promo: string };
};

type Ouverture =
  | { type: "ajouter-famille" }
  | { type: "renommer-famille"; famille: FamilleAdmin }
  | { type: "fusionner-famille"; famille: FamilleAdmin }
  | { type: "supprimer-famille"; famille: FamilleAdmin }
  | { type: "ajouter-mention"; libelle?: string }
  | { type: "modifier-mention"; mention: MentionAdmin }
  | { type: "fusionner-mention"; mention: MentionAdmin }
  | { type: "supprimer-mention"; mention: MentionAdmin };

const formations = (n: number) => `${n} formation${n > 1 ? "s" : ""}`;
const classeBoutonAction =
  "inline-flex min-h-9 items-center gap-1.5 rounded-abm-sm border border-bordeaux-700/30 bg-white px-3 py-1.5 text-sm font-semibold text-bordeaux-700 transition-colors hover:border-bordeaux-700 hover:bg-bordeaux-100";
const classeBoutonDanger =
  "inline-flex min-h-9 items-center gap-1.5 rounded-abm-sm border border-bordeaux-500/60 bg-white px-3 py-1.5 text-sm font-semibold text-bordeaux-500 transition-colors hover:bg-bordeaux-500 hover:text-white";

function Envoyer({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses(danger ? "danger" : "primary", "petit")}>
      {pending ? "Enregistrement…" : children}
    </button>
  );
}

/** Encadré « Ce qui va changer », affiché dans les fenêtres avant de confirmer. */
function Impact({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-abm-sm bg-bordeaux-100 px-4 py-3 text-sm text-ink" aria-live="polite">
      <b className="text-bordeaux-700">Ce qui va changer : </b>
      {children}
    </p>
  );
}

function MenuFamilles({ id, valeur, onChange, familles, exclure, libelle, etat }: {
  id: string;
  valeur: string;
  onChange: (v: string) => void;
  familles: FamilleAdmin[];
  exclure?: string;
  libelle: string;
  etat: EtatFormulaire;
}) {
  const erreur = etat?.erreurs?.[id];
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {libelle} <span className="text-bordeaux-500">*</span>
      </label>
      <select id={id} name={id} value={valeur} onChange={(e) => onChange(e.target.value)} required aria-invalid={erreur ? true : undefined} className={`${classeSaisie} mt-1`}>
        <option value="">— Choisir —</option>
        {familles
          .filter((f) => f.id !== exclure)
          .map((f) => (
            <option key={f.id} value={f.id}>
              {f.libelle}
            </option>
          ))}
      </select>
      {erreur && <p className="mt-1 text-sm font-semibold text-bordeaux-500">{erreur}</p>}
    </div>
  );
}

function OptionsMentions({ familles, exclure }: { familles: FamilleAdmin[]; exclure?: string }) {
  return (
    <>
      {familles
        .filter((f) => f.mentions.some((m) => m.id !== exclure))
        .map((f) => (
          <optgroup key={f.id} label={f.libelle}>
            {f.mentions
              .filter((m) => m.id !== exclure)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.libelle}
                </option>
              ))}
          </optgroup>
        ))}
    </>
  );
}

/** Formulaire d'une fenêtre : appelle l'action, puis ferme la fenêtre et annonce le résultat. */
function FormulaireFenetre({
  action,
  onSucces,
  onAnnuler,
  bouton,
  danger,
  children,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  onSucces: (message: string) => void;
  onAnnuler: () => void;
  bouton: string;
  danger?: boolean;
  children: (etat: EtatFormulaire) => React.ReactNode;
}) {
  const [etat, envoyer] = useActionState(action, null);
  useEffect(() => {
    if (etat?.succes) onSucces(etat.succes);
  }, [etat, onSucces]);
  return (
    <form action={envoyer} className="space-y-5">
      {etat?.erreur && !etat.erreurs && (
        <p role="alert" className="text-sm font-semibold text-bordeaux-500">
          {etat.erreur}
        </p>
      )}
      {children(etat)}
      <div className="flex flex-wrap justify-end gap-3 border-t border-bordeaux-700/10 pt-4">
        <button type="button" onClick={onAnnuler} className={buttonClasses("outline", "petit")}>
          Annuler
        </button>
        <Envoyer danger={danger}>{bouton}</Envoyer>
      </div>
    </form>
  );
}

// ─── Contenu des fenêtres ──────────────────────────────────────────────────────

function FenetreFamille({ famille, ...p }: { famille?: FamilleAdmin; onSucces: (m: string) => void; onAnnuler: () => void }) {
  return (
    <FormulaireFenetre action={famille ? renommerFamille : creerFamille} bouton={famille ? "Renommer" : "Ajouter"} {...p}>
      {(etat) => (
        <>
          {famille && <input type="hidden" name="id" value={famille.id} />}
          <Champ
            nom="libelle"
            libelle="Nom du grand domaine d’études"
            requis
            maxLength={80}
            defaultValue={famille?.libelle}
            aide={famille ? "Le nouveau nom apparaîtra partout : statistiques, filtres, fiches." : "Ex. « Santé publique & social ». Vous y rangerez ensuite des mentions."}
            etat={etat}
          />
        </>
      )}
    </FormulaireFenetre>
  );
}

function FenetreFusionFamille({ famille, familles, ...p }: { famille: FamilleAdmin; familles: FamilleAdmin[]; onSucces: (m: string) => void; onAnnuler: () => void }) {
  const [cible, setCible] = useState("");
  const nom = familles.find((f) => f.id === cible)?.libelle;
  const total = famille.mentions.reduce((t, m) => t + m.nbFormations, 0);
  return (
    <FormulaireFenetre action={fusionnerFamille} bouton="Fusionner" {...p}>
      {(etat) => (
        <>
          <input type="hidden" name="id" value={famille.id} />
          <p className="text-sm text-ink-soft">
            À utiliser quand deux grands domaines se recouvrent. Toutes les mentions de « {famille.libelle} » seront déplacées dans
            le grand domaine choisi, puis « {famille.libelle} » sera supprimé.
          </p>
          <MenuFamilles id="cibleId" libelle="Déplacer ses mentions vers" valeur={cible} onChange={setCible} familles={familles} exclure={famille.id} etat={etat} />
          <Impact>
            {nom &&
              `${famille.mentions.length} mention${famille.mentions.length > 1 ? "s" : ""} (${famille.mentions.map((m) => m.libelle).join(", ")}), soit ${formations(total)}, passeront dans « ${nom} ».`}
          </Impact>
        </>
      )}
    </FormulaireFenetre>
  );
}

function FenetreSuppression({ id, texte, action, ...p }: {
  id: string;
  texte: string;
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  onSucces: (m: string) => void;
  onAnnuler: () => void;
}) {
  return (
    <FormulaireFenetre action={action} bouton="Supprimer" danger {...p}>
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <p className="text-ink">{texte}</p>
        </>
      )}
    </FormulaireFenetre>
  );
}

function FenetreMention({ mention, libelleInitial, familles, ...p }: {
  mention?: MentionAdmin;
  libelleInitial?: string;
  familles: FamilleAdmin[];
  onSucces: (m: string) => void;
  onAnnuler: () => void;
}) {
  const [libelle, setLibelle] = useState(mention?.libelle ?? libelleInitial ?? "");
  const [famille, setFamille] = useState(mention?.familleId ?? "");
  const nouvelleFamille = familles.find((f) => f.id === famille)?.libelle;
  const changements: string[] = [];
  if (mention && famille && famille !== mention.familleId && nouvelleFamille)
    changements.push(
      `${mention.nbFormations > 1 ? `Les ${mention.nbFormations} formations de cette mention passeront` : mention.nbFormations ? "La formation de cette mention passera" : "La mention passera"} dans « ${nouvelleFamille} » dans tous les graphiques.`,
    );
  if (mention && libelle.trim() && cleTexte(libelle) !== cleTexte(mention.libelle))
    changements.push(`L’ancien nom « ${mention.libelle} » restera reconnu comme variante.`);
  return (
    <FormulaireFenetre action={mention ? modifierMention : creerMention} bouton={mention ? "Enregistrer" : "Ajouter"} {...p}>
      {(etat) => (
        <>
          {mention && <input type="hidden" name="id" value={mention.id} />}
          <Champ
            nom="libelle"
            libelle="Nom de la mention"
            requis
            maxLength={120}
            defaultValue={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            aide="Le nom officiel, ex. « Science politique »."
            etat={etat}
          />
          <MenuFamilles id="familleId" libelle="Grand domaine d’études" valeur={famille} onChange={setFamille} familles={familles} etat={etat} />
          <ZoneTexte
            nom="variantes"
            libelle="Autres écritures à reconnaître"
            rows={5}
            maxLength={3000}
            defaultValue={mention?.variantes.join("\n")}
            aide="Une par ligne, ex. « RI » ou « relations int ». Majuscules, accents et mots comme « Master » ou « M2 » sont ignorés."
            etat={etat}
          />
          <Impact>{changements.join(" ")}</Impact>
        </>
      )}
    </FormulaireFenetre>
  );
}

function FenetreFusionMention({ mention, familles, ...p }: { mention: MentionAdmin; familles: FamilleAdmin[]; onSucces: (m: string) => void; onAnnuler: () => void }) {
  const [cible, setCible] = useState("");
  const nom = familles.flatMap((f) => f.mentions).find((m) => m.id === cible)?.libelle;
  return (
    <FormulaireFenetre action={fusionnerMention} bouton="Fusionner" {...p}>
      {(etat) => (
        <>
          <input type="hidden" name="id" value={mention.id} />
          <p className="text-sm text-ink-soft">
            À utiliser quand deux mentions désignent la même formation. Les formations de « {mention.libelle} » seront rattachées à
            la mention choisie, puis « {mention.libelle} » sera supprimée.
          </p>
          <div>
            <label htmlFor="cibleId" className="block text-sm font-semibold text-ink">
              Rattacher à la mention <span className="text-bordeaux-500">*</span>
            </label>
            <select id="cibleId" name="cibleId" value={cible} onChange={(e) => setCible(e.target.value)} required className={`${classeSaisie} mt-1`}>
              <option value="">— Choisir —</option>
              <OptionsMentions familles={familles} exclure={mention.id} />
            </select>
            {etat?.erreurs?.cibleId && <p className="mt-1 text-sm font-semibold text-bordeaux-500">{etat.erreurs.cibleId}</p>}
          </div>
          <Impact>
            {nom &&
              `${formations(mention.nbFormations)} ${mention.nbFormations > 1 ? "rejoindront" : "rejoindra"} « ${nom} ». « ${mention.libelle} »${
                mention.variantes.length ? ` et ses variantes (${mention.variantes.join(", ")})` : ""
              } deviendront des variantes de « ${nom} », pour que la détection continue de les reconnaître.`}
          </Impact>
        </>
      )}
    </FormulaireFenetre>
  );
}

// ─── Formations à classer ──────────────────────────────────────────────────────

function LigneAClasser({ f, familles, action, onNouvelle }: {
  f: FormationAClasser;
  familles: FamilleAdmin[];
  action: (formData: FormData) => void;
  onNouvelle: (libelle: string) => void;
}) {
  const [choix, setChoix] = useState(f.mentionId ?? "");
  const variante = f.intitule.replace(/^\s*(master|msc|m1|m2|ma)\b[\s:–-]*/i, "").trim() || f.intitule;
  return (
    <li className={`grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] ${classeLisere}`}>
      <div className="min-w-0">
        <p className="font-semibold text-ink">« {f.intitule} »</p>
        <p className="text-sm text-ink-soft">{[f.parcours, f.etablissement].filter(Boolean).join(" · ")}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/admin/personnes/${f.personne.id}`} className={classeLien}>
            {f.personne.nom}
          </Link>
          <span className="text-ink-soft">promotion {f.personne.promo}</span>
          <Pastille accent={!f.choisieParMembre}>{f.choisieParMembre ? "Choisie par le membre" : "Non reconnue"}</Pastille>
        </p>
      </div>
      <form action={action} className="space-y-2">
        <input type="hidden" name="formationId" value={f.id} />
        <label htmlFor={`classer-${f.id}`} className="block text-sm font-semibold text-ink">
          Mention
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id={`classer-${f.id}`}
            name="mentionId"
            value={choix}
            required
            onChange={(e) => {
              if (e.target.value === "__nouvelle") onNouvelle(variante);
              else setChoix(e.target.value);
            }}
            className={`${classeSaisie} w-auto min-w-0 flex-1 text-sm`}
          >
            <option value="">— Choisir —</option>
            <OptionsMentions familles={familles} />
            <option value="__nouvelle">+ Créer une nouvelle mention…</option>
          </select>
          <Envoyer>{f.choisieParMembre ? "Valider" : "Classer"}</Envoyer>
        </div>
        <label className="flex items-start gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="retenir" defaultChecked={!f.choisieParMembre} className="mt-1 size-4 accent-bordeaux-700" />
          <span>
            Retenir « {variante} » comme variante : la détection reconnaîtra cette écriture la prochaine fois.
          </span>
        </label>
      </form>
    </li>
  );
}

// ─── Écran complet ─────────────────────────────────────────────────────────────

export function GestionMentions({ familles, aClasser }: { familles: FamilleAdmin[]; aClasser: FormationAClasser[] }) {
  const [ouvert, setOuvert] = useState<Ouverture | null>(null);
  const [annonce, setAnnonce] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [essai, setEssai] = useState("");
  // Classement et relance de la détection : le résultat s'affiche dans le message de confirmation.
  const [, classer] = useActionState(async (etat: EtatFormulaire, formData: FormData) => {
    const r = await classerFormation(etat, formData);
    setAnnonce(r?.succes ?? r?.erreur ?? null);
    return r;
  }, null);
  const [, relancer] = useActionState(async () => {
    const r = await relancerDetection();
    setAnnonce(r?.succes ?? r?.erreur ?? null);
    return r;
  }, null);

  const fermer = () => setOuvert(null);
  const reussi = useCallback((message: string) => {
    setOuvert(null);
    setAnnonce(message);
  }, []);

  const toutes = familles.flatMap((f) => f.mentions);
  const q = cleTexte(recherche);
  const correspond = (m: MentionAdmin) => !q || [m.libelle, ...m.variantes].some((x) => cleTexte(x).includes(q));
  const resultatEssai = essai.trim() ? detecterMention(essai, null, toutes) : null;
  const mentionEssai = resultatEssai && toutes.find((m) => m.id === resultatEssai.mentionId);
  const familleEssai = mentionEssai && familles.find((f) => f.id === mentionEssai.familleId);

  const titres: Record<Ouverture["type"], string> = {
    "ajouter-famille": "Ajouter un grand domaine d’études",
    "renommer-famille": "Renommer un grand domaine",
    "fusionner-famille": "Fusionner un grand domaine",
    "supprimer-famille": "Supprimer un grand domaine",
    "ajouter-mention": "Ajouter une mention",
    "modifier-mention": "Modifier une mention",
    "fusionner-mention": "Fusionner une mention",
    "supprimer-mention": "Supprimer une mention",
  };
  const sujet = ouvert && "famille" in ouvert ? ouvert.famille.libelle : ouvert && "mention" in ouvert ? ouvert.mention.libelle : null;
  const commun = { onSucces: reussi, onAnnuler: fermer };

  return (
    <div className="space-y-8">
      <nav aria-label="Sections de la page" className="flex flex-wrap gap-2">
        {[
          ["#a-classer", `À classer (${aClasser.length})`],
          ["#grands-domaines", "Grands domaines d’études"],
          ["#mentions", "Mentions"],
          ["#tester", "Tester une écriture"],
        ].map(([href, libelle]) => (
          <a key={href} href={href} className="rounded-abm-pill border border-bordeaux-700/25 bg-white px-3 py-1.5 text-sm font-semibold text-bordeaux-700 hover:bg-bordeaux-100">
            {libelle}
          </a>
        ))}
      </nav>

      <div role="status" aria-live="polite">
        {annonce && (
          <p className="flex flex-wrap items-center gap-2 rounded-abm-md border border-bordeaux-700/20 bg-white px-4 py-3 text-ink shadow-[inset_4px_0_0_var(--color-bordeaux-700)]">
            <Check size={18} aria-hidden className="text-bordeaux-700" />
            <span>{annonce}</span>
            <Link href="/espace/statistiques" className={`text-sm font-semibold ${classeLien}`}>
              Voir les statistiques
            </Link>
          </p>
        )}
      </div>

      {/* ── À classer ── */}
      <Panneau id="a-classer" titre="À classer ou à contrôler" compte={aClasser.length} compteAccent corps={false}>
        <p className="border-b border-bordeaux-700/10 px-5 py-3 text-sm text-ink-soft sm:px-6">
          Formations dont l’intitulé n’a pas été reconnu, et mentions choisies à la main par un membre (à vérifier).
        </p>
        {aClasser.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-5 text-sm text-ink-soft sm:px-6">
            <Check size={16} aria-hidden className="text-bordeaux-500" /> Tout est classé.
          </p>
        ) : (
          <ul className="divide-y divide-bordeaux-700/10">
            {aClasser.map((f) => (
              <LigneAClasser key={f.id} f={f} familles={familles} action={classer} onNouvelle={(libelle) => setOuvert({ type: "ajouter-mention", libelle })} />
            ))}
          </ul>
        )}
      </Panneau>

      {/* ── Grands domaines ── */}
      <Panneau
        id="grands-domaines"
        titre="Grands domaines d’études"
        compte={familles.length}
        corps={false}
        action={
          <button type="button" onClick={() => setOuvert({ type: "ajouter-famille" })} className={buttonClasses("primary", "petit")}>
            <Plus size={15} aria-hidden /> Ajouter un grand domaine
          </button>
        }
      >
        <p className="border-b border-bordeaux-700/10 px-5 py-3 text-sm text-ink-soft sm:px-6">
          Les familles de mentions : ce sont elles qui forment les regroupements et les couleurs des graphiques.
        </p>
        <ul className="divide-y divide-bordeaux-700/10">
          {familles.map((f, rang) => {
            const total = f.mentions.reduce((t, m) => t + m.nbFormations, 0);
            return (
              <li key={f.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
                <span aria-hidden className="mt-1 size-4 shrink-0 rounded-[4px] ring-1 ring-bordeaux-700/25" style={{ background: couleurFamille(rang).fond }} />
                <div className="min-w-0 flex-[1_1_260px]">
                  <p className="font-semibold text-ink">{f.libelle}</p>
                  <p className="text-sm text-ink-soft">
                    {f.mentions.length} mention{f.mentions.length > 1 ? "s" : ""} · {formations(total)}
                  </p>
                  <p className="text-xs text-ink-soft">{f.mentions.length ? f.mentions.map((m) => m.libelle).join(" · ") : "Vide : ajoutez-y des mentions ou supprimez-le."}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setOuvert({ type: "renommer-famille", famille: f })} className={classeBoutonAction} aria-label={`Renommer ${f.libelle}`}>
                    <Pencil size={14} aria-hidden /> Renommer
                  </button>
                  {familles.length > 1 && f.mentions.length > 0 && (
                    <button type="button" onClick={() => setOuvert({ type: "fusionner-famille", famille: f })} className={classeBoutonAction} aria-label={`Fusionner ${f.libelle}`}>
                      <GitMerge size={14} aria-hidden /> Fusionner…
                    </button>
                  )}
                  {f.mentions.length === 0 && (
                    <button type="button" onClick={() => setOuvert({ type: "supprimer-famille", famille: f })} className={classeBoutonDanger} aria-label={`Supprimer ${f.libelle}`}>
                      <Trash2 size={14} aria-hidden /> Supprimer
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panneau>

      {/* ── Mentions ── */}
      <Panneau
        id="mentions"
        titre="Mentions"
        compte={toutes.length}
        corps={false}
        action={
          <div className="flex flex-wrap gap-2">
            <form action={relancer}>
              <button type="submit" className={buttonClasses("outline", "petit")} title="Refait la reconnaissance de toutes les formations automatiques">
                <RefreshCw size={15} aria-hidden /> Relancer la détection
              </button>
            </form>
            <button type="button" onClick={() => setOuvert({ type: "ajouter-mention" })} className={buttonClasses("primary", "petit")}>
              <Plus size={15} aria-hidden /> Ajouter une mention
            </button>
          </div>
        }
      >
        <div className="border-b border-bordeaux-700/10 px-5 py-4 sm:px-6">
          <p className="text-sm text-ink-soft">
            Chaque mention appartient à un grand domaine. Les variantes sont les autres écritures que la détection rattache à la
            mention ; une mention choisie à la main dans une fiche n’est jamais modifiée par la détection.
          </p>
          <label htmlFor="recherche-mention" className="mt-3 block text-sm font-semibold text-ink">
            Rechercher une mention ou une variante
          </label>
          <div className="relative mt-1 max-w-md">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input id="recherche-mention" type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Ex. : RI, banque, urbanisme" className={`${classeSaisie} pl-9`} />
          </div>
        </div>
        {familles.map((f, rang) => {
          const liste = f.mentions.filter(correspond);
          if (liste.length === 0) return null;
          return (
            <div key={f.id}>
              <h3 className="flex items-center gap-2 bg-paper px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-soft sm:px-6">
                <span aria-hidden className="size-3 rounded-[3px] ring-1 ring-bordeaux-700/25" style={{ background: couleurFamille(rang).fond }} />
                {f.libelle}
              </h3>
              <ul className="divide-y divide-bordeaux-700/10">
                {liste.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
                    <div className="min-w-0 flex-[1_1_300px]">
                      <p className="font-semibold text-ink">{m.libelle}</p>
                      <p className="text-sm text-ink-soft">{m.nbFormations ? formations(m.nbFormations) : "Aucune formation"}</p>
                      {m.variantes.length > 0 ? (
                        <ul aria-label="Variantes reconnues" className="mt-1.5 flex flex-wrap gap-1">
                          {m.variantes.map((v) => (
                            <li key={v} className="rounded-abm-pill bg-bordeaux-100 px-2 py-0.5 text-xs text-bordeaux-700">
                              {v}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-ink-soft">Aucune variante</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setOuvert({ type: "modifier-mention", mention: m })} className={classeBoutonAction} aria-label={`Modifier ${m.libelle}`}>
                        <Pencil size={14} aria-hidden /> Modifier
                      </button>
                      {toutes.length > 1 && (
                        <button type="button" onClick={() => setOuvert({ type: "fusionner-mention", mention: m })} className={classeBoutonAction} aria-label={`Fusionner ${m.libelle}`}>
                          <GitMerge size={14} aria-hidden /> Fusionner…
                        </button>
                      )}
                      {m.nbFormations === 0 && (
                        <button type="button" onClick={() => setOuvert({ type: "supprimer-mention", mention: m })} className={classeBoutonDanger} aria-label={`Supprimer ${m.libelle}`}>
                          <Trash2 size={14} aria-hidden /> Supprimer
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {q && !toutes.some(correspond) && <p className="px-5 py-5 text-sm text-ink-soft sm:px-6">Aucune mention ne correspond.</p>}
      </Panneau>

      {/* ── Tester une écriture ── */}
      <Panneau id="tester" titre="Tester une écriture">
        <p className="text-sm text-ink-soft">
          Pour vérifier ce que la détection reconnaît, par exemple avant d’ajouter une variante. Méthode : accents, majuscules,
          ponctuation et mots de diplôme (« Master », « M2 »…) sont ignorés ; on cherche le nom de la mention ou l’une de ses
          variantes, puis les mêmes mots dans le désordre, puis une écriture approchante (fautes de frappe).
        </p>
        <label htmlFor="essai-detection" className="mt-4 block text-sm font-semibold text-ink">
          Intitulé à tester
        </label>
        <input id="essai-detection" value={essai} onChange={(e) => setEssai(e.target.value)} placeholder="Ex. : M2 relations internationnales – sécurité" className={`${classeSaisie} mt-1 max-w-xl`} autoComplete="off" />
        <p className="mt-2 text-sm text-ink" aria-live="polite">
          {!essai.trim()
            ? "Tapez un intitulé pour voir la mention reconnue."
            : estBiLicence(essai)
              ? "C’est la bi-licence : elle est refusée comme formation (déjà affichée automatiquement)."
              : mentionEssai
                ? (
                  <>
                    Mention reconnue : <b className="text-bordeaux-700">{mentionEssai.libelle}</b> ({familleEssai?.libelle}) · {LIBELLES_METHODE[resultatEssai!.methode]}
                  </>
                )
                : "Non reconnue : cette formation arriverait dans « À classer »."}
        </p>
      </Panneau>

      <Fenetre ouverte={!!ouvert} onFermer={fermer} titre={ouvert ? titres[ouvert.type] : ""} surtitre={sujet ?? undefined} etroite>
        {ouvert?.type === "ajouter-famille" && <FenetreFamille {...commun} />}
        {ouvert?.type === "renommer-famille" && <FenetreFamille famille={ouvert.famille} {...commun} />}
        {ouvert?.type === "fusionner-famille" && <FenetreFusionFamille famille={ouvert.famille} familles={familles} {...commun} />}
        {ouvert?.type === "supprimer-famille" && (
          <FenetreSuppression
            id={ouvert.famille.id}
            action={supprimerFamille}
            texte={`Supprimer « ${ouvert.famille.libelle} » ? Il ne contient aucune mention : sa suppression n’a aucun effet sur les fiches.`}
            {...commun}
          />
        )}
        {ouvert?.type === "ajouter-mention" && <FenetreMention libelleInitial={ouvert.libelle} familles={familles} {...commun} />}
        {ouvert?.type === "modifier-mention" && <FenetreMention mention={ouvert.mention} familles={familles} {...commun} />}
        {ouvert?.type === "fusionner-mention" && <FenetreFusionMention mention={ouvert.mention} familles={familles} {...commun} />}
        {ouvert?.type === "supprimer-mention" && (
          <FenetreSuppression
            id={ouvert.mention.id}
            action={supprimerMention}
            texte={`Supprimer « ${ouvert.mention.libelle} » ? Aucune formation ne l’utilise : sa suppression n’a aucun effet sur les fiches.`}
            {...commun}
          />
        )}
      </Fenetre>
    </div>
  );
}
