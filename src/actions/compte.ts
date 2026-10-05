"use server";

// Actions liées au compte : inscription, connexion, mot de passe, suppression.

import { APIError } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { envoyerInvitation } from "@/lib/invitations";
import { PREMIERE_PROMO } from "@/lib/format";
import { champ, valider, type EtatFormulaire } from "@/lib/formulaire";
import { MESSAGE_LIMITE, adresseIp, autoriser } from "@/lib/limite";
import { exigerConnexion } from "@/lib/session";

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Adresse e-mail ou mot de passe incorrect.",
  EMAIL_NOT_VERIFIED:
    "Votre adresse e-mail n’est pas encore confirmée. Un nouveau lien de confirmation vient de vous être envoyé.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 10 caractères.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long.",
  INVALID_PASSWORD: "Mot de passe incorrect.",
  INVALID_TOKEN: "Ce lien n’est plus valable. Faites une nouvelle demande.",
  TOKEN_EXPIRED: "Ce lien a expiré. Faites une nouvelle demande.",
  SESSION_NOT_FRESH: "Pour des raisons de sécurité, reconnectez-vous puis recommencez.",
};

function messageErreur(erreur: unknown) {
  if (erreur instanceof APIError) {
    const code = (erreur.body as { code?: string } | undefined)?.code;
    if (code && MESSAGES[code]) return MESSAGES[code];
    if (erreur.status === "TOO_MANY_REQUESTS") return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  console.error(erreur);
  return "Une erreur est survenue. Réessayez plus tard.";
}

/**
 * N'accepte que les chemins internes au site, pour éviter les redirections vers un autre site
 * (« //pirate.fr » ou « /\pirate.fr » sont compris par les navigateurs comme des adresses externes).
 */
function cheminSur(suite: unknown) {
  if (typeof suite !== "string" || !/^\/[^/\\]/.test(suite) || /[\u0000-\u001f\\]/.test(suite)) return "/espace";
  const url = new URL(suite, "http://local.invalid");
  return url.origin === "http://local.invalid" ? `${url.pathname}${url.search}` : "/espace";
}

/** Refuse l'action si la même adresse IP a trop essayé récemment. */
async function limiter(action: string, max: number, secondes: number) {
  return autoriser(`${action}:${await adresseIp()}`, max, secondes);
}

/**
 * Pré-compte créé par le bureau (ADM-04) : la personne qui s'inscrit ou demande un nouveau mot de
 * passe reçoit son lien d'invitation (même message à l'écran, pour ne pas révéler qui est inscrit).
 */
async function inviterSiPreCompte(email: string) {
  const compte = await prisma.user.findUnique({ where: { email }, select: { id: true, statut: true } });
  if (compte?.statut !== "INVITE") return false;
  await envoyerInvitation(compte.id);
  return true;
}

const motDePasse = z
  .string({ error: "Champ obligatoire." })
  .min(10, "10 caractères minimum.")
  .max(128, "128 caractères maximum.");

// ─── Inscription ───────────────────────────────────────────────────────────────

const schemaInscription = z
  .object({
    prenom: champ.texte(80),
    nom: champ.texte(80),
    promoEntree: champ.entier(PREMIERE_PROMO, new Date().getFullYear()),
    email: champ.email(),
    motDePasse,
    confirmation: z.string(),
    confidentialite: champ.case().refine((v) => v, "Merci d’accepter la politique de confidentialité."),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    path: ["confirmation"],
    message: "Les deux mots de passe ne sont pas identiques.",
  });

export async function inscrire(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("inscription", 5, 3600))) return { erreur: MESSAGE_LIMITE };
  const resultat = valider(schemaInscription, formData);
  if (!resultat.ok) return resultat.etat;
  const d = resultat.donnees;

  if (await inviterSiPreCompte(d.email)) {
    return { succes: `Merci ! Un e-mail a été envoyé à ${d.email} : suivez le lien qu’il contient pour activer votre compte.` };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: `${d.prenom} ${d.nom}`,
        email: d.email,
        password: d.motDePasse,
        prenom: d.prenom,
        nom: d.nom,
        promoEntree: d.promoEntree,
        callbackURL: "/espace",
      },
      headers: await headers(),
    });
  } catch (erreur) {
    return { erreur: messageErreur(erreur), valeurs: { prenom: d.prenom, nom: d.nom, email: d.email, promoEntree: String(d.promoEntree) } };
  }

  // Même message que l'adresse soit nouvelle ou déjà inscrite (pour ne pas révéler qui est inscrit).
  return {
    succes: `Merci ! Un e-mail de confirmation a été envoyé à ${d.email}. Cliquez sur le lien qu’il contient ; le bureau validera ensuite votre compte.`,
  };
}

// ─── Connexion / déconnexion ───────────────────────────────────────────────────

const schemaConnexion = z.object({
  email: champ.email(),
  motDePasse: z.string().min(1, "Champ obligatoire."),
  suite: z.string().optional(),
});

