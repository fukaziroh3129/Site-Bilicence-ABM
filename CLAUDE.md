# Site web — Alumni Bi-Licence Montpellier (ABM)

## Contexte

Ce projet est le site web de l'association Alumni Bi-Licence Montpellier (ABM), qui fédère
les étudiants et diplômés de la bi-licence Économie / Sciences politiques de l'Université de
Montpellier (~90 personnes, 3 promotions). Le cahier des charges complet est dans
`../cahier_des_charges_site_ABM.md` (dossier parent) — le lire avant toute modification
structurante.

Le développeur (Guillaume, président de l'association) est débutant en développement web.
Explique les choix techniques simplement, évite le jargon non expliqué, et préfère les
solutions simples et conventionnelles aux approches avancées.

## Objectif du site

Priorité : outil de réseautage fonctionnel entre alumni, avant la vitrine publique.
- Partie publique (sans compte) : présentation de l'asso et de la formation, actualités,
  page bureau, historique des promotions (version allégée).
- Partie privée (membres connectés) : annuaire complet, archive des stages, offres
  d'emploi/stage, gestion de profil.

Rester minimaliste : peu de sections, mais faciles à alimenter régulièrement.

## Stack technique

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Base de données : PostgreSQL à mettre en place (Neon ou le Postgres intégré à Coolify —
  à trancher avant de coder l'annuaire/les comptes membres)
- Authentification : comptes membres avec validation manuelle par le bureau avant activation
- Langue : français uniquement pour l'instant

## Déploiement

- Hébergement : VPS Hostinger (KVM 4), avec Coolify installé comme plateforme de déploiement.
- Dépôt GitHub : https://github.com/fukaziroh3129/Site-Bilicence-ABM (branche `main`)
- Déploiement automatique : chaque `git push` sur `main` redéploie le site via webhook Coolify.
- Nom de domaine prévu à terme : bilicence.fr (actuellement chez Hostinger, pas encore
  pointé vers le VPS).
- Pas d'environnement de staging pour l'instant — tout ce qui est poussé sur `main` part
  en production. Donc : tester en local (`npm run dev`) avant de pousser.

## Identité visuelle

- Logo : sceau circulaire bordeaux/grenat (style institutionnel), avec lettre M, abeille,
  rubans, couronne de laurier — fichier source à récupérer auprès de Guillaume.
- Couleur dominante : bordeaux/grenat foncé (type "oxblood"). Code hexacodé exact non
  encore extrait — à vérifier avant de figer la palette dans le design system.
- Ton : institutionnel et sobre (type Sciences Po), sans surcharge fonctionnelle. Priorité
  à la simplicité et à la fonctionnalité réelle (pas de feature qui ne sera pas utilisée).

## Points de vigilance (RGPD, contraintes asso)

- L'affichage public de nom/prénom/situation (historique des promos) nécessite un
  consentement explicite (opt-in) de la personne concernée — à prévoir dans le formulaire
  de profil, pas juste dans la doc.
- Comptes membres : validation manuelle par le bureau avant activation (pas d'auto-inscription
  ouverte).
- Cotisations/dons : gérés via HelloAsso (lien externe), pas de paiement à développer sur le
  site.
- Budget association : zéro au départ — toute dépendance payante (au-delà de Coolify/VPS déjà
  pris en charge) doit être justifiée et validée avant d'être ajoutée au projet.

## Conventions de travail

- Commits en français, clairs et courts.
- Avant de pousser sur `main` : `npm run build` en local pour vérifier qu'il n'y a pas
  d'erreur de build (le build Coolify utilisera Nixpacks, qui détecte Next.js automatiquement).
- Pas de secrets (clés API, mots de passe) commités — tout va dans `.env.local` (déjà
  ignoré par `.gitignore`), et sera configuré séparément comme variable d'environnement
  dans Coolify pour la prod.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Design system

Charte graphique ABM v1, intégrée dans le code sous `src/styles/design-system/`
(importé depuis `src/app/globals.css`, exposé comme tokens Tailwind via `@theme inline`).

- **Deux registres, jamais mélangés sur un même écran** : institutionnel (fond bordeaux
  `#5C1A1E` dominant, blanc, serif Playfair Display) pour l'officiel/événementiel ; accueil
  (rose pâle `#F2D9D9`, beige papier `#EDE3D3`, script Great Vibes) pour les moments d'accueil
  humain. Choisir le registre est la première décision de chaque page/section.
- Classes Tailwind disponibles : `bg-bordeaux`, `bg-bordeaux-100` à `-900`, `text-ink`,
  `bg-rose-pale`, `bg-beige-papier`, `font-display` / `font-impact` / `font-script` / `font-body`,
  `rounded-abm-sm` / `-md` / `-lg` / `-pill`, `shadow-abm-card` / `-raised`.
- Angles droits par défaut (identité "papier et sceau"), rayons de 0 à 10px max (hors pill).
- Pas de dégradé décoratif, pas de flou (`backdrop-filter`), pas d'émoji — jamais, sur aucun
  support. Pictogrammes vectoriels (Lucide) à la place.
- Vouvoiement partout, typographie française stricte (espaces insécables, guillemets «»,
  dates en toutes lettres).
- Logo : `public/brand/logo-abm-seal{,-bordeaux,-white}.png`. **Attention** : le logo n'existe
  qu'en PNG (pas de SVG vectoriel) — les codes hex de la charte sont des estimations visuelles,
  à recaler si un fichier vectoriel source est fourni un jour. Pas de monogramme simplifié
  (favicon) fourni — ne pas en inventer un sans validation du bureau.
- Référence complète (ton éditorial, règles détaillées, composants) : design system Claude
  "ABM — Design System", https://claude.ai/artifact/RZbJkMeWPiK7bdsyapNeC9
