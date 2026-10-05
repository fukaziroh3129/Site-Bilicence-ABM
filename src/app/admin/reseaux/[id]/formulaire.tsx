"use client";

import { useActionState } from "react";
import { enregistrerPostSocial } from "@/actions/admin";
import { ChampImage } from "@/components/champ-image";
import { BoutonEnvoyer, CaseACocher, Champ, Liste, MessageFormulaire } from "@/components/formulaire";
import type { PostSocial } from "@/generated/prisma/client";

const optionsReseau = [
  { valeur: "INSTAGRAM", libelle: "Instagram" },
  { valeur: "LINKEDIN", libelle: "LinkedIn" },
];

export function FormulairePostSocial({ post }: { post: PostSocial | null }) {
  const [etat, action] = useActionState(enregistrerPostSocial, null);

  return (
    <form action={action} className="space-y-5">
      <MessageFormulaire etat={etat} />
      {post && <input type="hidden" name="id" value={post.id} />}
      <Liste nom="reseau" libelle="Réseau" requis options={optionsReseau} defaultValue={post?.reseau ?? "INSTAGRAM"} etat={etat} />
      <Champ
        nom="lien"
        libelle="Adresse du post"
        type="url"
        requis
        maxLength={500}
        aide="Ouvrez le post, copiez l’adresse de la page et collez-la ici."
        defaultValue={post?.lien}
        etat={etat}
      />
      <Champ
        nom="legende"
        libelle="Légende"
        requis
        maxLength={160}
        aide="Une courte phrase affichée sous le visuel."
        defaultValue={post?.legende}
        etat={etat}
      />
      <ChampImage libelle="Visuel du post" actuelle={post?.image} etat={etat} />
      <p className="-mt-3 text-xs text-ink-soft">
        Enregistrez vous-même l’image du post (capture ou fichier d’origine) : le site n’en récupère aucune sur Instagram ni LinkedIn.
        Sans visuel, un cadre « Visuel à ajouter » s’affiche.
      </p>
      <CaseACocher nom="publie" libelle="Afficher sur l’accueil (sinon : brouillon, visible seulement ici)" defaultChecked={post?.publie ?? true} etat={etat} />
      <BoutonEnvoyer>Enregistrer</BoutonEnvoyer>
    </form>
  );
}
