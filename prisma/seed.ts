// Jeu de données FICTIF pour le développement local : `npm run db:remplir`.
// Efface toute la base locale puis la remplit avec des personnes, offres et événements inventés.
// Refuse de s'exécuter sur une autre base que la base locale.
//
// Comptes créés (mot de passe : variable SEED_MOT_DE_PASSE de .env.local) :
//   admin@exemple.test     — propriétaire (tous les droits), compte actif
//   animateur@exemple.test — animateur (contenu, validation des comptes), compte actif
//   membre@exemple.test    — membre, compte actif
//   attente@exemple.test   — compte en attente de validation

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { detecterMentionsEnLot } from "../scripts/mentions-detecter";
import { relierEtablissements } from "../scripts/relier-etablissements";
import { creerExemplesErasmus } from "./exemples-erasmus";

const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("Refusé : ce script ne s'exécute que sur la base locale (DATABASE_URL vers localhost).");
  process.exit(1);
}
const motDePasse = process.env.SEED_MOT_DE_PASSE;
if (!motDePasse || motDePasse.length < 10) {
  console.error("Définissez SEED_MOT_DE_PASSE (10 caractères minimum) dans .env.local.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const mois = (a: number, m: number) => new Date(Date.UTC(a, m - 1, 1, 12));
const dansJours = (j: number, h = 19) => {
  const d = new Date();
  d.setDate(d.getDate() + j);
  d.setHours(h, 0, 0, 0);
  return d;
};

async function creerCompte(email: string, prenom: string, nom: string, promoEntree: number, options: {
  statut: "ACTIF" | "EN_ATTENTE";
  role?: "PROPRIETAIRE" | "ADMIN" | "ANIMATEUR" | "MEMBRE";
  personneId?: string;
}) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email,
      name: `${prenom} ${nom}`,
      prenom,
      nom,
      promoEntree,
      emailVerified: true,
      statut: options.statut,
      role: options.role ?? "MEMBRE",
      personneId: options.personneId,
      accounts: {
        create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(motDePasse!) },
      },
    },
  });
}

