"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";
import {
  changerEmail,
  changerMotDePasse,
  confirmerDoubleAuth,
  desactiverDoubleAuth,
  preparerDoubleAuth,
  supprimerMonCompte,
} from "@/actions/compte";
import { BoutonEnvoyer, Champ, MessageFormulaire } from "@/components/formulaire";

export function FormulaireMotDePasse() {
  const [etat, action] = useActionState(changerMotDePasse, null);
  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="max-w-sm">
        <Champ nom="actuel" libelle="Mot de passe actuel" type="password" autoComplete="current-password" requis etat={etat} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ
          nom="motDePasse"
          libelle="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          aide="10 caractères minimum."
          minLength={10}
          requis
          etat={etat}
        />
        <Champ nom="confirmation" libelle="Confirmer" type="password" autoComplete="new-password" requis etat={etat} />
      </div>
      <BoutonEnvoyer>Modifier le mot de passe</BoutonEnvoyer>
    </form>
  );
}

export function FormulaireEmail() {
  const [etat, action] = useActionState(changerEmail, null);
  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ nom="email" libelle="Nouvelle adresse e-mail" type="email" autoComplete="email" requis etat={etat} />
        <Champ nom="motDePasseEmail" libelle="Mot de passe actuel" type="password" autoComplete="current-password" requis etat={etat} />
      </div>
      <BoutonEnvoyer>Changer d’adresse</BoutonEnvoyer>
    </form>
  );
}

export function FormulaireSuppression() {
  const [etat, action] = useActionState(supprimerMonCompte, null);
  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      <div className="max-w-sm">
        <Champ nom="motDePasseSuppression" libelle="Mot de passe (pour confirmer)" type="password" autoComplete="current-password" requis etat={etat} />
      </div>
      <BoutonEnvoyer variante="danger" confirmation="Supprimer définitivement votre compte et votre fiche ?">
        <Trash2 size={16} aria-hidden /> Supprimer définitivement
      </BoutonEnvoyer>
    </form>
  );
}

/** Double authentification : activation en deux temps (mot de passe → QR code + premier code), ou désactivation. */
export function FormulaireDoubleAuth({ active }: { active: boolean }) {
  const [preparation, preparer] = useActionState(preparerDoubleAuth, null);
  const [confirmation, confirmer] = useActionState(confirmerDoubleAuth, null);
  const [desactivation, desactiver] = useActionState(desactiverDoubleAuth, null);

  if (active) {
    return (
      <form action={desactiver} className="space-y-5">
        <MessageFormulaire etat={desactivation} />
        <div className="max-w-sm">
          <Champ nom="motDePasseDoubleAuth" libelle="Mot de passe (pour confirmer)" type="password" autoComplete="current-password" requis etat={desactivation} />
        </div>
        <BoutonEnvoyer variante="outline" confirmation="Désactiver la double authentification ? Votre compte ne sera plus protégé que par le mot de passe.">
          Désactiver
        </BoutonEnvoyer>
      </form>
    );
  }

  if (preparation?.qr) {
    return (
      <div className="space-y-6">
        <ol className="list-decimal space-y-2 pl-5 text-[15px]">
          <li>Installez une application d’authentification (Google Authenticator, Microsoft Authenticator, Aegis, 2FAS…).</li>
          <li>Scannez ce QR code avec l’application (ou saisissez la clé à la main).</li>
          <li>Notez les codes de secours en lieu sûr : chacun permet une connexion si vous perdez votre téléphone.</li>
          <li>Saisissez le code à 6 chiffres affiché par l’application pour terminer.</li>
        </ol>
        <div className="flex flex-wrap items-start gap-8">
          <Image src={preparation.qr} alt="QR code à scanner avec l’application d’authentification" width={220} height={220} unoptimized className="border border-bordeaux-700/15" />
          <div className="min-w-0 space-y-4 text-sm">
            {preparation.cle && (
              <p>
                Clé : <code className="break-all font-mono text-ink">{preparation.cle}</code>
              </p>
            )}
            {preparation.codes && (
              <div>
                <p className="font-semibold text-ink">Codes de secours (à noter maintenant, ils ne seront plus affichés)</p>
                <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 font-mono">
                  {preparation.codes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <form action={confirmer} className="space-y-5">
          <MessageFormulaire etat={confirmation} />
          <div className="max-w-xs">
            <Champ nom="code" libelle="Code à 6 chiffres" inputMode="numeric" autoComplete="one-time-code" maxLength={7} requis etat={confirmation} />
          </div>
          <BoutonEnvoyer>Activer la double authentification</BoutonEnvoyer>
        </form>
      </div>
    );
  }

  return (
    <form action={preparer} className="space-y-5">
      <MessageFormulaire etat={preparation} />
      <div className="max-w-sm">
        <Champ nom="motDePasseDoubleAuth" libelle="Mot de passe actuel" type="password" autoComplete="current-password" requis etat={preparation} />
      </div>
      <BoutonEnvoyer variante="outline">Configurer</BoutonEnvoyer>
    </form>
  );
}
