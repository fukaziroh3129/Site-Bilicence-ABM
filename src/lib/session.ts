// Vérifications d'accès, à appeler au début de chaque page ou action protégée.
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { estAdministrateur, estDuBureau } from "@/lib/roles";

/** Session de la personne connectée, ou null. Mise en cache pour la durée d'une requête. */
export const obtenirSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Exige d'être connecté (quel que soit le statut du compte). */
export async function exigerConnexion() {
  const session = await obtenirSession();
  if (!session) redirect("/connexion");
  return session;
}

/**
 * Exige un compte validé OU en attente de validation. Un compte en attente n'est pas encore
 * membre : il peut seulement remplir sa fiche et gérer son compte (pages qui appellent cette
 * fonction). Un compte refusé est renvoyé vers la page qui l'explique.
 */
export async function exigerCompte() {
  const session = await exigerConnexion();
  if (session.user.statut === "REFUSE") redirect("/compte-en-attente");
  return session;
}

/** Exige un compte validé par le bureau. */
export async function exigerMembreActif() {
  const session = await exigerCompte();
  // Compte en attente : retour à l'accueil de l'espace, qui explique pourquoi la rubrique est fermée.
  if (session.user.statut !== "ACTIF") redirect("/espace?acces=restreint");
  return session;
}

/**
 * Exige un membre du bureau (animateur, administrateur ou propriétaire) : console d'administration,
 * validation des comptes, contenu, domaines, établissements. Rôles : src/lib/roles.ts.
 */
export async function exigerBureau() {
  const session = await exigerMembreActif();
  if (!estDuBureau(session.user.role)) redirect("/espace");
  return session;
}

/** Exige un administrateur (ou le propriétaire) : fiches, comptes, pré-comptes, export. */
export async function exigerAdmin() {
  const session = await exigerMembreActif();
  if (!estAdministrateur(session.user.role)) redirect(estDuBureau(session.user.role) ? "/admin" : "/espace");
  return session;
}
