// Envoi des e-mails du site (validation de compte, mot de passe oublié, nouvelles offres…).
// Sans configuration SMTP (en local), les e-mails sont simplement affichés dans le terminal.
import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "@/lib/db";

type Email = {
  a: string | string[];
  sujet: string;
  texte: string;
  /** Envoi en copie cachée (pour les envois groupés, sans dévoiler les adresses). */
  copieCachee?: boolean;
  /** Adresse à laquelle répondre (ex. l'auteur d'un message de contact). */
  repondreA?: string;
};

let transport: Transporter | null = null;

function obtenirTransport() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return transport;
}

export async function envoyerEmail({ a, sujet, texte, copieCachee = false, repondreA }: Email) {
  const destinataires = Array.isArray(a) ? a : [a];
  if (destinataires.length === 0) return;

  if (!process.env.SMTP_HOST) {
    console.log(
      [
        "",
        "──── E-mail (non envoyé : SMTP non configuré) ────",
        `À : ${destinataires.join(", ")}`,
        `Sujet : ${sujet}`,
        ...(repondreA ? [`Répondre à : ${repondreA}`] : []),
        "",
        texte,
        "──────────────────────────────────────────────────",
      ].join("\n"),
    );
    return;
  }

  const expediteur = process.env.EMAIL_EXPEDITEUR;
  if (copieCachee) {
    // Par paquets de 50 destinataires pour rester sous les limites du fournisseur.
    for (let i = 0; i < destinataires.length; i += 50) {
      await obtenirTransport().sendMail({
        from: expediteur,
        to: expediteur,
        bcc: destinataires.slice(i, i + 50),
        subject: sujet,
        text: texte,
      });
    }
  } else {
    await obtenirTransport().sendMail({ from: expediteur, to: destinataires, subject: sujet, text: texte, replyTo: repondreA });
  }
}

/** Adresse publique du site, pour construire les liens dans les e-mails. */
export function adresseSite(chemin = "") {
  return `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}${chemin}`;
}

/** E-mails des membres du bureau (animateurs, administrateurs, propriétaire) : comptes et offres à traiter. */
export async function emailsAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ANIMATEUR", "ADMIN", "PROPRIETAIRE"] }, statut: "ACTIF" },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

/** E-mails de tous les membres actifs. */
export async function emailsMembresActifs() {
  const membres = await prisma.user.findMany({
    where: { statut: "ACTIF", emailVerified: true },
    select: { email: true },
  });
  return membres.map((m) => m.email);
}
