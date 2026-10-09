// Import groupé des données réelles : annuaire privé des adhérents + poursuites d'études + séjours
// Erasmus. Les trois fichiers sont compilés en UNE liste de personnes (rapprochées par nom, e-mail et
// téléphone), puis chaque personne reçoit une fiche et, si on a son adresse e-mail, un PRÉ-COMPTE
// (statut INVITE) : elle n'aura plus qu'à recevoir son lien d'invitation, choisir un mot de passe et
// compléter sa fiche (Administration → Pré-comptes → « Envoyer les invitations »).
//
// Utilisation (depuis le dossier du projet) :
//   npm run import:reel -- --annuaire "…xlsx" --poursuite "…xlsx" --erasmus "…xlsx"
//        → simulation : rien n'est écrit, un rapport est produit
//   … --confirmer                 → écrit dans la base (refuse si la base contient déjà des données)
//   … --confirmer --vider         → efface d'abord TOUT le contenu de la base LOCALE (jamais en production)
//   … --proprietaire "adresse@exemple.fr" [--fiche-proprietaire "Prénom Nom"]
//                                 → crée aussi le compte propriétaire (voir creer-proprietaire.ts) ; avec
//                                   --fiche-proprietaire, cette adresse remplace celle de l'annuaire pour cette fiche
//
// Règles :
// - les contacts (e-mail, téléphone) sont enregistrés mais MASQUÉS dans l'annuaire (la personne choisit) ;
// - personne n'apparaît dans l'historique public (consentement à recueillir) ;
// - les domaines professionnels (table Domaine) sont conservés, ils font partie de la configuration ;
// - le rapport `import-donnees-rapport.csv` (ignoré par Git : données personnelles) liste chaque
//   personne et ce qu'il faut vérifier. Les fichiers sources restent hors du dépôt.

import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";
import { readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { compiler, sansAccent, type PersonneCompilee } from "./compilation-donnees";
import { creerProprietaire, ecrireIdentifiants } from "./creer-proprietaire";
import { detecterMentionsEnLot } from "./mentions-detecter";
import { relierEtablissements } from "./relier-etablissements";
import { codePays, PAYS_FORMATIONS, universiteDe } from "./universites-erasmus";

// ─── Options ──────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const option = (nom: string) => {
  const i = argv.indexOf(`--${nom}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const confirmer = argv.includes("--confirmer");
const vider = argv.includes("--vider");
const annuaire = option("annuaire");
const poursuite = option("poursuite");
const erasmus = option("erasmus");
const emailProprietaire = option("proprietaire")?.trim().toLowerCase();
const ficheProprietaire = option("fiche-proprietaire"); // « Prénom Nom » de la fiche à rattacher à cette adresse
if (!annuaire || !poursuite || !erasmus) {
  console.error('Usage : npm run import:reel -- --annuaire "…" --poursuite "…" --erasmus "…" [--confirmer] [--vider] [--proprietaire adresse]');
  process.exit(1);
}

const url = process.env.DATABASE_URL ?? "";
const locale = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (vider && !locale) {
  console.error("Refusé : --vider n'efface que la base locale (DATABASE_URL vers localhost).");
  process.exit(1);
}

// ─── Rapport ──────────────────────────────────────────────────────────────────

const csv = (v: unknown) => {
  let texte = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return `"${texte.replace(/"/g, '""')}"`;
};

// ─── Principal ────────────────────────────────────────────────────────────────

