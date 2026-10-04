"use server";

// Pré-comptes (patch ADM-04) : import d'une base (CSV) avec aperçu, envoi des liens d'invitation,
// et activation du compte par la personne invitée (action publique, limitée).

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { colonnes, lireCsv, texteDuFichier } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { PREMIERE_PROMO, normaliser } from "@/lib/format";
import { champ, valider, type EtatFormulaire } from "@/lib/formulaire";
import { creerLienInvitation, envoyerInvitation, trouverInvitation } from "@/lib/invitations";
import { MESSAGE_LIMITE, adresseIp, autoriser } from "@/lib/limite";
import { trouverOuCreerEtablissement } from "@/lib/liste-etablissements";
import { peutGererCompte } from "@/lib/roles";
import { exigerAdmin } from "@/lib/session";

/** Nombre maximum de lignes par import (les bases de master font quelques dizaines de personnes). */
const LIGNES_MAX = 1000;

const schemaLigne = z.object({
  prenom: z.string().trim().min(1).max(80),
  nom: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  promoEntree: z.number().int().min(PREMIERE_PROMO).max(new Date().getFullYear()),
  formation: z.string().trim().max(160).nullable(),
  etablissement: z.string().trim().max(160).nullable(),
  /** Fiche existante (sans compte) à laquelle rattacher le pré-compte. */
  ficheId: z.string().nullable(),
});
type LigneImport = z.infer<typeof schemaLigne>;

export type LigneApercu = {
  numero: number;
  prenom: string;
  nom: string;
  email: string;
  promo: string;
  formation: string;
  /** nouveau : compte + fiche créés ; rattache : compte rattaché à une fiche existante ; ignore / erreur : rien n'est créé. */
  statut: "nouveau" | "rattache" | "ignore" | "erreur";
  detail: string;
};

export type EtatImport = {
  erreur?: string;
  succes?: string;
  apercu?: LigneApercu[];
  /** Lignes valides, renvoyées telles quelles à la confirmation (revérifiées par le serveur). */
  donnees?: string;
} | null;

/** Promotion d'entrée : « 2021 », « 2021-2024 » ou « Promo 2021-2024 » → 2021. */
function lirePromo(texte: string | undefined) {
  const annee = texte?.match(/(20\d\d)/)?.[1];
  return annee ? Number(annee) : null;
}

