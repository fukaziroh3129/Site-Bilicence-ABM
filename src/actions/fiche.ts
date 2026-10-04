"use server";

// Actions de modification d'une fiche (informations, formations, stages et emplois).
// Utilisées par le membre pour sa propre fiche et par le bureau pour toutes les fiches.

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { exigerDroitSurFiche, pageDeFiche } from "@/lib/acces";
import { ETAPES_FICHE } from "@/lib/completude";
import { prisma } from "@/lib/db";
import { enregistrerPdf, supprimerRapport, verifierPdf } from "@/lib/fichiers";
import { PREMIERE_PROMO } from "@/lib/format";
import { champ, valider, valeursDe, type EtatFormulaire } from "@/lib/formulaire";
import { MAX_DOMAINES_PAR_FICHE, chargerDomaines, trouverOuAjouterDomaine } from "@/lib/domaines";
import { CODES_PAYS, trouverOuAjouterUniversite, trouverOuCreerEtablissement } from "@/lib/liste-etablissements";
import { lireMotif, motifSuppression, noterModification } from "@/lib/notes";
import { estDuBureau } from "@/lib/roles";
import { exigerCompte } from "@/lib/session";

/** Qui modifie la fiche : sert aux notes de modification et aux ajouts à la liste commune. */
async function contexteFiche(personneId: string) {
  const { session, estProprietaire } = await exigerDroitSurFiche(personneId);
  const { user } = session;
  return {
    estProprietaire,
    contexte: { personneId, estProprietaire, auteur: user },
    // Ce qu'un membre ajoute (domaine, établissement) est utilisable tout de suite, puis contrôlé par le bureau.
    ajout: { ajouteParId: user.id, aControler: !estDuBureau(user.role) },
  };
}

