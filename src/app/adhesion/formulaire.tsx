"use client";

import { BriefcaseBusiness, CalendarDays, GraduationCap, Landmark, Users } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { inscrire } from "@/actions/compte";
import { CarteAdhesion } from "@/components/adhesion/carte-adhesion";
import { BoutonEnvoyer, CaseACocher, Champ, Liste, MessageFormulaire } from "@/components/formulaire";
import { classeLien } from "@/components/ui";
import { libellePromo, listePromos } from "@/lib/format";
import type { EtatFormulaire } from "@/lib/formulaire";
import { FONCTIONS_PERSONNEL, LIBELLES_PROFIL, libelleFonction, type Profil } from "@/lib/profils";

const CHOIX_PROFIL: { profil: Profil; icone: typeof GraduationCap; precision: string }[] = [
  { profil: "ALUMNI", icone: GraduationCap, precision: "Vous suivez ou avez suivi la bi-licence." },
  { profil: "PERSONNEL", icone: Landmark, precision: "Enseignant, responsable de la formation, direction, administration." },
];

/** Ce que l'adhésion apporte, selon le profil (volet bordeaux, à côté de la carte). */
const APPORTS: Record<Profil, { icone: typeof Users; texte: string }[]> = {
  ALUMNI: [
    { icone: Users, texte: "L’annuaire des anciens et l’entraide entre promotions" },
    { icone: BriefcaseBusiness, texte: "L’archive des stages et les offres du réseau" },
    { icone: CalendarDays, texte: "Les événements de l’association" },
  ],
  PERSONNEL: [
    { icone: Users, texte: "Le devenir des diplômés, promotion par promotion" },
    { icone: BriefcaseBusiness, texte: "L’archive des stages, et des offres à transmettre aux étudiants" },
    { icone: CalendarDays, texte: "Les événements de l’association" },
  ],
};

const lire = (etat: EtatFormulaire, nom: string) => {
  const v = etat?.valeurs?.[nom];
  return typeof v === "string" ? v : "";
};

/**
 * Page d'adhésion : choix du profil, formulaire de création de compte et carte d'adhésion qui se remplit
 * pendant la saisie. L'adhésion est gratuite ; le bureau valide chaque compte.
 */