/** Étape 1 : lit le fichier et montre ce qui sera créé, sans rien écrire. */
export async function analyserImport(_etat: EtatImport, formData: FormData): Promise<EtatImport> {
  await exigerAdmin();
  const fichier = await texteDuFichier(formData.get("fichier"));
  if ("erreur" in fichier) return { erreur: fichier.erreur };
  const promoParDefaut = lirePromo(String(formData.get("promoParDefaut") ?? ""));

  const [entete, ...lignes] = lireCsv(fichier.texte);
  if (!entete || lignes.length === 0) return { erreur: "Le fichier est vide." };
  if (lignes.length > LIGNES_MAX) return { erreur: `${LIGNES_MAX} lignes au maximum par fichier.` };
  const col = colonnes(entete, {
    prenom: ["prenom", "prenoms", "first name"],
    nom: ["nom", "nom de famille", "last name"],
    email: ["email", "e mail", "mail", "adresse e mail", "adresse mail", "courriel", "adresse electronique"],
    promo: ["promo", "promotion", "annee", "annee d entree", "promotion d entree"],
    formation: ["formation", "master", "intitule", "diplome", "mention"],
    etablissement: ["etablissement", "universite", "ecole", "lieu"],
  });
  if (col.prenom < 0 || col.nom < 0 || col.email < 0) {
    return { erreur: "Colonnes « prénom », « nom » et « e-mail » obligatoires : la première ligne du fichier doit contenir ces titres." };
  }

  const [comptes, fichesLibres] = await Promise.all([
    prisma.user.findMany({ select: { email: true } }),
    prisma.personne.findMany({ where: { compte: null }, select: { id: true, prenom: true, nom: true, promoEntree: true } }),
  ]);
  const emailsPris = new Set(comptes.map((c) => c.email.toLowerCase()));
  const fichesPrises = new Set<string>();
  const apercu: LigneApercu[] = [];
  const valides: LigneImport[] = [];

  lignes.forEach((l, i) => {
    const cellule = (c: number) => (c >= 0 ? (l[c] ?? "").replace(/\s+/g, " ").trim() : "");
    const prenom = cellule(col.prenom);
    const nom = cellule(col.nom);
    const email = cellule(col.email).toLowerCase();
    const promo = lirePromo(cellule(col.promo)) ?? promoParDefaut;
    const formation = cellule(col.formation) || null;
    const etablissement = cellule(col.etablissement) || null;
    const base = { numero: i + 2, prenom, nom, email, promo: promo ? String(promo) : "—", formation: [formation, etablissement].filter(Boolean).join(" — ") };
    if (!prenom && !nom && !email) return;

    const ligne = { prenom, nom, email, promoEntree: promo ?? 0, formation, etablissement, ficheId: null as string | null };
    const verif = schemaLigne.safeParse(ligne);
    if (!verif.success) {
      const champ = String(verif.error.issues[0].path[0]);
      const detail = champ === "email" ? "adresse e-mail invalide" : champ === "promoEntree" ? "promotion manquante ou invalide" : `${champ} manquant ou trop long`;
      apercu.push({ ...base, statut: "erreur", detail });
      return;
    }
    if (emailsPris.has(email)) {
      apercu.push({ ...base, statut: "ignore", detail: "un compte existe déjà avec cette adresse" });
      return;
    }
    emailsPris.add(email);

    // Fiche déjà présente (import de l'Excel, saisie du bureau) : même prénom et nom, sans compte.
    const memeNom = fichesLibres.filter((f) => !fichesPrises.has(f.id) && normaliser(f.nom) === normaliser(nom) && normaliser(f.prenom) === normaliser(prenom));
    const fiche = memeNom.find((f) => f.promoEntree === promo) ?? (memeNom.length === 1 ? memeNom[0] : undefined);
    if (fiche) {
      fichesPrises.add(fiche.id);
      valides.push({ ...verif.data, ficheId: fiche.id });
      apercu.push({ ...base, statut: "rattache", detail: "fiche existante complétée (la formation n’est pas ajoutée)" });
    } else {
      valides.push(verif.data);
      apercu.push({ ...base, statut: "nouveau", detail: "compte et fiche créés" });
    }
  });

  if (apercu.length === 0) return { erreur: "Aucune ligne à importer." };
  return { apercu, donnees: JSON.stringify(valides) };
}

/** Étape 2 : crée les pré-comptes (et les fiches) vus dans l'aperçu. Les liens ne sont pas encore envoyés. */
export async function confirmerImport(_etat: EtatImport, formData: FormData): Promise<EtatImport> {
  const { user } = await exigerAdmin();
  let lignes: LigneImport[];
  try {
    lignes = z.array(schemaLigne).max(LIGNES_MAX).parse(JSON.parse(String(formData.get("donnees") ?? "[]")));
  } catch {
    return { erreur: "Import invalide : recommencez depuis le fichier." };
  }

  let crees = 0;
  for (const l of lignes) {
    // Revérifié au moment de créer (un compte a pu être créé entre l'aperçu et la confirmation).
    if (await prisma.user.findUnique({ where: { email: l.email }, select: { id: true } })) continue;
    const ficheLibre = l.ficheId ? await prisma.personne.findFirst({ where: { id: l.ficheId, compte: null }, select: { id: true } }) : null;

    let personneId = ficheLibre?.id;
    if (!personneId) {
      const etablissement = l.formation && l.etablissement ? await trouverOuCreerEtablissement(l.etablissement, { ajouteParId: user.id, aControler: true }) : null;
      const personne = await prisma.personne.create({
        data: {
          prenom: l.prenom,
          nom: l.nom,
          promoEntree: l.promoEntree,
          emailContact: l.email,
          ...(etablissement && l.formation
            ? { formations: { create: { intitule: l.formation, etablissement: etablissement.nom, etablissementId: etablissement.id } } }
            : {}),
        },
      });
      personneId = personne.id;
    }

    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: l.email,
        name: `${l.prenom} ${l.nom}`,
        prenom: l.prenom,
        nom: l.nom,
        promoEntree: l.promoEntree,
        emailVerified: false,
        statut: "INVITE",
        personneId,
      },
    });
    crees++;
  }

  revalidatePath("/", "layout");
  return { succes: `${crees} pré-compte(s) créé(s). Envoyez maintenant les invitations depuis la liste ci-dessous.` };
}