function rafraichir(personneId: string) {
  revalidatePath("/espace", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/promotions");
  revalidatePath("/admin/domaines");
  revalidatePath("/erasmus");
  revalidatePath(`/espace/annuaire/${personneId}`);
}

// ─── Créer sa fiche (si le bureau ne l'a pas encore rattachée) ─────────────────

export async function creerMaFiche() {
  // Possible dès l'inscription (compte en attente) : la fiche reste cachée jusqu'à la validation.
  const { user } = await exigerCompte();
  if (user.personneId) redirect("/espace/ma-fiche");

  const personne = await prisma.personne.create({
    data: {
      prenom: user.prenom,
      nom: user.nom,
      promoEntree: user.promoEntree ?? new Date().getFullYear(),
      emailContact: user.email,
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { personneId: personne.id } });
  redirect("/espace/ma-fiche");
}

// ─── Informations générales ────────────────────────────────────────────────────

const STATUTS_ACTUELS = ["EN_LICENCE", "EN_MASTER", "EN_DOCTORAT", "EN_ALTERNANCE", "EN_POSTE", "CESURE", "EN_RECHERCHE"] as const;

/** Codes de domaines acceptés dans un formulaire (la liste vient de la base). */
async function codesDomaines() {
  return (await chargerDomaines()).map((d) => d.code);
}

const schemaInfos = (codes: string[]) => z.object({
  personneId: z.string().min(1),
  prenom: champ.texte(80),
  nom: champ.texte(80),
  promoEntree: champ.entier(PREMIERE_PROMO, new Date().getFullYear()),
  statutActuel: champ.choixFacultatif(STATUTS_ACTUELS),
  situationActuelle: champ.texteFacultatif(120),
  structureActuelle: champ.texteFacultatif(120),
  ville: champ.texteFacultatif(80),
  secteurs: champ.liste(codes),
  nouveauDomaine: champ.texteFacultatif(60),
  presentation: champ.texteFacultatif(200),
  conseil: champ.texteFacultatif(300),
  linkedin: champ.lienFacultatif(),
  emailContact: champ.emailFacultatif(),
  telephone: champ.texteFacultatif(30),
  afficherLinkedin: champ.case(),
  afficherEmail: champ.case(),
  afficherTelephone: champ.case(),
  consentementPublic: champ.case(),
});

/** Ajoute le domaine proposé aux domaines cochés ; renvoie une erreur s'il y en a trop. */
async function domainesChoisis(
  secteurs: string[],
  nouveauDomaine: string | null,
  formData: FormData,
  ajout: { ajouteParId: string; aControler: boolean },
) {
  if (secteurs.length + (nouveauDomaine ? 1 : 0) > MAX_DOMAINES_PAR_FICHE) {
    return {
      erreur: {
        erreur: "Certains champs sont à corriger.",
        erreurs: { secteurs: `${MAX_DOMAINES_PAR_FICHE} domaines au maximum (domaine proposé compris).` },
        valeurs: valeursDe(formData),
      } satisfies EtatFormulaire,
    };
  }
  if (nouveauDomaine) {
    const code = await trouverOuAjouterDomaine(nouveauDomaine, ajout);
    if (!secteurs.includes(code)) secteurs.push(code);
  }
  return { secteurs };
}

/** On garde la date à laquelle l'accord public a été donné (preuve du consentement). */
async function dateConsentement(personneId: string, consentement: boolean) {
  if (!consentement) return null;
  const avant = await prisma.personne.findUniqueOrThrow({ where: { id: personneId }, select: { consentementPublicLe: true } });
  return avant.consentementPublicLe ?? new Date();
}

export async function modifierInfos(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const resultat = valider(schemaInfos(await codesDomaines()), formData);
  if (!resultat.ok) return resultat.etat;
  const { personneId, nouveauDomaine, ...d } = resultat.donnees;
  const { contexte, ajout } = await contexteFiche(personneId);
  const motif = await lireMotif(contexte, formData);
  if ("erreur" in motif) return motif.erreur;

  const domaines = await domainesChoisis(d.secteurs, nouveauDomaine, formData, ajout);
  if (domaines.erreur) return domaines.erreur;

  await prisma.personne.update({
    where: { id: personneId },
    data: { ...d, secteurs: domaines.secteurs, consentementPublicLe: await dateConsentement(personneId, d.consentementPublic) },
  });
  await noterModification(contexte, "Informations générales", motif.motif);

  rafraichir(personneId);
  return { succes: "Informations enregistrées." };
}

// ─── « Ma fiche » par étapes ───────────────────────────────────────────────────
// Chaque étape n'enregistre que ses propres champs, puis passe à l'étape suivante.

const schemasEtapes = {
  identite: () =>
    z.object({
      prenom: champ.texte(80),
      nom: champ.texte(80),
      promoEntree: champ.entier(PREMIERE_PROMO, new Date().getFullYear()),
      ville: champ.texteFacultatif(80),
      linkedin: champ.lienFacultatif(),
      emailContact: champ.emailFacultatif(),
      telephone: champ.texteFacultatif(30),
      afficherLinkedin: champ.case(),
      afficherEmail: champ.case(),
      afficherTelephone: champ.case(),
    }),
  aujourdhui: (codes: string[]) =>
    z.object({
      statutActuel: champ.choixFacultatif(STATUTS_ACTUELS),
      situationActuelle: champ.texteFacultatif(120),
      structureActuelle: champ.texteFacultatif(120),
      secteurs: champ.liste(codes),
      nouveauDomaine: champ.texteFacultatif(60),
    }),
  carte: () =>
    z.object({
      presentation: champ.texteFacultatif(200),
      conseil: champ.texteFacultatif(300),
      consentementPublic: champ.case(),
    }),
};

export async function enregistrerEtapeFiche(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const etape = formData.get("etape");
  const personneId = String(formData.get("personneId") ?? "");
  if (etape !== "identite" && etape !== "aujourdhui" && etape !== "carte") return { erreur: "Étape inconnue." };
  const { estProprietaire, ajout } = await contexteFiche(personneId);
  // L'assistant sert à remplir sa propre fiche ; le bureau passe par l'éditeur complet (avec motif).
  if (!estProprietaire) return { erreur: "Le bureau modifie les fiches depuis l’administration." };

  if (etape === "aujourdhui") {
    const resultat = valider(schemasEtapes.aujourdhui(await codesDomaines()), formData);
    if (!resultat.ok) return resultat.etat;
    const { nouveauDomaine, ...d } = resultat.donnees;
    const domaines = await domainesChoisis(d.secteurs, nouveauDomaine, formData, ajout);
    if (domaines.erreur) return domaines.erreur;
    await prisma.personne.update({ where: { id: personneId }, data: { ...d, secteurs: domaines.secteurs } });
  } else if (etape === "carte") {
    const resultat = valider(schemasEtapes.carte(), formData);
    if (!resultat.ok) return resultat.etat;
    const d = resultat.donnees;
    await prisma.personne.update({
      where: { id: personneId },
      data: { ...d, consentementPublicLe: await dateConsentement(personneId, d.consentementPublic) },
    });
  } else {
    const resultat = valider(schemasEtapes.identite(), formData);
    if (!resultat.ok) return resultat.etat;
    await prisma.personne.update({ where: { id: personneId }, data: resultat.donnees });
  }

  rafraichir(personneId);
  const rang = ETAPES_FICHE.findIndex((e) => e.cle === etape);
  const suivante = ETAPES_FICHE[rang + 1]?.cle ?? etape;
  redirect(`/espace/ma-fiche?etape=${suivante}&enregistre=${etape}`);
}

// ─── Formations ────────────────────────────────────────────────────────────────

const annee = () => champ.entierFacultatif(1990, new Date().getFullYear() + 6);

const schemaFormation = z.object({
  personneId: z.string().min(1),
  id: z.string().optional(),
  intitule: champ.texte(160),
  parcours: champ.texteFacultatif(200),
  etablissement: champ.texte(160),
  anneeDebut: annee(),
  anneeFin: annee(),
});

export async function enregistrerFormation(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const resultat = valider(schemaFormation, formData);
  if (!resultat.ok) return resultat.etat;
  const { personneId, id, ...d } = resultat.donnees;
  const { estProprietaire, contexte, ajout } = await contexteFiche(personneId);
  const motif = await lireMotif(contexte, formData);
  if ("erreur" in motif) return motif.erreur;

  // L'établissement est relié à la liste commune (ajouté s'il n'y est pas encore).
  const etablissement = await trouverOuCreerEtablissement(d.etablissement, ajout);
  const donnees = { ...d, etablissement: etablissement.nom, etablissementId: etablissement.id };

  if (id) {
    await prisma.formation.update({ where: { id, personneId }, data: donnees });
  } else {
    await prisma.formation.create({ data: { ...donnees, personneId } });
  }
  await noterModification(contexte, `Formation : ${d.intitule}`, motif.motif);

  rafraichir(personneId);
  redirect(pageDeFiche(personneId, estProprietaire, "etudes"));
}

export async function supprimerFormation(formData: FormData) {
  const id = String(formData.get("id"));
  const personneId = String(formData.get("personneId"));
  const { contexte } = await contexteFiche(personneId);
  const motif = await motifSuppression(contexte, formData);
  if (!motif.ok) return;
  const formation = await prisma.formation.delete({ where: { id, personneId } });
  await noterModification(contexte, `Formation supprimée : ${formation.intitule}`, motif.motif);
  rafraichir(personneId);
}

// ─── Stages et emplois ─────────────────────────────────────────────────────────

const schemaExperience = (codes: string[]) => z.object({
  personneId: z.string().min(1),
  id: z.string().optional(),
  type: champ.choix(["STAGE", "ALTERNANCE", "EMPLOI", "ASSOCIATIF", "VOLONTARIAT", "AUTRE"]),
  organisation: champ.texte(160),
  poste: champ.texteFacultatif(160),
  secteurs: champ.liste(codes),
  niveau: champ.choixFacultatif(["LICENCE", "MASTER"]),
  ville: champ.texteFacultatif(80),
  debut: champ.moisFacultatif(),
  fin: champ.moisFacultatif(),
  resume: champ.texteFacultatif(300),
  missions: champ.texteFacultatif(2000),
  obtention: champ.texteFacultatif(10000),
  partagerContact: champ.case(),
  contactFonction: champ.texteFacultatif(120),
  contactAccord: champ.case(),
  contactNom: champ.texteFacultatif(120),
  contactMoyen: champ.texteFacultatif(200),
  partagerRapport: champ.case(),
  retirerRapport: champ.case(),
});

export async function enregistrerExperience(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const resultat = valider(schemaExperience(await codesDomaines()), formData);
  if (!resultat.ok) return resultat.etat;
  const { personneId, id, retirerRapport, ...d } = resultat.donnees;
  const { estProprietaire, contexte } = await contexteFiche(personneId);
  const motif = await lireMotif(contexte, formData);
  if ("erreur" in motif) return motif.erreur;
  const erreur = (champ: string, message: string) => ({
    erreur: "Certains champs sont à corriger.",
    erreurs: { [champ]: message },
    valeurs: valeursDe(formData),
  });

  if (d.debut && d.fin && d.fin < d.debut) return erreur("fin", "La fin doit être après le début.");

  // Nom et moyen de contact d'un tiers : enregistrés seulement avec son accord (RGPD).
  if (!d.partagerContact || !d.contactAccord) {
    d.contactNom = null;
    d.contactMoyen = null;
    d.contactAccord = false;
  }
  if (!d.partagerContact) d.contactFonction = null;

  const fichier = formData.get("rapportFichier");
  const pdf = fichier instanceof File && fichier.size > 0 ? fichier : null;
  const probleme = await verifierPdf(pdf);
  if (probleme) return erreur("rapportFichier", probleme);

  const avant = id ? await prisma.experience.findUnique({ where: { id, personneId }, select: { rapportFichier: true } }) : null;
  if (id && !avant) notFound();
  let rapportFichier = avant?.rapportFichier ?? null;
  if (pdf || retirerRapport) {
    await supprimerRapport(rapportFichier);
    rapportFichier = pdf ? await enregistrerPdf(pdf) : null;
  }

  const donnees = { ...d, rapportFichier };
  if (id) {
    await prisma.experience.update({ where: { id, personneId }, data: donnees });
  } else {
    await prisma.experience.create({ data: { ...donnees, personneId } });
  }
  await noterModification(contexte, `Expérience : ${d.organisation}`, motif.motif);

  rafraichir(personneId);
  redirect(pageDeFiche(personneId, estProprietaire, "experiences"));
}

export async function supprimerExperience(formData: FormData) {
  const id = String(formData.get("id"));
  const personneId = String(formData.get("personneId"));
  const { contexte } = await contexteFiche(personneId);
  const motif = await motifSuppression(contexte, formData);
  if (!motif.ok) return;
  const experience = await prisma.experience.delete({ where: { id, personneId } });
  await supprimerRapport(experience.rapportFichier);
  await noterModification(contexte, `Expérience supprimée : ${experience.organisation}`, motif.motif);
  rafraichir(personneId);
}

// ─── Erasmus ───────────────────────────────────────────────────────────────────

/** Valeur spéciale du menu « Université » : la personne ajoute une université absente de la liste. */
const NOUVELLE_UNIVERSITE = "__nouvelle";

const schemaErasmus = z.object({
  personneId: z.string().min(1),
  id: z.string().optional(),
  pays: champ.choix(CODES_PAYS as [string, ...string[]]),
  universiteId: champ.texte(40),
  nomUniversite: champ.texteFacultatif(120),
  villeUniversite: champ.texteFacultatif(80),
  annee: champ.entierFacultatif(PREMIERE_PROMO, new Date().getFullYear() + 2),
  duree: champ.choixFacultatif(["SEMESTRE", "ANNEE"]),
  niveau: champ.choixFacultatif(["LICENCE", "MASTER"]),
  descriptif: champ.texteFacultatif(300),
  retour: champ.texteFacultatif(10000),
});

export async function enregistrerErasmus(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const resultat = valider(schemaErasmus, formData);
  if (!resultat.ok) return resultat.etat;
  const { personneId, id, pays, universiteId, nomUniversite, villeUniversite, ...d } = resultat.donnees;
  const { estProprietaire, contexte, ajout } = await contexteFiche(personneId);
  const motif = await lireMotif(contexte, formData);
  if ("erreur" in motif) return motif.erreur;
  const erreur = (champ: string, message: string) => ({
    erreur: "Certains champs sont à corriger.",
    erreurs: { [champ]: message },
    valeurs: valeursDe(formData),
  });

  let universite: string;
  if (universiteId === NOUVELLE_UNIVERSITE) {
    if (!nomUniversite) return erreur("nomUniversite", "Indiquez le nom de l’université.");
    universite = await trouverOuAjouterUniversite(nomUniversite, villeUniversite, pays, ajout);
  } else {
    const choisie = await prisma.etablissement.findUnique({ where: { id: universiteId } });
    if (!choisie || choisie.pays !== pays) return erreur("universiteId", "Choisissez une université de ce pays.");
    universite = choisie.id;
  }

  if (id) {
    await prisma.erasmus.update({ where: { id, personneId }, data: { ...d, universiteId: universite } });
  } else {
    await prisma.erasmus.create({ data: { ...d, universiteId: universite, personneId } });
  }
  if (motif.motif) {
    const nom = (await prisma.etablissement.findUnique({ where: { id: universite }, select: { nom: true } }))?.nom ?? "";
    await noterModification(contexte, `Erasmus : ${nom}`, motif.motif);
  }

  rafraichir(personneId);
  redirect(pageDeFiche(personneId, estProprietaire, "erasmus"));
}

export async function supprimerErasmus(formData: FormData) {
  const id = String(formData.get("id"));
  const personneId = String(formData.get("personneId"));
  const { contexte } = await contexteFiche(personneId);
  const motif = await motifSuppression(contexte, formData);
  if (!motif.ok) return;
  const sejour = await prisma.erasmus.delete({ where: { id, personneId }, include: { universite: { select: { nom: true } } } });
  await noterModification(contexte, `Erasmus supprimé : ${sejour.universite.nom}`, motif.motif);
  rafraichir(personneId);
}

// ─── Notes du bureau (ADM-02) ──────────────────────────────────────────────────

/** La personne a lu les messages laissés par le bureau en modifiant sa fiche. */
export async function marquerNotesLues() {
  const { user } = await exigerCompte();
  if (!user.personneId) return;
  await prisma.noteModification.updateMany({ where: { personneId: user.personneId, lueLe: null }, data: { lueLe: new Date() } });
  revalidatePath("/espace/ma-fiche");
}
