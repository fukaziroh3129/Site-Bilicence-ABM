"use client";

// Champ de téléversement d'image, avec aperçu de l'image actuelle et option pour la retirer.

import type { EtatFormulaire } from "@/lib/formulaire";

export function ChampImage({
  libelle,
  actuelle,
  etat,
}: {
  libelle: string;
  actuelle?: string | null;
  etat: EtatFormulaire;
}) {
  const erreur = etat?.erreurs?.image;
  return (
    <div>
      <label htmlFor="image" className="block text-sm font-semibold text-ink">
        {libelle}
      </label>
      {actuelle && (
        <div className="mt-2 flex items-end gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu d'une image téléversée */}
          <img src={actuelle} alt="Image actuelle" className="h-24 w-auto border border-bordeaux-700/20 object-cover" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="retirerImage" className="size-4 accent-bordeaux-700" />
            Retirer l’image
          </label>
        </div>
      )}
      <input
        id="image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="mt-2 block w-full text-sm file:mr-4 file:rounded-abm-sm file:border-0 file:bg-bordeaux-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-bordeaux-700"
      />
      <p className="mt-1 text-xs text-ink-soft">JPEG, PNG ou WebP, 5 Mo maximum.{actuelle && " Une nouvelle image remplace l’actuelle."}</p>
      {erreur && <p className="mt-1 text-sm font-semibold text-bordeaux-500">{erreur}</p>}
    </div>
  );
}