async function main() {
  const { personnes, alertes } = await compiler({ annuaire: annuaire!, poursuite: poursuite!, erasmus: erasmus! });
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  const contenu = {
    comptes: await prisma.user.count(),
    fiches: await prisma.personne.count(),
  };
  if (confirmer && !vider && (contenu.comptes > 0 || contenu.fiches > 0)) {
    console.error(`Refusé : la base contient déjà ${contenu.comptes} compte(s) et ${contenu.fiches} fiche(s). Relancez avec --vider (base locale uniquement) pour tout effacer d'abord.`);
    process.exit(1);
  }

  // L'adresse du compte propriétaire remplace celle de l'annuaire pour sa propre fiche.
  if (emailProprietaire && ficheProprietaire) {
    const cle = sansAccent(ficheProprietaire).split(/\s+/).sort().join(" ");
    const moi = personnes.find((p) => sansAccent(`${p.prenom} ${p.nom}`).split(/\s+/).sort().join(" ") === cle);
    if (!moi) throw new Error(`--fiche-proprietaire : « ${ficheProprietaire} » est introuvable.`);
    moi.email = emailProprietaire;
  }

  // Adresses en double entre deux personnes distinctes : le pré-compte n'est créé que pour la première.
  const emailsPris = new Set<string>();
  const aInviter = new Set<PersonneCompilee>();
  for (const p of personnes) {
    if (p.email && !emailsPris.has(p.email)) {
      emailsPris.add(p.email);
      aInviter.add(p);
    } else if (p.email) {
      p.aVerifier.push("même adresse e-mail qu'une autre personne : pas de pré-compte");
    } else {
      p.aVerifier.push("aucune adresse e-mail : fiche créée sans pré-compte (pas d'invitation possible)");
    }
  }

  if (confirmer) {
    if (vider) {
      // Contenu de démonstration et données de test : tout sauf les domaines (configuration).
      await prisma.session.deleteMany();
      await prisma.account.deleteMany();
      await prisma.verification.deleteMany();
      await prisma.offre.deleteMany();
      await prisma.user.deleteMany();
      await prisma.personne.deleteMany(); // supprime aussi formations, expériences, séjours et notes
      await prisma.etablissement.deleteMany();
      await prisma.article.deleteMany();
      await prisma.membreBureau.deleteMany();
      // Images téléversées pendant les essais (actualités, bureau) et rapports de stage de démonstration
      const dossier = process.env.UPLOAD_DIR ?? "uploads";
      try {
        for (const f of readdirSync(dossier)) rmSync(join(dossier, f), { recursive: true, force: true });
      } catch {
        /* dossier absent : rien à nettoyer */
      }
    }

    const etablissements = new Map<string, string>(); // « pays|nom » → id
    const universite = async (lieu: string, paysTexte: string) => {
      const u = universiteDe(lieu, paysTexte);
      const pays = codePays(paysTexte) ?? "FR";
      const cle = `${pays}|${sansAccent(u.nom)}`;
      let id = etablissements.get(cle);
      if (!id) {
        const cree = await prisma.etablissement.create({ data: { nom: u.nom, ville: u.ville, pays, type: "UNIVERSITE", aControler: true } });
        id = cree.id;
        etablissements.set(cle, id);
      }
      return id;
    };

    for (const p of personnes) {
      const personne = await prisma.personne.create({
        data: {
          prenom: p.prenom,
          nom: p.nom,
          promoEntree: p.promoEntree,
          emailContact: p.email,
          telephone: p.telephone,
          ville: p.ville,
          situationActuelle: p.situation,
          statutActuel: p.cesure ? "CESURE" : undefined,
          formations: p.formation ? { create: [{ ...p.formation, anneeDebut: p.promoEntree + 3 }] } : undefined,
        },
      });
      for (const s of p.sejours) {
        await prisma.erasmus.create({
          data: { personneId: personne.id, universiteId: await universite(s.lieu, s.pays), duree: s.semestre ? "SEMESTRE" : undefined },
        });
      }
      if (aInviter.has(p) && p.email) {
        await prisma.user.create({
          data: {
            id: randomUUID(),
            email: p.email,
            name: `${p.prenom} ${p.nom}`,
            prenom: p.prenom,
            nom: p.nom,
            promoEntree: p.promoEntree,
            emailVerified: false,
            statut: "INVITE",
            personneId: personne.id,
          },
        });
      }
    }

    // Formations reliées à la liste commune des établissements (à contrôler dans l'administration).
    const { crees } = await relierEtablissements(prisma);
    console.log(`Établissements de formation ajoutés : ${crees}`);
    // Mentions de master reconnues à partir des intitulés (les autres sont « à classer » dans l'administration).
    const { nonReconnus } = await detecterMentionsEnLot(prisma);
    console.log(`Intitulés sans mention reconnue : ${nonReconnus.size}`);
    for (const e of await prisma.etablissement.findMany({ where: { pays: "FR" }, select: { id: true, nom: true } })) {
      const pays = PAYS_FORMATIONS[sansAccent(e.nom).replace(/’/g, "'")];
      if (pays) await prisma.etablissement.update({ where: { id: e.id }, data: { pays } });
    }

    if (emailProprietaire) {
      const moi = personnes.find((p) => p.email === emailProprietaire);
      if (!moi) throw new Error(`--proprietaire : « ${emailProprietaire} » est absent de l'annuaire (utilisez npm run admin:creer).`);
      // Le compte pré-créé de cette personne devient le compte propriétaire, rattaché à sa fiche.
      const mdp = await creerProprietaire(prisma, { email: moi.email!, prenom: moi.prenom, nom: moi.nom, promoEntree: moi.promoEntree });
      const chemin = ecrireIdentifiants(moi.email!, mdp, process.env.BETTER_AUTH_URL ?? "http://localhost:3000");
      console.log(`Compte propriétaire créé pour ${moi.email}. Identifiants écrits dans : ${chemin}`);
    }
  }

  // Rapport
  const lignes = [["Prénom", "Nom", "Promotion", "Sources", "Pré-compte", "Formation", "Séjour Erasmus", "À vérifier"].map(csv).join(";")];
  for (const p of personnes) {
    lignes.push(
      [
        p.prenom,
        p.nom,
        `${p.promoEntree}${p.promoEstimee ? " (estimée)" : ""}`,
        p.sources.join(" + "),
        aInviter.has(p) ? "oui" : "non",
        p.formation ? [p.formation.intitule, p.formation.parcours, p.formation.etablissement].filter(Boolean).join(" — ") : "",
        p.sejours.map((s) => `${universiteDe(s.lieu, s.pays).nom} (${s.pays})`).join(" | "),
        p.aVerifier.join(" | "),
      ]
        .map(csv)
        .join(";"),
    );
  }
  writeFileSync("import-donnees-rapport.csv", "﻿" + lignes.join("\r\n"), "utf8");

  const parSource = (s: string) => personnes.filter((p) => p.sources.includes(s as never)).length;
  const hote = url.match(/@([^:/]+)/)?.[1] ?? "?";
  console.log(`\nBase cible : ${hote}${locale ? " (locale)" : ""}`);
  console.log(`Personnes uniques : ${personnes.length} (annuaire ${parSource("annuaire")}, poursuite ${parSource("poursuite")}, Erasmus ${parSource("erasmus")})`);
  console.log(`Pré-comptes ${confirmer ? "créés" : "à créer"} : ${aInviter.size} · sans adresse e-mail : ${personnes.filter((p) => !p.email).length}`);
  console.log(`Séjours Erasmus : ${personnes.reduce((n, p) => n + p.sejours.length, 0)} · promotions estimées : ${personnes.filter((p) => p.promoEstimee).length}`);
  console.log(`Fiches avec points à vérifier : ${personnes.filter((p) => p.aVerifier.length > 0).length}`);
  for (const a of alertes) console.log(`  ! ${a}`);
  console.log("Rapport détaillé : import-donnees-rapport.csv (ne pas le partager : données personnelles)");
  if (!confirmer) console.log("\nSimulation uniquement. Relancez avec --confirmer pour écrire dans la base.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
