"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import { analyserImport, confirmerImport, genererLienInvitation, type EtatImport, type LigneApercu } from "@/actions/invitations";
import { BoutonEnvoyer, Champ } from "@/components/formulaire";
import { Pastille } from "@/components/ui";

const LIBELLES: Record<LigneApercu["statut"], string> = {
  nouveau: "Nouveau",
  rattache: "Fiche existante",
  ignore: "Ignoré",
  erreur: "Erreur",
};

function Message({ etat }: { etat: EtatImport }) {
  if (etat?.erreur)
    return (
      <p role="alert" className="rounded-abm-sm border border-bordeaux-500 bg-bordeaux-100 px-4 py-3 text-sm font-semibold text-bordeaux-800">
        {etat.erreur}
      </p>
    );
  if (etat?.succes)
    return (
      <p role="status" className="rounded-abm-sm border border-bordeaux-700/20 bg-white px-4 py-3 text-sm font-semibold text-bordeaux-700">
        {etat.succes}
      </p>
    );
  return null;
}

/** Import en deux temps : fichier → aperçu de ce qui sera créé → confirmation. */
export function ImportPreComptes() {
  const [analyse, analyser] = useActionState(analyserImport, null);
  const [confirmation, confirmer] = useActionState(confirmerImport, null);
  const apercu = analyse?.apercu;
  const aCreer = apercu?.filter((l) => l.statut === "nouveau" || l.statut === "rattache").length ?? 0;
  // Une fois confirmé, l'aperçu disparaît (sauf nouvelle analyse).
  const [confirme, setConfirme] = useState<string | undefined>();
  const afficherApercu = apercu && confirme !== analyse?.donnees;

  return (
    <div className="space-y-6">
      <form action={analyser} className="space-y-4">
        <Message etat={analyse?.apercu ? null : analyse} />
        <p className="text-sm text-ink-soft">
          Fichier CSV (dans Excel : « Enregistrer sous → CSV UTF-8 ») avec une première ligne de titres :{" "}
          <b>prénom</b>, <b>nom</b>, <b>e-mail</b> (obligatoires), et si vous les avez <b>promotion</b> (« 2021 » ou
          « 2021-2024 »), <b>formation</b>, <b>parcours</b> et <b>établissement</b>, ainsi que <b>téléphone</b>, <b>ville</b> et un séjour
          Erasmus (<b>université Erasmus</b>, <b>pays Erasmus</b>, <b>ville Erasmus</b>). Rien n’est créé à cette étape :
          vous verrez d’abord un aperçu.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fichier-precomptes" className="block text-sm font-semibold text-ink">
              Fichier<span className="text-bordeaux-500"> *</span>
            </label>
            <input id="fichier-precomptes" name="fichier" type="file" accept=".csv,text/csv" required className="mt-1 block text-sm file:mr-3 file:cursor-pointer file:rounded-abm-sm file:border-0 file:bg-bordeaux-100 file:px-3 file:py-2 file:font-semibold file:text-bordeaux-700 hover:file:bg-bordeaux-200" />
          </div>
          <Champ
            nom="promoParDefaut"
            libelle="Promotion si la colonne est absente"
            aide="Ex. 2022 pour la promotion 2022-2025 (facultatif)."
            inputMode="numeric"
            maxLength={9}
          />
        </div>
        <BoutonEnvoyer>Voir l’aperçu</BoutonEnvoyer>
      </form>

      {confirmation && <Message etat={confirmation} />}

      {afficherApercu && (
        <div className="space-y-4 rounded-abm-md border border-bordeaux-700/20 border-l-[3px] border-l-bordeaux-700 bg-paper p-5">
          <h3 className="font-display text-xl font-bold text-bordeaux-700">Aperçu de l’import</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-bordeaux-100/50 text-bordeaux-800">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Ligne</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Personne</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">E-mail</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Promotion</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Formation</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordeaux-700/10">
                {apercu.map((l) => (
                  <tr key={l.numero}>
                    <td className="px-3 py-2 text-ink-soft">{l.numero}</td>
                    <td className="px-3 py-2">
                      {l.prenom} {l.nom}
                    </td>
                    <td className="px-3 py-2">{l.email}</td>
                    <td className="px-3 py-2">{l.promo}</td>
                    <td className="px-3 py-2">{l.formation || "—"}</td>
                    <td className="px-3 py-2">
                      <Pastille accent={l.statut === "nouveau" || l.statut === "rattache"}>{LIBELLES[l.statut]}</Pastille>
                      <span className="ml-2 text-xs text-ink-soft">{l.detail}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {aCreer > 0 ? (
            <form action={confirmer} onSubmit={() => setConfirme(analyse?.donnees)} className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="donnees" value={analyse?.donnees ?? "[]"} />
              <BoutonEnvoyer>{`Créer ${aCreer} pré-compte${aCreer > 1 ? "s" : ""}`}</BoutonEnvoyer>
              <span className="text-sm text-ink-soft">Les lignes ignorées ou en erreur ne seront pas créées. Aucun e-mail n’est envoyé à cette étape.</span>
            </form>
          ) : (
            <p className="text-sm text-ink-soft">Aucune ligne à créer.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Crée un lien d'invitation à copier, pour l'envoyer soi-même (message, réseau social…). */
export function LienACopier({ userId }: { userId: string }) {
  const [etat, generer] = useActionState(genererLienInvitation, null);
  const [copie, setCopie] = useState(false);

  if (etat?.lien) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <input readOnly value={etat.lien} onFocus={(e) => e.target.select()} aria-label="Lien d’invitation" className="w-56 rounded-abm-sm border border-bordeaux-700/30 px-2 py-1 text-xs" />
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(etat.lien!).then(() => setCopie(true));
          }}
          className="inline-flex items-center gap-1 text-sm text-bordeaux-700 underline underline-offset-4"
        >
          {copie ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copie ? "Copié" : "Copier"}
        </button>
      </span>
    );
  }
  return (
    <form action={generer} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="text-sm text-ink-soft underline underline-offset-4 hover:text-bordeaux-700">
        Obtenir le lien
      </button>
    </form>
  );
}
