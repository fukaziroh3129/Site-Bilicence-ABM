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
import { alerteSecurite, envoyerEmail } from "@/lib/email";
import { MESSAGE_LIMITE, adresseIp, autoriser, autoriserPour } from "@/lib/limite";
import { CODES_FONCTION, PROFILS } from "@/lib/profils";
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
  PROPRIETAIRE: "Vous êtes propriétaire du site : transmettez d’abord votre titre à un autre membre du bureau (Administration → Comptes).",
  // Double authentification
  INVALID_CODE: "Code incorrect. Vérifiez l’heure de votre téléphone et saisissez le code affiché maintenant.",
  INVALID_BACKUP_CODE: "Ce code de secours n’est pas valable (chaque code ne sert qu’une fois).",
  INVALID_TWO_FACTOR_COOKIE: "La vérification a expiré. Reconnectez-vous.",
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Trop d’essais. Reconnectez-vous pour recommencer.",
  ACCOUNT_TEMPORARILY_LOCKED: "Trop d’essais incorrects : la vérification est bloquée quelques minutes.",
  TOTP_ALREADY_ENABLED: "La double authentification est déjà activée.",
  TOTP_NOT_ENABLED: "La double authentification n’est pas activée sur ce compte.",
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

// Adhésion = création de compte. Un étudiant ou ancien indique sa promotion ; un membre du personnel de
// l'université, sa fonction (src/lib/profils.ts).
const schemaInscription = z
  .object({
    profil: z.enum(PROFILS, { error: "Choisissez votre situation." }),
    prenom: champ.texte(80),
    nom: champ.texte(80),
    promoEntree: champ.entierFacultatif(PREMIERE_PROMO, new Date().getFullYear()),
    fonction: champ.texteFacultatif(40),
    email: champ.email(),
    motDePasse,
    confirmation: z.string(),
    confidentialite: champ.case().refine((v) => v, "Merci d’accepter la politique de confidentialité."),
  })
  .superRefine((d, ctx) => {
    if (d.profil === "ALUMNI" && d.promoEntree === null) {
      ctx.addIssue({ code: "custom", path: ["promoEntree"], message: "Champ obligatoire." });
    }
    if (d.profil === "PERSONNEL" && !CODES_FONCTION.includes(d.fonction ?? "")) {
      ctx.addIssue({ code: "custom", path: ["fonction"], message: "Champ obligatoire." });
    }
    if (d.motDePasse !== d.confirmation) {
      ctx.addIssue({ code: "custom", path: ["confirmation"], message: "Les deux mots de passe ne sont pas identiques." });
    }
  });

export async function inscrire(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const resultat = valider(schemaInscription, formData);
  if (!resultat.ok) return resultat.etat;
  const d = resultat.donnees;
  if (!(await autoriserPour("inscription", d.email, [5, 3600], [3, 3600]))) return { erreur: MESSAGE_LIMITE };

  if (await inviterSiPreCompte(d.email)) {
    return { succes: `Merci ! Un e-mail a été envoyé à ${d.email} : suivez le lien qu’il contient pour activer votre compte.` };
  }

  const personnel = d.profil === "PERSONNEL";
  try {
    await auth.api.signUpEmail({
      body: {
        name: `${d.prenom} ${d.nom}`,
        email: d.email,
        password: d.motDePasse,
        prenom: d.prenom,
        nom: d.nom,
        profil: d.profil,
        // Un compte du personnel n'a pas de promotion ; un étudiant ou ancien n'a pas de fonction.
        promoEntree: personnel ? null : d.promoEntree,
        fonction: personnel ? d.fonction : null,
        callbackURL: "/espace",
      },
      headers: await headers(),
    });
  } catch (erreur) {
    return {
      erreur: messageErreur(erreur),
      valeurs: { profil: d.profil, prenom: d.prenom, nom: d.nom, email: d.email, promoEntree: String(d.promoEntree ?? ""), fonction: d.fonction ?? "" },
    };
  }

  // Même message que l'adresse soit nouvelle ou déjà inscrite (pour ne pas révéler qui est inscrit).
  return {
    succes: `Merci ! Un e-mail de confirmation a été envoyé à ${d.email}. Cliquez sur le lien qu’il contient ; le bureau validera ensuite votre adhésion.`,
  };
}

// ─── Connexion / déconnexion ───────────────────────────────────────────────────

const schemaConnexion = z.object({
  email: champ.email(),
  motDePasse: z.string().min(1, "Champ obligatoire."),
  suite: z.string().optional(),
});

export async function connecter(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const resultat = valider(schemaConnexion, formData);
  if (!resultat.ok) return resultat.etat;
  const d = resultat.donnees;
  if (!(await autoriserPour("connexion", d.email, [10, 900], [10, 3600]))) return { erreur: MESSAGE_LIMITE };

  let reponse;
  try {
    reponse = await auth.api.signInEmail({
      body: { email: d.email, password: d.motDePasse, callbackURL: "/espace" },
      headers: await headers(),
    });
  } catch (erreur) {
    return { erreur: messageErreur(erreur), valeurs: { email: d.email } };
  }

  // Double authentification activée : le mot de passe est bon, il reste le code (aucune session encore).
  if ("twoFactorRedirect" in reponse && reponse.twoFactorRedirect) {
    redirect(`/connexion/verification?suite=${encodeURIComponent(cheminSur(d.suite))}`);
  }
  redirect(cheminSur(d.suite));
}

