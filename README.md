# Site web — Alumni Bi-Licence Montpellier (ABM)

Site de l'association : vitrine publique et outil de réseautage (annuaire, archive des stages,
offres, événements) pour les étudiants et diplômés de la bi-licence Économie / Sciences
politiques de l'Université de Montpellier.

- Cahier des charges : `../cahier_des_charges_site_ABM.md`
- Règles de travail et choix techniques : [CLAUDE.md](CLAUDE.md)
- Mise en production : [DEPLOIEMENT.md](DEPLOIEMENT.md)

## Technologies

| Rôle | Outil |
|---|---|
| Site (pages et serveur) | Next.js 16, React 19, TypeScript |
| Mise en forme | Tailwind CSS 4 + design system ABM (`src/styles/design-system/`) |
| Base de données | PostgreSQL 17, via Prisma 7 |
| Comptes et connexion | Better Auth (e-mail + mot de passe) |
| E-mails | Nodemailer (SMTP Brevo en production ; affichés dans le terminal en local) |

## Travailler en local

Prérequis : Node.js 22 ou plus récent.

```bash
npm install
```

Copier `.env.example` en `.env.local` et le compléter (une clé `BETTER_AUTH_SECRET` aléatoire,
un `SEED_MOT_DE_PASSE` pour les comptes de test).

Dans un **premier terminal**, à laisser ouvert :

```bash
npm run db
```

Cette commande démarre une base PostgreSQL locale, sans rien installer sur le PC (les données
sont dans `.pgdata/`).

Dans un **second terminal** :

```bash
npm run db:deployer
npm run db:remplir
npm run dev
```

Le site est alors sur http://localhost:3000. `db:remplir` crée des données **fictives** et trois
comptes de test (`admin@exemple.test`, `membre@exemple.test`, `attente@exemple.test`, mot de
passe : `SEED_MOT_DE_PASSE` de `.env.local`). Attention : il **efface** la base locale avant.

En local, les e-mails (confirmation d'inscription, mot de passe oublié…) ne sont pas envoyés :
ils s'affichent dans le terminal de `npm run dev`, liens compris.

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance le site en développement |
| `npm run build` | Vérifie que le site compile (à faire avant chaque `git push`) |
| `npm run lint` | Vérifie la qualité du code |
| `npm run db` | Démarre la base locale |
| `npm run db:migrer -- --name description` | Après une modification de `prisma/schema.prisma` : crée la migration |
| `npm run db:deployer` | Applique les migrations existantes à la base |
| `npm run db:remplir` | Remplit la base **locale** de données fictives (l'efface d'abord) |
| `npm run db:studio` | Ouvre une interface pour consulter et corriger la base |
| `npm run import:excel -- "fichier.xlsx"` | Simule l'import de l'Excel historique (ajouter `--confirmer` pour importer) |
| `npm run admin:promouvoir -- email` | Donne les droits d'administration à un compte |

## Organisation du code

```
prisma/schema.prisma      Structure de la base (tables, champs)
prisma/migrations/        Historique des modifications de la base
prisma/seed.ts            Données fictives de développement
scripts/                  Base locale, import Excel, promotion d'un admin
src/app/                  Pages (un dossier = une adresse du site)
  (pages publiques)       accueil, la-formation, actualites, promotions, bureau, adhesion…
  connexion, inscription… comptes
  espace/                 espace membres (annuaire, stages, offres, événements, ma fiche…)
  admin/                  administration (comptes, fiches, offres, événements, actualités, bureau)
src/actions/              Actions des formulaires (enregistrement en base, côté serveur)
src/components/           Éléments d'interface réutilisables
src/lib/                  Outils : base, authentification, e-mails, formats, secteurs…
src/lib/site.ts           Nom du site, liens HelloAsso / Instagram, menus
```

## Données personnelles

- Ne jamais mettre dans Git : `.env.local`, l'Excel des anciens, le rapport d'import
  (`import-excel-rapport.csv`). Le fichier `.gitignore` les exclut déjà.
- Les contacts d'une fiche ne sont visibles des membres que si la personne l'a choisi.
- L'historique public des promotions n'affiche que les personnes ayant donné leur accord.