export function EspaceAdhesion() {
  const [etat, action] = useActionState(inscrire, null);
  const [profil, setProfil] = useState<Profil>("ALUMNI");
  const [saisie, setSaisie] = useState({ prenom: "", nom: "", promoEntree: "", fonction: "" });

  // Après un envoi en erreur, le formulaire est réinitialisé avec les valeurs renvoyées : la carte suit.
  const [etatPrecedent, setEtatPrecedent] = useState(etat);
  if (etat !== etatPrecedent) {
    setEtatPrecedent(etat);
    if (etat?.valeurs) {
      setSaisie({ prenom: lire(etat, "prenom"), nom: lire(etat, "nom"), promoEntree: lire(etat, "promoEntree"), fonction: lire(etat, "fonction") });
      if (lire(etat, "profil") === "PERSONNEL" || lire(etat, "profil") === "ALUMNI") setProfil(lire(etat, "profil") as Profil);
    }
  }

  const personnel = profil === "PERSONNEL";
  const detail = personnel
    ? saisie.fonction && libelleFonction(saisie.fonction)
    : saisie.promoEntree && libellePromo(Number(saisie.promoEntree));
  const maj = (nom: keyof typeof saisie) => (v: string) => setSaisie((s) => ({ ...s, [nom]: v }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-16">
      <div className="apparait grid overflow-hidden rounded-abm-lg border border-bordeaux-700/20 bg-white shadow-abm-raised lg:grid-cols-[1fr_1.1fr]">
        {/* Volet bordeaux : la carte d'adhésion, puis ce que l'adhésion apporte */}
        <div className="fond-bordeaux filigrane relative overflow-hidden px-5 py-8 text-white sm:px-10 lg:py-12">
          <p className="eyebrow text-white/76">Adhésion gratuite · validée par le bureau</p>
          <CarteAdhesion profil={profil} prenom={saisie.prenom} nom={saisie.nom} detail={detail} className="mx-auto mt-6 max-w-sm lg:max-w-none" />
          <ul className="mt-8 hidden space-y-4 sm:block">
            {APPORTS[profil].map(({ icone: Icone, texte }) => (
              <li key={texte} className="flex items-start gap-3 text-sm text-white/85">
                <span className="grid size-8 shrink-0 place-items-center rounded-abm-sm border border-white/25">
                  <Icone size={16} aria-hidden />
                </span>
                <span className="pt-1.5">{texte}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 sm:p-10 lg:p-12">
          <p className="eyebrow text-bordeaux-700">Adhésion</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-bordeaux-700 sm:text-4xl">Adhérer à l’association</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Adhérer, c’est créer votre compte sur le site. L’adhésion est gratuite et chaque compte est validé par le
            bureau. Déjà membre&nbsp;?{" "}
            <Link href="/connexion" className={classeLien}>
              Se connecter
            </Link>
          </p>

          <div className="mt-8">
            {etat?.succes ? (
              <MessageFormulaire etat={etat} />
            ) : (
              <form action={action} className="space-y-5">
                <MessageFormulaire etat={etat} />

                <fieldset>
                  <legend className="text-sm font-semibold text-ink">
                    Vous êtes<span className="text-bordeaux-500"> *</span>
                  </legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {CHOIX_PROFIL.map(({ profil: p, icone: Icone, precision }) => (
                      <label
                        key={p}
                        className="relative flex cursor-pointer gap-3 rounded-abm-md border border-bordeaux-700/25 p-4 transition-colors hover:border-bordeaux-700 has-[:checked]:border-bordeaux-700 has-[:checked]:bg-bordeaux-100/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordeaux-700"
                      >
                        <input
                          type="radio"
                          name="profil"
                          value={p}
                          checked={profil === p}
                          onChange={() => setProfil(p)}
                          className="sr-only"
                        />
                        <span
                          className={`grid size-10 shrink-0 place-items-center rounded-abm-sm transition-colors ${
                            profil === p ? "bg-bordeaux-700 text-white" : "bg-bordeaux-100 text-bordeaux-700"
                          }`}
                        >
                          <Icone size={20} aria-hidden />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-ink">{LIBELLES_PROFIL[p]}</span>
                          <span className="mt-0.5 block text-xs text-ink-soft">{precision}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Champ nom="prenom" libelle="Prénom" autoComplete="given-name" requis etat={etat} onChange={(e) => maj("prenom")(e.target.value)} />
                  <Champ nom="nom" libelle="Nom" autoComplete="family-name" requis etat={etat} onChange={(e) => maj("nom")(e.target.value)} />
                </div>

                {/* Les deux listes restent dans la page (la saisie survit à un changement de profil) ; seule
                    celle du profil choisi est visible et obligatoire, l'action ignore l'autre. */}
                <div hidden={!personnel}>
                  <Liste
                    nom="fonction"
                    libelle="Fonction"
                    requis={personnel}
                    etat={etat}
                    videLibelle="— Choisir —"
                    options={FONCTIONS_PERSONNEL.map((f) => ({ valeur: f.code, libelle: f.libelle }))}
                    onChange={maj("fonction")}
                  />
                </div>
                <div hidden={personnel}>
                  <Liste
                    nom="promoEntree"
                    libelle="Promotion"
                    requis={!personnel}
                    etat={etat}
                    videLibelle="— Choisir —"
                    options={listePromos().map((a) => ({ valeur: String(a), libelle: libellePromo(a) }))}
                    onChange={maj("promoEntree")}
                  />
                </div>

                <Champ
                  nom="email"
                  libelle="Adresse e-mail"
                  type="email"
                  autoComplete="email"
                  aide={personnel ? "De préférence votre adresse universitaire : le bureau pourra valider votre compte plus vite." : undefined}
                  requis
                  etat={etat}
                />
                <Champ
                  nom="motDePasse"
                  libelle="Mot de passe"
                  type="password"
                  autoComplete="new-password"
                  aide="10 caractères minimum."
                  minLength={10}
                  requis
                  etat={etat}
                />
                <Champ nom="confirmation" libelle="Confirmer le mot de passe" type="password" autoComplete="new-password" requis etat={etat} />
                <CaseACocher
                  nom="confidentialite"
                  libelle="J’ai lu la politique de confidentialité et j’accepte que mes informations soient utilisées pour gérer mon compte."
                  requis
                  etat={etat}
                />
                <p className="text-xs text-ink-soft">
                  <Link href="/confidentialite" className={classeLien} target="_blank">
                    Lire la politique de confidentialité
                  </Link>
                </p>
                <BoutonEnvoyer>Adhérer</BoutonEnvoyer>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