export async function connecter(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("connexion", 10, 900))) return { erreur: MESSAGE_LIMITE };
  const resultat = valider(schemaConnexion, formData);
  if (!resultat.ok) return resultat.etat;
  const d = resultat.donnees;

  try {
    await auth.api.signInEmail({
      body: { email: d.email, password: d.motDePasse, callbackURL: "/espace" },
      headers: await headers(),
    });
  } catch (erreur) {
    return { erreur: messageErreur(erreur), valeurs: { email: d.email } };
  }

  redirect(cheminSur(d.suite));
}

export async function deconnecter() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

// ─── Mot de passe oublié ───────────────────────────────────────────────────────

export async function demanderReinitialisation(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("reinitialisation", 5, 3600))) return { erreur: MESSAGE_LIMITE };
  const resultat = valider(z.object({ email: champ.email() }), formData);
  if (!resultat.ok) return resultat.etat;
  if (await inviterSiPreCompte(resultat.donnees.email)) {
    return { succes: "Si un compte existe avec cette adresse, un e-mail contenant un lien vient d’être envoyé." };
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email: resultat.donnees.email, redirectTo: "/reinitialiser-mot-de-passe" },
      headers: await headers(),
    });
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
  return {
    succes: "Si un compte existe avec cette adresse, un e-mail contenant un lien de réinitialisation vient d’être envoyé.",
  };
}

const schemaReinitialisation = z
  .object({ token: z.string().min(1), motDePasse, confirmation: z.string() })
  .refine((d) => d.motDePasse === d.confirmation, {
    path: ["confirmation"],
    message: "Les deux mots de passe ne sont pas identiques.",
  });

export async function reinitialiserMotDePasse(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("nouveau-mdp", 10, 3600))) return { erreur: MESSAGE_LIMITE };
  const resultat = valider(schemaReinitialisation, formData);
  if (!resultat.ok) return resultat.etat;

  try {
    await auth.api.resetPassword({
      body: { token: resultat.donnees.token, newPassword: resultat.donnees.motDePasse },
      headers: await headers(),
    });
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
  redirect("/connexion?reinitialise=1");
}

// ─── Espace « Mon compte » ─────────────────────────────────────────────────────

const schemaChangement = z
  .object({ actuel: z.string().min(1, "Champ obligatoire."), motDePasse, confirmation: z.string() })
  .refine((d) => d.motDePasse === d.confirmation, {
    path: ["confirmation"],
    message: "Les deux mots de passe ne sont pas identiques.",
  });

export async function changerMotDePasse(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("changement-mdp", 10, 900))) return { erreur: MESSAGE_LIMITE };
  await exigerConnexion();
  const resultat = valider(schemaChangement, formData);
  if (!resultat.ok) return { ...resultat.etat, valeurs: {} };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: resultat.donnees.actuel,
        newPassword: resultat.donnees.motDePasse,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
  return { succes: "Votre mot de passe a été modifié. Vos autres sessions ont été déconnectées." };
}

const schemaEmail = z.object({ email: champ.email(), motDePasseEmail: z.string().min(1, "Champ obligatoire.") });

/**
 * Changement de l'adresse de connexion : mot de passe actuel exigé, puis lien de confirmation
 * envoyé à la nouvelle adresse. L'adresse ne change qu'au clic sur ce lien.
 */
export async function changerEmail(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("changement-email", 5, 900))) return { erreur: MESSAGE_LIMITE };
  const { user } = await exigerConnexion();
  const resultat = valider(schemaEmail, formData);
  if (!resultat.ok) return { ...resultat.etat, valeurs: { email: String(formData.get("email") ?? "") } };
  const { email, motDePasseEmail: saisi } = resultat.donnees;

  if (email === user.email) {
    return { erreur: "Certains champs sont à corriger.", erreurs: { email: "C’est déjà votre adresse actuelle." }, valeurs: { email } };
  }

  try {
    await auth.api.verifyPassword({ body: { password: saisi }, headers: await headers() });
  } catch {
    return { erreur: "Certains champs sont à corriger.", erreurs: { motDePasseEmail: "Mot de passe incorrect." }, valeurs: { email } };
  }

  try {
    await auth.api.changeEmail({ body: { newEmail: email, callbackURL: "/espace/compte?email=modifie" }, headers: await headers() });
  } catch (erreur) {
    return { erreur: messageErreur(erreur), valeurs: { email } };
  }

  // Même message si l'adresse est déjà utilisée par un autre compte (pour ne pas révéler qui est inscrit).
  return {
    succes: `Un lien de confirmation a été envoyé à ${email}. Votre adresse de connexion changera dès que vous aurez cliqué dessus ; d’ici là, l’ancienne reste valable.`,
  };
}

export async function supprimerMonCompte(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("suppression", 10, 900))) return { erreur: MESSAGE_LIMITE };
  await exigerConnexion();
  const motDePasseSaisi = formData.get("motDePasseSuppression");
  if (typeof motDePasseSaisi !== "string" || !motDePasseSaisi) {
    return { erreur: "Saisissez votre mot de passe pour confirmer.", erreurs: { motDePasseSuppression: "Champ obligatoire." } };
  }

  try {
    await auth.api.deleteUser({ body: { password: motDePasseSaisi }, headers: await headers() });
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
  redirect("/?compte-supprime=1");
}
