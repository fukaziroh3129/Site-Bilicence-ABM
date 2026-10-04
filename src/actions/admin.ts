"use server";

// Actions réservées au bureau : comptes, fiches, événements, actualités, composition du bureau.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adresseSite, envoyerEmail } from "@/lib/email";
import { enregistrerImage, supprimerImage, verifierImage } from "@/lib/fichiers";
import { PREMIERE_PROMO, slugifier } from "@/lib/format";
import { champ, valider, valeursDe, type EtatFormulaire } from "@/lib/formulaire";
import { supprimerRapportsDe } from "@/lib/rapports";
import { estDuBureau, peutChangerRole, peutGererCompte } from "@/lib/roles";
import { exigerAdmin, exigerBureau } from "@/lib/session";
import { site } from "@/lib/site";

function rafraichirTout() {
  revalidatePath("/", "layout");
}

// ─── Comptes ───────────────────────────────────────────────────────────────────

/** Valide un compte et le rattache à une fiche existante ou à une nouvelle fiche. */
export async function validerCompte(formData: FormData) {
  await exigerBureau();
  const userId = String(formData.get("userId"));
  const rattachement = String(formData.get("rattachement") ?? "nouvelle");

  const compte = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (compte.statut !== "EN_ATTENTE" && compte.statut !== "REFUSE") return;

  let personneId = compte.personneId;
  if (personneId && rattachement !== "nouvelle" && rattachement !== personneId) {
    // La personne a commencé sa fiche pendant l'attente, mais une fiche existait déjà pour elle
    // (import, saisie du bureau) : on regroupe tout sur la fiche existante.
    await fusionnerFiches(personneId, rattachement);
    personneId = rattachement;
  } else if (!personneId) {
    if (rattachement === "nouvelle") {
      const personne = await prisma.personne.create({
        data: {
          prenom: compte.prenom,
          nom: compte.nom,
          promoEntree: compte.promoEntree ?? new Date().getFullYear(),
          emailContact: compte.email,
        },
      });
      personneId = personne.id;
    } else {
      const dejaPrise = await prisma.user.findFirst({ where: { personneId: rattachement } });
      if (dejaPrise) throw new Error("Cette fiche est déjà rattachée à un autre compte.");
      personneId = rattachement;
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { statut: "ACTIF", personneId } });

  void envoyerEmail({
    a: compte.email,
    sujet: "Votre compte est validé",
    texte: [
      `Bonjour ${compte.prenom},`,
      "",
      "Le bureau a validé votre compte : vous avez maintenant accès à l’espace membres (annuaire, archive des stages, offres, événements).",
      "",
      "Pensez à compléter votre fiche, elle sera précieuse pour les promotions suivantes :",
      adresseSite("/espace/ma-fiche"),
    ].join("\n"),
  });

  rafraichirTout();
}

/**
 * Regroupe la fiche « brouillon » d'un compte en attente dans une fiche existante sans compte :
 * formations, expériences et Erasmus sont déplacés ; ce que la personne a saisi remplace les
 * informations importées (sauf champs laissés vides) ; le brouillon est supprimé.
 */
async function fusionnerFiches(brouillonId: string, cibleId: string) {
  const cible = await prisma.personne.findUniqueOrThrow({ where: { id: cibleId }, include: { compte: { select: { id: true } } } });
  if (cible.compte) throw new Error("Cette fiche est déjà rattachée à un autre compte.");
  const brouillon = await prisma.personne.findUniqueOrThrow({ where: { id: brouillonId } });

  const remplis = Object.fromEntries(
    Object.entries(brouillon).filter(
      ([cle, v]) => !["id", "creeLe", "modifieLe"].includes(cle) && v !== null && v !== "" && v !== false && !(Array.isArray(v) && v.length === 0),
    ),
  );

  await prisma.$transaction([
    prisma.formation.updateMany({ where: { personneId: brouillonId }, data: { personneId: cibleId } }),
    prisma.experience.updateMany({ where: { personneId: brouillonId }, data: { personneId: cibleId } }),
    prisma.erasmus.updateMany({ where: { personneId: brouillonId }, data: { personneId: cibleId } }),
    prisma.noteModification.updateMany({ where: { personneId: brouillonId }, data: { personneId: cibleId } }),
    prisma.user.update({ where: { personneId: brouillonId }, data: { personneId: null } }),
    prisma.personne.delete({ where: { id: brouillonId } }),
    prisma.personne.update({ where: { id: cibleId }, data: remplis as Prisma.PersonneUpdateInput }),
  ]);
}

export async function refuserCompte(formData: FormData) {
  await exigerBureau();
  // Seulement une inscription en attente (un membre validé se supprime, il ne se refuse pas).
  const { count } = await prisma.user.updateMany({ where: { id: String(formData.get("userId")), statut: "EN_ATTENTE" }, data: { statut: "REFUSE" } });
  if (count === 0) return;
  // Déconnecte la personne immédiatement.
  await prisma.session.deleteMany({ where: { userId: String(formData.get("userId")) } });
  rafraichirTout();
}