// ─── Double authentification (facultative, « Mon compte ») ─────────────────────

const schemaCode = z.object({
  code: z.string({ error: "Champ obligatoire." }).trim().min(6, "Code incomplet.").max(20, "Code trop long."),
  secours: champ.case(),
  confiance: champ.case(),
  suite: z.string().optional(),
});

/** Connexion, 2e étape : code de l'application d'authentification, ou code de secours. */
export async function verifierCodeConnexion(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("double-auth", 10, 900))) return { erreur: MESSAGE_LIMITE };
  const resultat = valider(schemaCode, formData);
  if (!resultat.ok) return { ...resultat.etat, valeurs: {} };
  const { code, secours, confiance, suite } = resultat.donnees;

  try {
    const body = { code: secours ? code : code.replace(/\s/g, ""), trustDevice: confiance };
    if (secours) await auth.api.verifyBackupCode({ body, headers: await headers() });
    else await auth.api.verifyTOTP({ body, headers: await headers() });
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
  redirect(cheminSur(suite));
}

/** Ce que renvoie l'activation : le QR code à scanner, la clé à saisir à la main, les codes de secours. */
export type EtatActivation = (NonNullable<EtatFormulaire> & { qr?: string; cle?: string; codes?: string[] }) | null;

/** Activation, étape 1 : mot de passe vérifié, création de la clé (pas encore active tant qu'un code n'est pas confirmé). */
export async function preparerDoubleAuth(_etat: EtatActivation, formData: FormData): Promise<EtatActivation> {
  if (!(await limiter("double-auth-reglage", 10, 900))) return { erreur: MESSAGE_LIMITE };
  await exigerConnexion();
  const motDePasse = formData.get("motDePasseDoubleAuth");
  if (typeof motDePasse !== "string" || !motDePasse) {
    return { erreur: "Certains champs sont à corriger.", erreurs: { motDePasseDoubleAuth: "Champ obligatoire." } };
  }

  try {
    const { totpURI, backupCodes } = (await auth.api.enableTwoFactor({ body: { password: motDePasse }, headers: await headers() })) as {
      totpURI: string;
      backupCodes: string[];
    };
    const { toDataURL } = await import("qrcode");
    return {
      qr: await toDataURL(totpURI, { margin: 1, width: 220 }),
      cle: new URL(totpURI).searchParams.get("secret") ?? undefined,
      codes: backupCodes,
    };
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
}

/** Activation, étape 2 : un premier code de l'application prouve que tout fonctionne. */
export async function confirmerDoubleAuth(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("double-auth-reglage", 10, 900))) return { erreur: MESSAGE_LIMITE };
  const { user } = await exigerConnexion();
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { erreur: "Certains champs sont à corriger.", erreurs: { code: "Saisissez les 6 chiffres affichés." } };

  try {
    await auth.api.verifyTOTP({ body: { code }, headers: await headers() });
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
  void envoyerEmail({
    a: user.email,
    sujet: "Double authentification activée",
    texte: alerteSecurite("La double authentification vient d’être activée sur votre compte du site ABM."),
  });
  redirect("/espace/compte?double-auth=active#double-auth");
}

export async function desactiverDoubleAuth(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await limiter("double-auth-reglage", 10, 900))) return { erreur: MESSAGE_LIMITE };
  const { user } = await exigerConnexion();
  const motDePasse = formData.get("motDePasseDoubleAuth");
  if (typeof motDePasse !== "string" || !motDePasse) {
    return { erreur: "Certains champs sont à corriger.", erreurs: { motDePasseDoubleAuth: "Champ obligatoire." } };
  }

  try {
    await auth.api.disableTwoFactor({ body: { password: motDePasse }, headers: await headers() });
  } catch (erreur) {
    return { erreur: messageErreur(erreur) };
  }
  void envoyerEmail({
    a: user.email,
    sujet: "Double authentification désactivée",
    texte: alerteSecurite("La double authentification vient d’être désactivée sur votre compte du site ABM."),
  });
  redirect("/espace/compte?double-auth=desactivee#double-auth");
}

export async function deconnecter() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

// ─── Mot de passe oublié ───────────────────────────────────────────────────────

export async function demanderReinitialisation(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const resultat = valider(z.object({ email: champ.email() }), formData);
  if (!resultat.ok) return resultat.etat;
  if (!(await autoriserPour("reinitialisation", resultat.donnees.email, [5, 3600], [3, 3600]))) return { erreur: MESSAGE_LIMITE };
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
  const { user } = await exigerConnexion();
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
  void envoyerEmail({
    a: user.email,
    sujet: "Votre mot de passe a été modifié",
    texte: alerteSecurite("Le mot de passe de votre compte sur le site ABM vient d’être modifié depuis « Mon compte »."),
  });
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
  // L'ancienne adresse est prévenue : si quelqu'un a pris la main sur la session, la personne le saura.
  void envoyerEmail({
    a: user.email,
    sujet: "Demande de changement d’adresse e-mail",
    texte: alerteSecurite(
      `Une demande a été faite pour remplacer l’adresse de connexion de votre compte sur le site ABM par ${email}. Elle ne prendra effet que lorsque le lien envoyé à cette nouvelle adresse aura été cliqué.`,
    ),
  });

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
