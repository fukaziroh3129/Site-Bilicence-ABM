"use client";

import Link from "next/link";
import { useActionState } from "react";
import { enregistrerMembreBureau } from "@/actions/admin";
import { ChampImage } from "@/components/champ-image";
import { BoutonEnvoyer, CasesMultiples, Champ, MessageFormulaire } from "@/components/formulaire";
import type { Fonction, MembreBureau } from "@/generated/prisma/client";

type FonctionOption = Pick<Fonction, "id" | "nom" | "niveau">;

export function FormulaireMembreBureau({
  membre,
  fonctions,
  fonctionsDuMembre,
}: {
  membre: MembreBureau | null;
  fonctions: FonctionOption[];
  fonctionsDuMembre: string[];
}) {
  const [etat, action] = useActionState(enregistrerMembreBureau, null);
  const options = fonctions.map((f) => ({
    valeur: f.id,
    libelle: f.nom,
    groupe: f.niveau === "BUREAU" ? "Fonctions du bureau" : "Pôles",
  }));

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      {membre && <input type="hidden" name="id" value={membre.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ nom="prenom" libelle="Prénom" requis maxLength={80} defaultValue={membre?.prenom} etat={etat} />
        <Champ nom="nom" libelle="Nom" requis maxLength={80} defaultValue={membre?.nom} etat={etat} />
      </div>

      {options.length === 0 ? (
        <p className="rounded-abm-sm border border-dashed border-bordeaux-300 bg-white px-4 py-3 text-sm text-ink-soft">
          Aucune étiquette pour l’instant.{" "}
          <Link href="/admin/bureau/etiquette/nouveau" className="font-semibold text-bordeaux-700 underline underline-offset-4">
            Créez d’abord une fonction ou un pôle
          </Link>
          , puis revenez ici.
        </p>
      ) : (
        <div>
          <CasesMultiples
            nom="fonctions"
            libelle="Étiquettes (une ou plusieurs)"
            aide="Les fonctions du bureau s’affichent ensemble en haut de la page, les pôles en dessous."
            options={options}
            defaultValue={fonctionsDuMembre}
            etat={etat}
          />
          <p className="mt-1 text-xs text-ink-soft">
            Une étiquette manque ?{" "}
            <Link href="/admin/bureau/etiquette/nouveau" className="underline underline-offset-4">
              Créer une fonction ou un pôle
            </Link>
          </p>
        </div>
      )}

      <Champ
        nom="role"
        libelle="Précision (facultatif)"
        maxLength={120}
        aide="Affichée sous le nom, surtout utile dans un pôle. Ex. « Responsable », « Membre »"
        defaultValue={membre?.role}
        etat={etat}
      />
      <Champ
        nom="ordre"
        libelle="Ordre d’affichage"
        type="number"
        inputMode="numeric"
        aide="Place de la personne parmi les autres (les plus petits nombres d’abord), à l’intérieur de chaque fonction ou pôle."
        defaultValue={membre?.ordre ?? 0}
        etat={etat}
      />
      <ChampImage libelle="Photo (format portrait)" actuelle={membre?.photo} etat={etat} />
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