const ROLES = ["MEMBRE", "ANIMATEUR", "ADMIN"] as const;

/**
 * Change le rôle d'un compte actif (« rendre animateur », « rendre administrateur », « retirer »…).
 * Règles dans src/lib/roles.ts : chacun peut se rétrograder ; un administrateur gère les animateurs ;
 * seul le propriétaire gère les administrateurs.
 */
export async function changerRole(formData: FormData) {
  const { user } = await exigerBureau();
  const role = ROLES.find((r) => r === formData.get("role"));
  if (!role) return;
  const cible = await prisma.user.findUniqueOrThrow({ where: { id: String(formData.get("userId")) }, select: { id: true, role: true, statut: true } });
  if (cible.statut !== "ACTIF" || !peutChangerRole(user, cible, role)) throw new Error("Vous ne pouvez pas attribuer ce rôle.");
  await prisma.user.update({ where: { id: cible.id }, data: { role } });
  rafraichirTout();
  // Qui renonce lui-même à l'accès à la console en sort.
  if (cible.id === user.id && !estDuBureau(role)) redirect("/espace");
}

/**
 * Transmet le titre de propriétaire à un autre compte actif (passation de présidence) : l'ancien
 * propriétaire devient administrateur. Il y a donc toujours exactement un propriétaire.
 */
export async function transfererPropriete(formData: FormData) {
  const { user } = await exigerAdmin();
  if (user.role !== "PROPRIETAIRE") throw new Error("Seul le propriétaire peut transmettre son titre.");
  const cible = await prisma.user.findUniqueOrThrow({ where: { id: String(formData.get("userId")) }, select: { id: true, statut: true } });
  if (cible.id === user.id || cible.statut !== "ACTIF") throw new Error("Choisissez un autre compte actif.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } }),
    prisma.user.update({ where: { id: cible.id }, data: { role: "PROPRIETAIRE" } }),
  ]);
  rafraichirTout();
}

/** Envoie à la personne un lien pour choisir un nouveau mot de passe (le bureau ne voit jamais les mots de passe). */
export async function envoyerLienMotDePasse(formData: FormData) {
  const { user } = await exigerAdmin();
  const cible = await prisma.user.findUniqueOrThrow({ where: { id: String(formData.get("userId")) }, select: { id: true, role: true, email: true } });
  if (!peutGererCompte(user, cible)) throw new Error("Vous ne pouvez pas gérer ce compte.");
  await auth.api.requestPasswordReset({ body: { email: cible.email, redirectTo: "/reinitialiser-mot-de-passe" } });
}

/** Supprime un compte (la fiche d'un membre validé est conservée). */
export async function supprimerCompte(formData: FormData) {
  const { user } = await exigerAdmin();
  const userId = String(formData.get("userId"));
  if (userId === user.id) throw new Error("Pour supprimer votre propre compte, passez par « Mon compte ».");
  const compte = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, role: true, statut: true, personneId: true } });
  if (!peutGererCompte(user, compte)) throw new Error("Vous ne pouvez pas supprimer ce compte.");
  await prisma.user.delete({ where: { id: userId } });
  // Un compte jamais validé : sa fiche (brouillon) disparaît avec lui. Sinon, sans compte, elle
  // deviendrait visible dans l'annuaire. La fiche d'un membre validé (ou d'un pré-compte, issue
  // d'une base existante) est conservée.
  if ((compte.statut === "EN_ATTENTE" || compte.statut === "REFUSE") && compte.personneId) {
    await supprimerRapportsDe(compte.personneId);
    await prisma.personne.delete({ where: { id: compte.personneId } });
  }
  rafraichirTout();
}

// ─── Fiches ────────────────────────────────────────────────────────────────────

const schemaNouvellePersonne = z.object({
  prenom: champ.texte(80),
  nom: champ.texte(80),
  promoEntree: champ.entier(PREMIERE_PROMO, new Date().getFullYear()),
});

export async function creerPersonne(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerAdmin();
  const resultat = valider(schemaNouvellePersonne, formData);
  if (!resultat.ok) return resultat.etat;
  const personne = await prisma.personne.create({ data: resultat.donnees });
  rafraichirTout();
  redirect(`/admin/personnes/${personne.id}`);
}

export async function supprimerPersonne(formData: FormData) {
  await exigerAdmin();
  const id = String(formData.get("id"));
  await supprimerRapportsDe(id);
  await prisma.personne.delete({ where: { id } });
  rafraichirTout();
  redirect("/admin/personnes");
}

// ─── Événements ────────────────────────────────────────────────────────────────

const schemaEvenement = z.object({
  id: z.string().optional(),
  titre: champ.texte(160),
  debut: champ.dateHeure(),
  fin: champ.dateHeureFacultative(),
  lieu: champ.texteFacultatif(160),
  description: champ.texteFacultatif(5000), // élargi de 3 000 à 5 000 (ADM-05), comme les offres
  lien: champ.lienFacultatif(),
});

