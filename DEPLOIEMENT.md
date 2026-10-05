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
| `LIEN_DRIVE` | Adresse du Drive des cours (menu des membres validés ; jamais dans le code, le dépôt est public) |

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

## 7. Charger les données réelles (annuaire, poursuites d'études, Erasmus)

Les trois fichiers Excel de Guillaume (annuaire privé, poursuites d'études, destinations Erasmus) sont
compilés en une seule liste de personnes par `npm run import:reel` : une fiche par personne et un
pré-compte (statut INVITE) pour celles dont on a l'adresse e-mail. Les fichiers restent HORS du dépôt.

En local (déjà fait le 4 octobre 2026, base vidée puis remplie) :

```bash
npm run import:reel -- --annuaire "…" --poursuite "…" --erasmus "…"                  # simulation + rapport
npm run import:reel -- --annuaire "…" --poursuite "…" --erasmus "…" --confirmer --vider --proprietaire adresse@exemple.fr
```

Le rapport `import-donnees-rapport.csv` (ignoré par Git) liste les points à vérifier : promotions
ESTIMÉES pour les adhérents absents des fichiers de poursuite/Erasmus (année de naissance + 18 ans,
ajustée par la date d'entrée dans l'association), universités Erasmus déduites de la ville, noms de
l'Excel de poursuite à relire.

En production, la base est vide au départ. Deux façons de la remplir :
- **tunnel SSH** depuis le PC (jamais de port public sur la base, même « temporairement » : elle
  contient toutes les données personnelles). Dans Coolify, noter l'adresse IP interne du conteneur
  PostgreSQL, puis depuis le PC : `ssh -L 5434:<ip-interne>:5432 utilisateur@<ip-du-vps>` ; dans un
  autre terminal, lancer la commande `--confirmer` (sans `--vider`) avec `DATABASE_URL` pointant vers
  `localhost:5434`, puis fermer le tunnel ;
- ou ne rien importer et laisser le bureau créer les pré-comptes depuis **Administration → Pré-comptes**.

Compte propriétaire (président) : `npm run admin:creer -- adresse@exemple.fr "Prénom" "Nom" [promo]`
(mot de passe généré, écrit dans `../IDENTIFIANTS-ADMIN.txt` hors Git ; `PROPRIETAIRE_MOT_DE_PASSE`
permet d'imposer le même mot de passe qu'en local). Cette commande remplace l'étape 6.

Ensuite : **Administration → Pré-comptes → envoyer les invitations** (après avoir configuré le SMTP,
étape 3). L'ancien import `npm run import:excel` reste disponible pour le seul fichier de poursuite.
`npm run etablissements:relier -- --confirmer` relie les formations saisies autrement.

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

Audit complet du 5 octobre 2026. Dans le code :
- **API d'authentification fermée** : `src/app/api/auth/[...all]/route.ts` ne laisse passer que les liens
  reçus par e-mail (confirmation d'adresse, réinitialisation). Tout le reste passe par les formulaires du
  site (server actions), qui vérifient mot de passe, limites et consentement. Ne pas rouvrir cette route.
- **Limitation des tentatives** (`src/lib/limite.ts`) par adresse IP ET par adresse e-mail visée
  (connexion, inscription, mot de passe oublié, double authentification, contact, invitation). L'IP est la
  DERNIÈRE de `X-Forwarded-For` (celle ajoutée par le proxy de Coolify). **Après la mise en ligne**, vérifier
  dans les journaux qu'un essai de connexion raté est bien compté avec votre IP publique ; si un autre proxy
  (Cloudflare…) est ajouté devant Coolify, adapter `adresseIp()`.
- **Double authentification** facultative (Mon compte), alertes par e-mail lors d'un changement de mot de
  passe, d'adresse ou de double authentification.
- **En-têtes HTTP** (`next.config.ts`) dont une politique de contenu (CSP) qui n'autorise que le site
  lui-même et le cadre HelloAsso. Nouveau service externe (vidéo, carte…) = l'ajouter à la CSP.
- Validation de toutes les saisies côté serveur, signature des images vérifiée, PDF jamais publics.
- **Journal** des actions sensibles du bureau (rôles, suppressions, export CSV, liens de connexion) :
  lignes `[journal]` dans Coolify → Logs.
- Après chaque mise à jour des dépendances : `npm audit --omit=dev` (reste connu : `deepmerge-ts`, outil
  Prisma en ligne de commande, non exposé ; ne PAS lancer `npm audit fix --force`, qui rétrograde Prisma).

À faire hors du code, avant d'ouvrir le site :
- **GitHub** : double authentification sur le compte ; Settings → Code security → Dependabot alerts,
  Secret scanning et Push protection ; règle de protection de la branche `main` (chaque push déploie).
  Le dépôt est **public** : envisager de le passer en privé (Coolify sait déployer un dépôt privé).
- **Coolify, Hostinger, Brevo** : mots de passe uniques et double authentification.
- **VPS** : connexion SSH par clé uniquement (mot de passe désactivé), pare-feu limité aux ports 22, 80
  et 443, mises à jour de sécurité automatiques.
- **Base** : jamais de port public (voir §7, tunnel SSH).
- **Sauvegardes** : quotidiennes, envoyées hors du VPS et **chiffrées** (elles contiennent toutes les
  données personnelles) ; tester une restauration.
- **E-mails** : SPF, DKIM **et DMARC** sur `bilicence.fr` (enregistrements donnés par Brevo).
- **Secrets** : dans un gestionnaire de mots de passe, jamais dans des fichiers texte ; mot de passe du
  propriétaire en production différent de celui du PC.
