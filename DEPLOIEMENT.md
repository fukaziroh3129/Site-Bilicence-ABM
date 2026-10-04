# Mise en production sur Coolify

Le site tourne sur le VPS Hostinger via Coolify. Chaque `git push` sur `main` redéploie le site.
**Faire les étapes 1 à 4 AVANT de pousser le code qui utilise la base de données** : sans
`DATABASE_URL`, le site ne démarre pas.

## 1. Créer la base PostgreSQL dans Coolify

1. Dans le projet Coolify du site : **+ New → Database → PostgreSQL** (version 17).
2. Laisser la base **non publique** (pas de port exposé sur Internet).
3. Démarrer la base, puis copier son **URL de connexion interne**
   (`postgres://…@<nom-interne>:5432/postgres`).

## 2. Sauvegardes (indispensable)

1. Sur la ressource PostgreSQL : onglet **Backups** → sauvegarde planifiée **quotidienne**.
2. Idéalement, envoyer les sauvegardes hors du VPS (destination S3 compatible) ; à défaut,
   vérifier que les sauvegardes automatiques du VPS sont actives dans le panneau Hostinger.
3. Tester une restauration au moins une fois (sur une base de test) avant d'y mettre les vraies données.

## 3. Variables d'environnement de l'application

Dans l'application Coolify → **Environment Variables** :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL interne copiée à l'étape 1 |
| `BETTER_AUTH_SECRET` | Longue chaîne aléatoire, **différente** de celle du PC (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`) |
| `BETTER_AUTH_URL` | Adresse publique du site, ex. `https://bilicence.fr` (sans `/` final) |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` / `SMTP_PASSWORD` | Identifiants SMTP Brevo (compte Brevo → SMTP & API) |
| `EMAIL_EXPEDITEUR` | `ABM <contact@bilicence.fr>` (adresse validée dans Brevo) |
| `UPLOAD_DIR` | `/app/uploads` |

Sans SMTP configuré, personne ne peut s'inscrire (la confirmation de l'adresse e-mail est obligatoire).
Pour Brevo : déclarer le domaine `bilicence.fr` et ajouter chez Hostinger les enregistrements DNS
(SPF, DKIM) qu'il indique, sinon les e-mails risquent d'arriver en spam.

## 4. Stockage des images

Application Coolify → **Persistent Storage** → ajouter un volume monté sur `/app/uploads`.
Sans ce volume, les photos téléversées (actualités, bureau) disparaissent à chaque déploiement.

## 4 bis. Surveillance automatique

Application Coolify → **Health check** : activer, chemin `/api/sante`, port 3000. Coolify redémarre
alors le site tout seul s'il ne répond plus. Cette page fait aussi le ménage automatique deux fois
par jour (inscriptions jamais confirmées après 30 jours, sessions et liens expirés).

## 5. Déployer

```bash
npm run build
git push
```

Le démarrage du site applique automatiquement les migrations de la base (`prisma migrate deploy`).

## 6. Créer le propriétaire du site (premier compte du bureau)

1. S'inscrire normalement sur le site et cliquer sur le lien reçu par e-mail.
2. Dans Coolify → application → **Terminal** :
   ```bash
   npm run admin:promouvoir -- votre-adresse@exemple.fr
   ```
   Le premier compte promu devient **propriétaire** (le président) ; les suivants, administrateurs.
3. Les comptes suivants se valident depuis **Administration → Comptes**. Pour les autres membres du
   bureau : boutons « Rendre animateur » / « Rendre administrateur ». Lors de la passation, le
   propriétaire transmet son titre (« Transmettre le titre de propriétaire »).

## 7. Importer l'Excel des anciens

À décider au moment de la mise en ligne. L'Excel est sur un PC, la base sur le serveur :
- soit ouvrir temporairement un port public sur la base Coolify, lancer depuis le PC
  `npm run import:excel -- "fichier.xlsx" --confirmer` avec `DATABASE_URL` pointant vers ce port,
  puis refermer le port ;
- soit refaire la vérification des fiches importées en local, et ressaisir dans l'administration.

Le rapport `import-excel-rapport.csv` liste les fiches à vérifier (vœux multiples, noms composés…).
Les établissements des formations importées sont reliés à la liste commune et apparaissent « à
contrôler » dans **Administration → Établissements**. Pour des formations saisies autrement :
`npm run etablissements:relier -- --confirmer` (simulation sans `--confirmer`).

Les bases de master (prénom, nom, e-mail) s'importent depuis **Administration → Pré-comptes**
(fichier CSV, aperçu avant création), puis on envoie les liens d'invitation.

## 8. Nom de domaine

Chez Hostinger : faire pointer `bilicence.fr` (enregistrement A) vers l'adresse IP du VPS, puis
déclarer le domaine dans Coolify (HTTPS automatique). Mettre à jour `BETTER_AUTH_URL`.

## Avant d'ouvrir le site au public

Les mentions légales, la politique de confidentialité et la page « Vos données » sont rédigées.
Il reste à renseigner dans `src/lib/site.ts` (bloc `association` et `hebergeur`) :
- l'adresse du **siège** et le **numéro RNA** (statuts / récépissé de préfecture) ;
- l'**adresse e-mail** de contact officielle (sinon, le formulaire de contact est utilisé) ;
- le **pays du serveur** (panneau Hostinger → VPS → emplacement) ;
- le lien **HelloAsso** et le lien **Instagram** (bloc `liens`).

Puis vérifier une sauvegarde et sa restauration.

## Sécurité en place

En-têtes HTTP de sécurité (`next.config.ts`), limitation des tentatives (connexion, inscription,
mot de passe oublié, contact, offres), validation de toutes les saisies côté serveur, vérification
de la signature des images téléversées, contrôle d'accès dans chaque action. Après chaque mise à
jour des dépendances : `npm audit --omit=dev`.