export async function enregistrerEvenement(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const resultat = valider(schemaEvenement, formData);
  if (!resultat.ok) return resultat.etat;
  const { id, ...d } = resultat.donnees;

  if (d.fin && d.fin < d.debut) {
    return { erreur: "Certains champs sont à corriger.", erreurs: { fin: "La fin doit être après le début." }, valeurs: valeursDe(formData) };
  }

  if (id) await prisma.evenement.update({ where: { id }, data: d });
  else await prisma.evenement.create({ data: d });

  rafraichirTout();
  redirect("/admin/evenements");
}

export async function supprimerEvenement(formData: FormData) {
  await exigerBureau();
  await prisma.evenement.delete({ where: { id: String(formData.get("id")) } });
  rafraichirTout();
}

// ─── Actualités ────────────────────────────────────────────────────────────────

const schemaArticle = z.object({
  id: z.string().optional(),
  titre: champ.texte(160),
  categorie: champ.choix(["PORTRAIT_ANCIEN", "PORTRAIT_ETUDIANT", "VIE_LICENCE", "ASSOCIATION"]),
  chapo: champ.texteFacultatif(400),
  contenu: champ.texte(30000),
  aLaUne: champ.case(),
  publie: champ.case(),
  retirerImage: champ.case(),
});

/** Adresse unique pour un article : « mon-titre », sinon « mon-titre-2 »… */
async function slugUnique(titre: string, idActuel?: string) {
  const base = slugifier(titre) || "article";
  let slug = base;
  for (let i = 2; ; i++) {
    const existant = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (!existant || existant.id === idActuel) return slug;
    slug = `${base}-${i}`;
  }
}

export async function enregistrerArticle(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const resultat = valider(schemaArticle, formData);
  if (!resultat.ok) return resultat.etat;
  const { id, retirerImage, publie, ...d } = resultat.donnees;

  const image = formData.get("image") as File | null;
  const erreurImage = await verifierImage(image);
  if (erreurImage) return { erreur: "Certains champs sont à corriger.", erreurs: { image: erreurImage }, valeurs: valeursDe(formData) };

  const avant = id ? await prisma.article.findUniqueOrThrow({ where: { id } }) : null;
  let cheminImage = avant?.image ?? null;
  if (image && image.size > 0) {
    await supprimerImage(cheminImage);
    cheminImage = await enregistrerImage(image);
  } else if (retirerImage) {
    await supprimerImage(cheminImage);
    cheminImage = null;
  }

  const donnees = {
    ...d,
    image: cheminImage,
    publie,
    // Date de publication fixée à la première publication.
    publieLe: publie ? (avant?.publieLe ?? new Date()) : null,
    slug: await slugUnique(d.titre, id),
  };

  if (id) await prisma.article.update({ where: { id }, data: donnees });
  else await prisma.article.create({ data: donnees });

  rafraichirTout();
  redirect("/admin/actualites");
}

export async function supprimerArticle(formData: FormData) {
  await exigerBureau();
  const article = await prisma.article.delete({ where: { id: String(formData.get("id")) } });
  await supprimerImage(article.image);
  rafraichirTout();
}

// ─── Composition du bureau ─────────────────────────────────────────────────────

const schemaMembreBureau = z.object({
  id: z.string().optional(),
  prenom: champ.texte(80),
  nom: champ.texte(80),
  role: champ.texte(120),
  pole: champ.choixFacultatif(site.poles.map((p) => p.code) as [string, ...string[]]),
  ordre: champ.entierFacultatif(0, 999),
  retirerImage: champ.case(),
});

export async function enregistrerMembreBureau(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerBureau();
  const resultat = valider(schemaMembreBureau, formData);
  if (!resultat.ok) return resultat.etat;
  const { id, retirerImage, ordre, ...d } = resultat.donnees;

  const photo = formData.get("image") as File | null;
  const erreurImage = await verifierImage(photo);
  if (erreurImage) return { erreur: "Certains champs sont à corriger.", erreurs: { image: erreurImage }, valeurs: valeursDe(formData) };

  const avant = id ? await prisma.membreBureau.findUniqueOrThrow({ where: { id } }) : null;
  let cheminPhoto = avant?.photo ?? null;
  if (photo && photo.size > 0) {
    await supprimerImage(cheminPhoto);
    cheminPhoto = await enregistrerImage(photo);
  } else if (retirerImage) {
    await supprimerImage(cheminPhoto);
    cheminPhoto = null;
  }

  const donnees = { ...d, ordre: ordre ?? 0, photo: cheminPhoto };
  if (id) await prisma.membreBureau.update({ where: { id }, data: donnees });
  else await prisma.membreBureau.create({ data: donnees });

  rafraichirTout();
  redirect("/admin/bureau");
}

export async function supprimerMembreBureau(formData: FormData) {
  await exigerBureau();
  const membre = await prisma.membreBureau.delete({ where: { id: String(formData.get("id")) } });
  await supprimerImage(membre.photo);
  rafraichirTout();
}
