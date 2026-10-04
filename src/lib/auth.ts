// Configuration de l'authentification (Better Auth) : inscription, connexion, sessions,
// vérification de l'adresse e-mail, mot de passe oublié, suppression de compte.
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adresseSite, emailsAdmins, envoyerEmail } from "@/lib/email";
import { PREMIERE_PROMO } from "@/lib/format";
import { supprimerRapportsDe } from "@/lib/rapports";

/**
 * Le lien cliqué confirme-t-il un changement d'adresse (et non une inscription) ? Le jeton, déjà
 * vérifié par Better Auth, indique le type de demande.
 */
function estChangementEmail(request?: Request) {
  try {
    const jeton = request ? new URL(request.url).searchParams.get("token") : null;
    const contenu = JSON.parse(Buffer.from(jeton?.split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof contenu.updateTo === "string";
  } catch {
    return false;
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  telemetry: { enabled: false },

  emailAndPassword: {
    enabled: true,
    // Il faut avoir cliqué sur le lien reçu par e-mail avant de pouvoir se connecter.
    requireEmailVerification: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      void envoyerEmail({
        a: user.email,
        sujet: "Réinitialisation de votre mot de passe",
        texte: [
          "Bonjour,",
          "",
          "Pour choisir un nouveau mot de passe sur le site ABM, suivez ce lien (valable une heure) :",
          url,
          "",
          "Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.",
        ].join("\n"),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Changement d'adresse (Mon compte) : le lien est envoyé à la NOUVELLE adresse, qui diffère
      // alors de celle enregistrée. Sinon, il s'agit d'une inscription.
      const enregistre = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
      if (enregistre && enregistre.email !== user.email) {
        void envoyerEmail({
          a: user.email,
          sujet: "Confirmez votre nouvelle adresse e-mail",
          texte: [
            "Bonjour,",
            "",
            "Vous avez demandé à utiliser cette adresse pour vous connecter au site d’Alumni Bi-Licence Montpellier.",
            "Pour confirmer le changement, suivez ce lien :",
            url,
            "",
            `Tant que vous n’avez pas cliqué, votre ancienne adresse (${enregistre.email}) reste valable.`,
            "Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.",
          ].join("\n"),
        });
        return;
      }
      void envoyerEmail({
        a: user.email,
        sujet: "Confirmez votre adresse e-mail",
        texte: [
          "Bonjour,",
          "",
          "Merci pour votre inscription sur le site d’Alumni Bi-Licence Montpellier.",
          "Pour confirmer votre adresse e-mail, suivez ce lien :",
          url,
          "",
          "Votre compte sera ensuite validé par le bureau.",
        ].join("\n"),
      });
    },
    // Une fois l'adresse confirmée, on prévient le bureau qu'un compte attend sa validation.
    afterEmailVerification: async (user, request) => {
      // Aussi appelé après un changement d'adresse : on ne prévient le bureau que pour un nouveau compte.
      if ((user as { statut?: string }).statut !== "EN_ATTENTE" || estChangementEmail(request)) return;
      void envoyerEmail({
        a: await emailsAdmins(),
        sujet: "Nouveau compte à valider",
        texte: [
          `${user.name} (${user.email}) vient de créer un compte.`,
          "",
          "Pour le valider ou le refuser :",
          adresseSite("/admin/comptes"),
        ].join("\n"),
      });
    },
  },

  user: {
    additionalFields: {
      // Validateurs : s'appliquent aussi aux appels directs à l'API d'authentification,
      // pas seulement au formulaire du site.
      prenom: { type: "string", required: true, validator: { input: z.string().trim().min(1).max(80) } },
      nom: { type: "string", required: true, validator: { input: z.string().trim().min(1).max(80) } },
      promoEntree: {
        type: "number",
        required: false,
        validator: { input: z.number().int().min(PREMIERE_PROMO).max(new Date().getFullYear()).nullish() },
      },
      // Champs que l'utilisateur ne peut pas modifier lui-même (input: false)
      statut: { type: ["INVITE", "EN_ATTENTE", "ACTIF", "REFUSE"], defaultValue: "EN_ATTENTE", input: false },
      role: { type: ["MEMBRE", "ANIMATEUR", "ADMIN", "PROPRIETAIRE"], defaultValue: "MEMBRE", input: false },
      personneId: { type: "string", required: false, input: false },
    },
    // Changement d'adresse de connexion (Mon compte) : le mot de passe actuel est vérifié par le
    // site avant l'appel, puis un lien de confirmation est envoyé à la nouvelle adresse.
    changeEmail: { enabled: true },
    deleteUser: {
      enabled: true,
      // Supprimer son compte supprime aussi sa fiche (droit à l'effacement, RGPD).
      beforeDelete: async (user) => {
        const compte = await prisma.user.findUnique({
          where: { id: user.id },
          select: { personneId: true },
        });
        if (compte?.personneId) {
          await supprimerRapportsDe(compte.personneId);
          await prisma.personne.delete({ where: { id: compte.personneId } });
        }
      },
    },
  },

  // Refuse les noms anormalement longs envoyés directement à l'API.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (typeof user.name !== "string" || user.name.length > 170) return false;
          return { data: user };
        },
      },
    },
  },

  // Limite de requêtes de l'API d'authentification (activée aussi en développement).
  rateLimit: { enabled: true, window: 60, max: 60 },

  // Permet aux « server actions » de Next.js de poser les cookies de session.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