/** Vérifie qu'on peut agir sur ce pré-compte et le renvoie. */
async function preCompte(formData: FormData) {
  const { user } = await exigerAdmin();
  const cible = await prisma.user.findUnique({ where: { id: String(formData.get("userId")) }, select: { id: true, role: true, statut: true } });
  if (!cible || cible.statut !== "INVITE" || !peutGererCompte(user, cible)) return null;
  return cible;
}

/** Envoie (ou renvoie) le lien d'invitation par e-mail. */
export async function envoyerUneInvitation(formData: FormData) {
  const cible = await preCompte(formData);
  if (!cible) return;
  await envoyerInvitation(cible.id);
  revalidatePath("/admin/invitations");
}

/** Envoie le lien à tous les pré-comptes qui ne l'ont pas encore reçu. */
export async function envoyerToutesInvitations() {
  await exigerAdmin();
  const aInviter = await prisma.user.findMany({ where: { statut: "INVITE", invitationEnvoyeeLe: null }, select: { id: true } });
  for (const u of aInviter) await envoyerInvitation(u.id);
  revalidatePath("/admin/invitations");
}

/** Crée un lien à transmettre soi-même (message, réseau social…) ; l'ancien lien cesse de fonctionner. */
export async function genererLienInvitation(_etat: { lien?: string } | null, formData: FormData) {
  const cible = await preCompte(formData);
  if (!cible) return null;
  return { lien: await creerLienInvitation(cible.id) };
}

// ─── Activation par la personne invitée (page publique /invitation/[jeton]) ───

const schemaActivation = z
  .object({
    jeton: z.string().min(20).max(100),
    motDePasse: z.string({ error: "Champ obligatoire." }).min(10, "10 caractères minimum.").max(128, "128 caractères maximum."),
    confirmation: z.string(),
    confidentialite: champ.case().refine((v) => v, "Merci d’accepter la politique de confidentialité."),
  })
  .refine((d) => d.motDePasse === d.confirmation, { path: ["confirmation"], message: "Les deux mots de passe ne sont pas identiques." });

export async function activerInvitation(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!autoriser(`invitation:${await adresseIp()}`, 10, 900)) return { erreur: MESSAGE_LIMITE };
  const resultat = valider(schemaActivation, formData);
  if (!resultat.ok) return resultat.etat;
  const { jeton, motDePasse } = resultat.donnees;

  const invitation = await trouverInvitation(jeton);
  if (!invitation) return { erreur: "Ce lien n’est plus valable. Demandez-en un nouveau au bureau." };
  const { user } = invitation;

  await prisma.$transaction([
    prisma.account.deleteMany({ where: { userId: user.id, providerId: "credential" } }),
    prisma.account.create({
      data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: await hashPassword(motDePasse) },
    }),
    // Le lien a été reçu sur cette adresse : elle est confirmée. Le bureau a déjà validé la personne.
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, statut: "ACTIF" } }),
    prisma.verification.delete({ where: { id: invitation.verificationId } }),
  ]);

  try {
    await auth.api.signInEmail({ body: { email: user.email, password: motDePasse }, headers: await headers() });
  } catch {
    redirect("/connexion");
  }
  revalidatePath("/", "layout");
  redirect("/espace/ma-fiche?bienvenue=1");
}