async function main() {
  // Remise à zéro (base locale uniquement)
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.offre.deleteMany();
  await prisma.user.deleteMany();
  await prisma.personne.deleteMany();
  await prisma.etablissement.deleteMany();
  await prisma.article.deleteMany();
  await prisma.membreBureau.deleteMany();
  await prisma.fonction.deleteMany();

  // ─── Fiches ────────────────────────────────────────────────────────────────
  const claire = await prisma.personne.create({
    data: {
      prenom: "Claire", nom: "Fictive", promoEntree: 2021,
      situationActuelle: "Chargée de mission, mairie du 11e arrondissement de Paris",
      ville: "Paris", secteurs: ["administration", "politique"],
      emailContact: "claire@exemple.test", afficherEmail: true,
      linkedin: "https://www.linkedin.com/in/exemple", afficherLinkedin: true,
      consentementPublic: true, consentementPublicLe: new Date(),
      formations: { create: [{ intitule: "Master Affaires publiques", parcours: "Action publique territoriale", etablissement: "Sciences Po Paris", anneeDebut: 2024, anneeFin: 2026 }] },
      experiences: {
        create: [
          {
            type: "STAGE", organisation: "Mairie du 11e arrondissement de Paris", poste: "Stagiaire au cabinet du maire",
            secteurs: ["administration"], niveau: "MASTER", ville: "Paris", debut: mois(2025, 4), fin: mois(2025, 9),
            partagerContact: true, contactFonction: "Directrice de cabinet",
            contactAccord: true, contactNom: "Jeanne Exemple", contactMoyen: "jeanne@exemple.test",
            resume: "Suivi des conseils de quartier et préparation des notes pour le maire.",
            missions: "Préparation des notes et des dossiers du maire, suivi des conseils de quartier, relations avec les services de la mairie.",
            obtention:"Candidature spontanée en janvier, entretien en février.\n\nLe stage permet de voir de près le fonctionnement d’un cabinet : notes, agendas, relations avec les services.\n\nConseil : bien connaître les compétences des mairies d’arrondissement avant l’entretien.",
          },
          {
            type: "STAGE", organisation: "Conseil départemental de l’Hérault", poste: "Stage d’observation",
            secteurs: ["administration"], niveau: "LICENCE", ville: "Montpellier", debut: mois(2023, 6), fin: mois(2023, 7),
            resume: "Découverte des politiques sociales du département.",
          },
        ],
      },
    },
  });

  const hugo = await prisma.personne.create({
    data: {
      prenom: "Hugo", nom: "Imaginaire", promoEntree: 2021,
      situationActuelle: "Analyste, banque d’affaires", ville: "Londres", secteurs: ["finance"],
      telephone: "06 00 00 00 00", afficherTelephone: true,
      formations: { create: [{ intitule: "MSc Economics", etablissement: "London School of Economics", anneeDebut: 2024, anneeFin: 2025 }] },
      experiences: {
        create: [
          { type: "STAGE", organisation: "Banque Exemple", poste: "Analyste M&A", secteurs: ["finance"], niveau: "MASTER", ville: "Londres", debut: mois(2025, 1), fin: mois(2025, 6), resume: "Due diligence et modèles financiers." },
          { type: "EMPLOI", organisation: "Banque Exemple", poste: "Analyste", secteurs: ["finance"], ville: "Londres", debut: mois(2025, 9) },
        ],
      },
    },
  });

  await prisma.personne.create({
    data: {
      prenom: "Inès", nom: "Inventée", promoEntree: 2021,
      situationActuelle: "Master en cours, relations internationales", secteurs: ["international"],
      consentementPublic: true, consentementPublicLe: new Date(),
      formations: { create: [{ intitule: "Master Relations internationales", parcours: "Sécurité internationale", etablissement: "Université Paris-Panthéon-Assas", anneeDebut: 2024 }] },
      experiences: { create: [{ type: "STAGE", organisation: "Ambassade de France (exemple)", poste: "Stagiaire, service politique", secteurs: ["international"], niveau: "MASTER", ville: "Berlin", debut: mois(2025, 2), fin: mois(2025, 7), resume: "Rédaction de télégrammes diplomatiques." }] },
    },
  });

  await prisma.personne.create({
    data: {
      prenom: "Lucas", nom: "Supposé", promoEntree: 2022,
      situationActuelle: "Master Économie de la santé", secteurs: ["recherche"],
      consentementPublic: true, consentementPublicLe: new Date(),
      formations: { create: [{ intitule: "Master Économie et gestion de la santé", etablissement: "Université Paris Dauphine-PSL", anneeDebut: 2025 }] },
    },
  });

  // Fiche sans compte, au même nom que le compte en attente (test du rattachement)
  await prisma.personne.create({
    data: {
      prenom: "Nina", nom: "Hypothèse", promoEntree: 2022,
      formations: { create: [{ intitule: "Master Économie politique", etablissement: "Université de Lausanne", anneeDebut: 2025 }] },
    },
  });

  const sarah = await prisma.personne.create({
    data: {
      prenom: "Sarah", nom: "Démo", promoEntree: 2023,
      situationActuelle: "Étudiante en L3", ville: "Montpellier", secteurs: ["medias", "communication"],
      experiences: { create: [{ type: "STAGE", organisation: "Journal régional (exemple)", poste: "Stagiaire rédaction", secteurs: ["medias"], niveau: "LICENCE", ville: "Montpellier", debut: mois(2025, 6), fin: mois(2025, 7), resume: "Articles de politique locale." }] },
    },
  });

  await prisma.personne.create({
    data: {
      prenom: "Tom", nom: "Essai", promoEntree: 2023,
      situationActuelle: "Année de césure : alternance", secteurs: ["conseil"],
      experiences: { create: [{ type: "ALTERNANCE", organisation: "Cabinet de conseil (exemple)", poste: "Chargé d’évaluation des politiques publiques", secteurs: ["conseil", "administration"], niveau: "LICENCE", ville: "Lyon", debut: mois(2026, 9) }] },
    },
  });

  // ─── Comptes ───────────────────────────────────────────────────────────────
  await creerCompte("admin@exemple.test", "Claire", "Fictive", 2021, { statut: "ACTIF", role: "PROPRIETAIRE", personneId: claire.id });
  await creerCompte("membre@exemple.test", "Sarah", "Démo", 2023, { statut: "ACTIF", personneId: sarah.id });
  await creerCompte("animateur@exemple.test", "Hugo", "Imaginaire", 2021, { statut: "ACTIF", role: "ANIMATEUR", personneId: hugo.id });
  await creerCompte("attente@exemple.test", "Nina", "Hypothèse", 2022, { statut: "EN_ATTENTE" });
  void hugo;

  // ─── Erasmus (exemples) ────────────────────────────────────────────────────
  await creerExemplesErasmus(prisma);
  // Formations reliées à la liste commune des établissements (ADM-03) ; rien à contrôler dans les exemples.
  await relierEtablissements(prisma);
  await prisma.etablissement.updateMany({ data: { aControler: false } });
  await detecterMentionsEnLot(prisma);

  // ─── Vie de l'association ──────────────────────────────────────────────────
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@exemple.test" } });
  const membre = await prisma.user.findUniqueOrThrow({ where: { email: "membre@exemple.test" } });

  await prisma.offre.createMany({
    data: [
      {
        titre: "Stage — assistant de communication", organisation: "Collectivité (exemple)", type: "STAGE", lieu: "Montpellier",
        description: "Stage de 2 mois au service communication.\nMissions : réseaux sociaux, revue de presse, événements.",
        lien: "https://exemple.test/offre", dateLimite: dansJours(30), statut: "PUBLIEE", publieeLe: new Date(), deposeParId: admin.id,
      },
      {
        titre: "Chargé d’études junior", organisation: "Institut d’études (exemple)", type: "EMPLOI", lieu: "Paris",
        description: "CDD de 12 mois, analyse de données d’enquêtes.", contact: "recrutement@exemple.test",
        statut: "PUBLIEE", publieeLe: new Date(Date.now() - 5 * 86400000), deposeParId: admin.id,
      },
      {
        titre: "Stage en cabinet parlementaire", organisation: "Assemblée nationale (exemple)", type: "STAGE", lieu: "Paris",
        description: "Stage de 3 mois auprès d’un député.", statut: "EN_ATTENTE", deposeParId: membre.id,
      },
    ],
  });

  // Événements : des publications de type EVENEMENT (même table que les actualités).
  const evenement = { type: "EVENEMENT" as const, categorie: "ASSOCIATION" as const, publie: true, publieLe: new Date() };
  await prisma.article.createMany({
    data: [
      { ...evenement, titre: "Afterwork des anciens", slug: "afterwork-des-anciens", debut: dansJours(10, 19), lieu: "Montpellier", chapo: "Rencontre entre étudiants et anciens autour d’un verre." },
      { ...evenement, titre: "Assemblée générale", slug: "assemblee-generale", debut: dansJours(40, 18), fin: dansJours(40, 20), lieu: "Faculté d’économie, Montpellier", chapo: "Bilan de l’année et élection du bureau." },
      { ...evenement, titre: "Soirée de rentrée", slug: "soiree-de-rentree", debut: dansJours(-20, 20), lieu: "Montpellier", contenu: "Événement fictif de démonstration : après la soirée, le bureau complète ici le compte rendu." },
    ],
  });

  await prisma.article.createMany({
    data: [
      {
        titre: "Portrait : de la bi-licence à la mairie de Paris", slug: "portrait-de-la-bi-licence-a-la-mairie-de-paris", categorie: "PORTRAIT_ANCIEN",
        chapo: "Article fictif de démonstration, au format « à la une ».",
        aLaUne: true,
        contenu: "Premier paragraphe de démonstration.\n\nDeuxième paragraphe : le texte réel sera rédigé par le bureau.",
        publie: true, publieLe: new Date(),
      },
      { titre: "Brouillon d’article", slug: "brouillon-d-article", categorie: "ASSOCIATION", contenu: "Texte en cours de rédaction.", publie: false },
    ],
  });

  // Fonctions du bureau et pôles (étiquettes), puis membres fictifs rattachés à une ou plusieurs étiquettes.
  type DonneesFonction = { nom: string; niveau: "BUREAU" | "POLE"; ordre: number; icone?: string; description?: string };
  const fonctionsExemple: DonneesFonction[] = [
    { nom: "Présidence", niveau: "BUREAU", ordre: 1 },
    { nom: "Trésorerie", niveau: "BUREAU", ordre: 2 },
    { nom: "Événementiel", niveau: "POLE", ordre: 1, icone: "fete", description: "Soirées, rencontres et retrouvailles des promotions." },
    { nom: "Culture", niveau: "POLE", ordre: 2, icone: "culture" },
    { nom: "Entraide", niveau: "POLE", ordre: 3, icone: "entraide", description: "Tutorat, conseils d’orientation et partage de cours." },
    { nom: "Sport", niveau: "POLE", ordre: 4, icone: "sport" },
    { nom: "Technique", niveau: "POLE", ordre: 5, icone: "technique" },
  ];
  const [presidence, tresorerie, , , entraide, , technique] = await Promise.all(fonctionsExemple.map((data) => prisma.fonction.create({ data })));
  const exemple = { prenom: "Prénom", nom: "Exemple" };
  await prisma.membreBureau.create({ data: { ...exemple, ordre: 1, fonctions: { connect: [{ id: presidence.id }] } } });
  await prisma.membreBureau.create({ data: { ...exemple, ordre: 2, fonctions: { connect: [{ id: tresorerie.id }] } } });
  await prisma.membreBureau.create({ data: { ...exemple, role: "Responsable", ordre: 3, fonctions: { connect: [{ id: technique.id }] } } });
  await prisma.membreBureau.create({ data: { ...exemple, role: "Responsable", ordre: 4, fonctions: { connect: [{ id: entraide.id }, { id: tresorerie.id }] } } });

  console.log("Base locale remplie avec des données fictives.");
  console.log("Comptes : admin@exemple.test, animateur@exemple.test, membre@exemple.test, attente@exemple.test (mot de passe : SEED_MOT_DE_PASSE).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
