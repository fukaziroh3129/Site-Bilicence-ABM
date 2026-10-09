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
- Base de données : PostgreSQL 17 **dans Coolify** pour la prod (sauvegarde quotidienne à
  configurer). En local : `npm run db` lance un vrai PostgreSQL via le paquet npm
  `embedded-postgres` (port 5433, données dans `.pgdata/`, rien à installer). Accès via
  **Prisma 7** (client généré dans `src/generated/prisma`, config dans `prisma.config.ts`,
  adaptateur `@prisma/adapter-pg`). `migrate dev` ne régénère pas le client : `npm run dev` et
  `npm run build` lancent `prisma generate` d'abord.
- Authentification : **Better Auth** (`src/lib/auth.ts`), e-mail + mot de passe, confirmation
  de l'e-mail obligatoire, puis validation manuelle par le bureau (`statut` EN_ATTENTE → ACTIF).
  Contrôles d'accès : `exigerMembreActif()` / `exigerBureau()` / `exigerAdmin()` (`src/lib/session.ts`)
  au début de CHAQUE page et action protégée ; `src/proxy.ts` ne fait qu'un premier filtre (cookie).
  Rôles (patch ADM-01, `src/lib/roles.ts`) : MEMBRE < ANIMATEUR < ADMIN < PROPRIETAIRE.
  `exigerBureau()` = animateur et plus (console, validation des comptes, contenu, domaines,
  établissements, consultation des fiches) ; `exigerAdmin()` = administrateur et plus (modification
  des fiches, comptes, pré-comptes, export). Ne jamais comparer `role === "ADMIN"` : utiliser
  `estDuBureau()` / `estAdministrateur()`, et `peutChangerRole()` / `peutGererCompte()` pour agir
  sur un compte. Un seul propriétaire, jamais supprimé : il se transmet (`transfererPropriete`).
  `exigerCompte()` = connecté ET non refusé (comptes EN_ATTENTE compris) : réservé à l'accueil
  `/espace`, « Ma fiche » (et ses sous-pages) et « Mon compte ».
  E-mails : Nodemailer + SMTP Brevo ; sans `SMTP_HOST`, ils s'affichent dans le terminal.
- Formulaires : server actions (`src/actions/`) validées avec zod via `src/lib/formulaire.ts`
  (`valider`, `champ.*`), composants `src/components/formulaire.tsx` + `useActionState`.
  Dates/heures saisies interprétées en heure de Paris (`dateDeParis`).
- Recherche annuaire/stages : chargement de toutes les fiches puis filtre en JS
  (`correspond()` dans `src/lib/format.ts`, insensible aux accents) — suffisant pour ~100 personnes.
- Images téléversées : `src/lib/fichiers.ts`, rangées dans `UPLOAD_DIR` (volume persistant
  Coolify en prod), servies par `src/app/fichiers/[nom]/route.ts`.
- Pages publiques qui lisent la base : appeler `await connection()` (sinon Next tente de les
  pré-générer au build, sans base disponible).
- **Sécurité (audit du 3 octobre 2026)** : toute nouvelle action serveur doit commencer par
  `exigerAdmin()` / `exigerBureau()` / `exigerMembreActif()` / `exigerDroitSurFiche()` (sauf actions publiques) et
  valider ses entrées avec `valider()` ; actions publiques sensibles limitées par
  `autoriser()` (`src/lib/limite.ts`) ; redirections internes via `cheminSur()` uniquement ;
  jamais de `dangerouslySetInnerHTML` sur du contenu saisi ; images téléversées vérifiées par
  signature (`verifierImage`, asynchrone) ; exports CSV neutralisent les formules Excel.
  En-têtes HTTP dans `next.config.ts`. Next.js épinglé en 16.3.8 (failles critiques avant).
  `npm audit --omit=dev` : restent `deepmerge-ts` (outil Prisma en ligne de commande, non exposé).
- **Sécurité (audit complet du 5 octobre 2026 ; le dépôt GitHub est PUBLIC)** :
  - L'API HTTP de Better Auth est FERMÉE (`src/app/api/auth/[...all]/route.ts`) : seuls les liens d'e-mail
    (GET `verify-email`, `reset-password/<jeton>`, `error`) passent. Tout appel à Better Auth se fait côté
    serveur (`auth.api.*` dans `src/actions/`) ; ne jamais ajouter `createAuthClient` ni rouvrir la route,
    sinon on contourne mot de passe exigé, limites et consentement.
  - Limites : `autoriser()` / `autoriserPour(action, email, [max, s] par IP, [max, s] par e-mail)` ;
    `adresseIp()` lit la DERNIÈRE IP de `X-Forwarded-For` (celle du proxy Coolify, pas celle du navigateur).
  - Double authentification facultative (plugin `twoFactor`, table `TwoFactor`) : activation / désactivation
    dans « Mon compte » (`preparerDoubleAuth`, `confirmerDoubleAuth`, `desactiverDoubleAuth`), 2e étape de
    connexion `/connexion/verification` (`verifierCodeConnexion`). `nextCookies()` reste le DERNIER plugin.
  - E-mails : `envoyerEmail` ne lève jamais d'erreur et, en production sans SMTP, n'écrit jamais le contenu
    (liens de connexion) dans le journal. Alertes `alerteSecurite()` (mot de passe, adresse, 2FA modifiés).
  - Le propriétaire ne peut pas supprimer son compte (`beforeDelete`) : il transmet d'abord son titre.
  - Actions sensibles du bureau tracées par `journaliser()` (`src/lib/journal.ts`) : à appeler dans toute
    nouvelle action de ce type (rôle, suppression, export, lien donnant accès à un compte).
  - CSP stricte (`next.config.ts`) : tout nouveau service externe (cadre, script, image distante) doit y être
    ajouté explicitement. Rien de privé dans `src/lib/site.ts` (importé côté navigateur) : le Drive des cours
    vient de la variable `LIEN_DRIVE`, ajoutée au menu des seuls membres validés (`src/app/espace/layout.tsx`).
  - Comptes REFUSÉS supprimés 30 jours après l'inscription par `maintenance()`.
- Identité juridique, hébergeur, prestataire d'e-mails : `src/lib/site.ts` (bloc `association`,
  `hebergeur`, `emailing`), utilisés par `/mentions-legales`, `/confidentialite`, `/vos-donnees`.
- Maintenance automatique (`src/lib/maintenance.ts`) via `/api/sante` : suppression des
  inscriptions non confirmées après 30 jours (engagement de la politique de confidentialité).
- Modèle de données : une fiche `Personne` existe indépendamment d'un compte (personnes
  importées de l'Excel ou saisies par le bureau) ; un compte se rattache à une fiche.
- Contacts dans l'annuaire : chaque membre choisit, champ par champ, ce qu'il affiche.
- Polices : chargées via `next/font` dans `src/app/layout.tsx` (auto-hébergées, pas d'appel
  à Google côté visiteur) ; `typography.css` référence leurs variables.
- Liens externes (HelloAsso, Instagram), mandat du bureau, menus : `src/lib/site.ts`.
  Domaines professionnels (ex-« secteurs ») : table `Domaine` en base, outils dans
  `src/lib/domaines.ts`. Les fiches/expériences stockent le CODE (`secteurs: String[]`) ; un membre
  peut ajouter un domaine, utilisable tout de suite (filtres compris) et marqué `aControler` ; le
  bureau le contrôle, renomme, fusionne ou supprime dans `/admin/domaines`. 3 domaines max par fiche.
- Page publique « Que sont-ils devenus ? » (`/promotions`) : carrousel de cartes
  (`src/components/parcours/`), données limitées à ce que couvre le consentement public
  (jamais coordonnées, rapports de stage, contacts de tuteurs). Après un changement de schéma
  Prisma, redémarrer `npm run dev` (le client Prisma est gardé en mémoire).
- Patchs de la partie publique (PATCHS.md, partie 1, appliqués le 3 octobre 2026) :
  - Statistiques « Que deviennent-ils ? » (`src/lib/statistiques.ts` + `src/components/statistiques/`) :
    top 3 domaines et top 3 établissements, en proportions, calculés sur TOUTES les fiches (jamais de
    nom). Sous le carrousel de `/promotions` (un clic filtre le carrousel via l'événement
    `abm:filtrer-parcours`) et sur `/la-formation` (liens `/promotions?domaine=…` / `?etablissement=…`).
    Tous les IEP forment une barre empilée Sciences Po Paris / autres IEP.
  - Établissements : depuis ADM-03, type lu dans la liste commune (`decrireEtablissement`, voir partie 3
    ci-dessous) ; la reconnaissance par le nom (`reconnaitreEtablissement`) ne sert plus qu'à deviner le
    type d'un nouvel établissement et aux formations encore sans lien.
  - Page Formation : contenu dans `src/lib/formation.ts` (maquette 2024-2025, chiffres Parcoursup
    2021-2025, sources) ; carte du cursus en fenêtre `<dialog>` (`src/components/formation/`).
    À mettre à jour chaque année.
  - Actualités : case « à la une » (`Article.aLaUne`, grand format en tête) et archive paginée par année.
  - Bureau : frise animée (`src/components/bureau/frise-bureau.tsx`). **Fonctions et pôles = étiquettes créées en
    administration (8 octobre 2026, choix de Guillaume)** : table `Fonction` (`niveau` BUREAU | POLE, `ordre` = rang
    dans le niveau, `icone` = clé de `src/lib/fonctions-bureau.ts`, `description` d'un pôle), reliée en plusieurs-à-plusieurs
    à `MembreBureau.fonctions` (une personne peut porter plusieurs étiquettes ; `MembreBureau.role` n'est plus qu'une
    précision libre). Plus de liste de pôles dans `site.ts`. Page publique `/bureau` : les personnes ayant une fonction
    BUREAU en haut, ensemble (la mieux classée en tête de frise), puis chaque pôle en grand sur la frise. Administration
    `/admin/bureau` : onglets Membres / Fonctions et pôles (`?vue=etiquettes`, création, flèches monter/descendre,
    actions dans `src/actions/fonctions.ts`) ; un membre sans étiquette n'est affiché nulle part.
  - **Adhésion = création de compte (5 octobre 2026, choix de Guillaume)** : l'adhésion est gratuite et ne passe
    plus par HelloAsso. Page `/adhesion` (`/inscription` y redirige, `next.config.ts`) : choix du profil, formulaire
    et carte d'adhésion qui se remplit pendant la saisie (`src/components/adhesion/carte-adhesion.tsx`).
  - **Profils de compte** (`User.profil`, `src/lib/profils.ts`) : `ALUMNI` (étudiant ou ancien, promotion, fiche) ou
    `PERSONNEL` (enseignant, responsable de la formation, direction, administration : `User.fonction` = code de
    `FONCTIONS_PERSONNEL`). Un compte PERSONNEL n'a JAMAIS de fiche : `validerCompte` ne crée ni ne rattache de fiche,
    « Ma fiche » est masquée et `/espace/ma-fiche` / `creerMaFiche` le renvoient à l'accueil ; il n'apparaît donc ni
    dans l'annuaire ni sur le site public. Validé par le bureau comme les autres, puis même accès qu'un membre
    (annuaire, stages, offres, proposer une offre). Tester avec `estPersonnel(user)`, jamais `profil === …` en dur.
  - **Boutique** (`/boutique`) : boutique de goodies hébergée par HelloAsso, adresses des deux widgets dans
    `site.liens.boutique` (à changer à chaque nouvelle boutique annuelle) + page générale `site.liens.helloAsso`. Le
    redimensionnement du widget (`src/components/boutique/widget-helloasso.tsx`) n'accepte que les messages de
    `https://www.helloasso.com` venant de son propre cadre.
- Patchs des comptes membres (PATCHS.md, partie 2, appliqués le 3 octobre 2026) :
  - Menu de l'espace (`src/components/nav-deroulante.tsx`, données `navigationMembres` dans `site.ts`) :
    menus déroulants « Réseau » (Annuaire, Que sont-ils devenus ?, Statistiques), « Opportunités » (Archive des stages,
    Offres, Erasmus) et « Mon profil » (Ma fiche, Mon compte) (réorganisé le 4 octobre 2026 ; l'onglet
    Événements a disparu le 5 octobre, les événements étant publics sur `/actualites`) ; plein écran sous 1024 px (rendu dans `<body>` via un portail, car `template.tsx`
    anime les pages). `restreint: true` = rubrique fermée aux comptes en attente (cadenas + fenêtre
    `DialogueRestreint`). Le même composant sert à l'administration (`navigationAdmin` : « Membres » =
    Comptes, Pré-comptes, Fiches ; « Listes » = Domaines, Établissements, Mentions) : props `racine`, `libelle`,
    `titre`. Une nouvelle rubrique = une entrée dans `site.ts` (+ son pictogramme dans `ICONES`).
  - Comptes EN_ATTENTE (MEM-09) : accueil dédié, « Ma fiche » et « Mon compte » seulement ; toute page
    `exigerMembreActif()` les renvoie vers `/espace?acces=restreint` (fenêtre d'explication). Leur fiche
    reste CACHÉE partout : filtre `FICHE_VISIBLE` (`src/lib/visibilite.ts`) à appliquer à TOUTE requête
    qui montre des fiches aux membres ou au public. À la validation, `validerCompte` peut fusionner la
    fiche commencée avec une fiche existante (`fusionnerFiches`). Supprimer un compte non validé
    supprime aussi sa fiche (sinon elle deviendrait visible).
  - « Ma fiche » = assistant en 6 étapes (`src/components/fiche/assistant-fiche.tsx`, étapes et taux de
    remplissage dans `src/lib/completude.ts`, action `enregistrerEtapeFiche`), aperçu de la carte publique
    (`ApercuCarte`, construction partagée avec /promotions dans `src/lib/parcours.ts`). Le bureau garde
    l'éditeur sur une page (`EditeurFiche`). Les sous-pages formation/expérience/Erasmus reviennent à
    l'étape concernée (`pageDeFiche(…, etape)`).
  - Stages (MEM-03/04) : champs `missions`, `obtention` (ex-`rapport`, colonne renommée), contact
    (`partagerContact`, `contactFonction`, et nom + `contactMoyen` seulement si `contactAccord` — sinon
    effacés à l'enregistrement), rapport PDF (`rapportFichier`, `partagerRapport`). Fiche détaillée
    commune `src/components/fiche/detail-experience.tsx` (fenêtre de l'archive, annuaire).
  - PDF (TRA-03) : `verifierPdf` / `enregistrerPdf` (`src/lib/fichiers.ts`), 10 Mo max, rangés dans
    `UPLOAD_DIR/rapports`, JAMAIS servis par `/fichiers` : téléchargement via `/espace/rapports/[id]`
    (membres validés si partagé ; auteur et administrateurs toujours), en pièce jointe. Penser à
    `supprimerRapportsDe(personneId)` (`src/lib/rapports.ts`) avant de supprimer une fiche.
  - Fenêtres (pop-up) : composant commun `src/components/fenetre/fenetre.tsx` (`Fenetre`, `BoutonFenetre`).
  - Offres : description raccourcie, « Voir l'offre » ouvre la fenêtre complète (MEM-07).
  - Mon compte (MEM-06) : changement d'adresse e-mail (mot de passe vérifié par `auth.api.verifyPassword`,
    lien envoyé à la nouvelle adresse, `user.changeEmail` dans `auth.ts`) ; `afterEmailVerification`
    ne prévient le bureau que pour une inscription (`estChangementEmail`).
  - Événements : voir « Publications » ci-dessous (fusion avec les actualités le 5 octobre 2026).
- **Publications = actualités ET événements (fusion du 5 octobre 2026, choix de Guillaume)** : une seule
  table `Article` avec `type` (`ACTUALITE` | `EVENEMENT`) et, pour un événement, `debut` (obligatoire),
  `fin`, `lieu`, `lien` ; `contenu` facultatif pour un événement (compte rendu ajouté après coup). La table
  `Evenement` n'existe plus. Un seul formulaire (`src/app/admin/actualites/[id]/formulaire.tsx`, sélecteur
  Actualité / Événement ; catégorie masquée pour un événement) et une seule liste admin « Publications »
  (`/admin/actualites`, filtre `?type=`) ; `/admin/evenements` redirige. Les événements sont PUBLICS :
  page unique `/actualites` = agenda des événements à venir en tête (`src/components/evenements/agenda.tsx` :
  prochain rendez-vous + compte à rebours, frise par mois, mise en page MEM-08) puis fil des actualités
  et des événements passés (affiche jour/mois si pas de photo), filtres Tout / Actualités / Événements
  et archive par année ; tri par date de référence (`debut` pour un événement, sinon `publieLe`), en JS.
  Page détail : encart date/lieu + Google Agenda + `.ics` public (`/actualites/[slug]/ics`). Outils
  d'agenda : `src/lib/calendrier.ts` (`estEvenement`, type `Evenement` = article daté).
  `/espace/evenements` redirige vers `/actualites?type=evenements` ; l'accueil de l'espace garde le
  panneau « Prochains événements ».
- **Réseaux sociaux sur l'accueil (5 octobre 2026, choix de Guillaume)** : adresses de l'association dans
  `site.liens.instagram` / `site.liens.linkedin` (`src/lib/site.ts`). Icônes de marque en SVG inline
  (`src/components/icones-sociales.tsx` : `LiensReseaux`, `reseauxDeLAssociation`), affichées dans le bandeau, la
  section « Suivez-nous » et l'appel final de l'accueil, le pied de page et la page Contact. Section
  `src/components/section-reseaux.tsx` : boutons de profil + les 3 derniers posts publiés (`PostSocial`, saisis dans
  `/admin/reseaux` : réseau, adresse du post vérifiée sur le domaine du réseau, légende, visuel téléversé, publié).
  Aucun embed ni appel à Instagram/LinkedIn : pas de cookie tiers (les mentions légales disent qu'il n'y en a pas) ;
  ne jamais copier une image depuis un réseau (liens qui expirent) : sans visuel, cadre « Visuel à ajouter ».
- **Statistiques du réseau, mentions de master, « Ma fiche » complète (8 octobre 2026, choix de Guillaume)** :
  - « Ma fiche » : bascules `BasculeEtape` (`src/components/fiche/bascule-etape.tsx`, action `basculerEtapeSansElement`)
    « Je suis encore en bi-licence » (= `statutActuel` EN_LICENCE), « pas encore de stage » (`Personne.sansExperience`),
    « pas d'Erasmus » (`Personne.sansErasmus`) : l'étape compte comme remplie (`completude`, Erasmus compté depuis), une
    fiche peut atteindre 100 %. Ajouter une expérience / un séjour remet le drapeau à faux. La bi-licence n'est JAMAIS une
    formation en base (affichée automatiquement) : `estBiLicence()` (`src/lib/mentions.ts`) la refuse dans
    `enregistrerFormation` et l'exclut des statistiques ; `npm run bilicence:nettoyer` retire celles déjà saisies.
    Compteurs d'une fiche : `include: { _count: { select: COMPTES_FICHE } }` puis `completudeDe(fiche)`.
  - Mentions : tables `FamilleMention` (« grand domaine d'études ») et `Mention` (variantes = autres écritures), lien
    `Formation.mentionId` + `mentionAuto` (faux = choix d'une personne, jamais écrasé par la détection) + `mentionAControler`
    (choix d'un membre à vérifier). Reconnaissance sans dépendance dans `src/lib/mentions.ts` (`detecterMention` : nettoyage,
    correspondance exacte, expression, mots, approchée), aussi utilisée dans le navigateur (formulaire de formation : mention
    proposée, modifiable par l'étudiant). Outils base : `src/lib/liste-mentions.ts` (`redetecterMentions`, `FORMATION_A_CLASSER`).
    Administration `/admin/mentions` (`src/actions/mentions.ts`, `gestion-mentions.tsx`) : à classer, grands domaines et
    mentions (ajouter, renommer, déplacer, fusionner, supprimer si vide), fenêtres « Ce qui va changer », test d'écriture.
    Formations existantes / imports : `npm run mentions:detecter` (simulation, `--confirmer`, `--toutes`), appelé par les imports
    et le seed. Couleurs des grands domaines : `couleurFamille(rang)` (gamme bordeaux, dans l'ordre).
  - Domaines professionnels = domaine où l'on travaille OU que l'on vise (déduit de `statutActuel` : EN_POSTE / EN_ALTERNANCE =
    y travaille). Liste élargie (24) rangée par `Domaine.groupe` (`GROUPES_DOMAINES`, `src/lib/domaines.ts`), choisi aussi dans
    `/admin/domaines` ; `CasesMultiples` affiche les options par groupe.
  - Page `/espace/statistiques` (menu Réseau, membres validés, `src/lib/statistiques-reseau.ts` + `src/components/statistiques-reseau/`) :
    chiffres clés, établissements (double anneau type/établissement + liste), onglets Mentions (mosaïque ; liste groupée
    sous 768 px) / Domaines professionnels / Par promotion ; filtre de promotion et onglet dans l'adresse ; un clic ouvre le
    panneau latéral (`Fenetre` `laterale`) listant les personnes, filtrable, chaque ligne vers `/espace/annuaire/[id]`.
  - Public (`StatsDevenir`) : le podium « Leurs domaines » est devenu « Ce qu'ils ont étudié » (top 3 des grands domaines
    d'études) ; filtre du carrousel `?famille=<code>` (`CarteParcours.familles`).
  - Maquette validée : `../maquettes/statistiques-reseau.html` (variante B).
- Patchs de l'administration (PATCHS.md, partie 3, appliqués le 4 octobre 2026) :
  - Rôles (ADM-01) : voir « Authentification » ci-dessus. Page `/admin/comptes` : boutons selon
    `peutChangerRole` ; « Lien de mot de passe » envoie un lien de réinitialisation (le bureau ne voit
    jamais les mots de passe). Navigation admin filtrée (`navigationAdmin`, `admin: true` sur un lien, y compris dans un groupe ; filtre dans `src/app/admin/layout.tsx`).
  - Motif de modification (ADM-02) : quand un administrateur modifie la fiche d'un membre AYANT un
    compte (autre que la sienne), chaque action de `src/actions/fiche.ts` exige un motif (`lireMotif` /
    `motifSuppression` / `noterModification`, `src/lib/notes.ts`), champ `ChampMotif` dans les
    formulaires (`demanderMotif`), invite du navigateur pour les suppressions (`BoutonSupprimer`).
    Table `NoteModification` : visible du membre en tête de « Ma fiche » (`NotesBureau`, « J'ai pris
    connaissance ») et des administrateurs (historique sur `/admin/personnes/[id]`). Toute nouvelle
    action de modification de fiche doit suivre ce schéma. Les animateurs consultent les fiches sans
    pouvoir les modifier ; l'assistant « Ma fiche » refuse les modifications par le bureau.
  - Liste unifiée des établissements (ADM-03) : table `Etablissement` (ex-`Universite`, champ `type`
    IEP / UNIVERSITE / ECOLE / AUTRE), utilisée par Erasmus (`Erasmus.universiteId`) ET par les
    formations (`Formation.etablissementId` ; `Formation.etablissement` garde une copie du nom, tenue à
    jour lors d'un renommage ou d'une fusion). Outils dans `src/lib/liste-etablissements.ts`
    (`trouverOuCreerEtablissement`, `trouverOuAjouterUniversite`). Ajout par un membre = utilisable
    tout de suite, `aControler` + `ajouteParId`, listé dans le tableau de bord (« À contrôler ») et dans
    `/admin/etablissements` (contrôle, fusion des doublons, suppression si inutilisé, import CSV).
    `/admin/universites` redirige vers cette page. Formations anciennes ou importées :
    `npm run etablissements:relier` (`scripts/relier-etablissements.ts`, appelé aussi par le seed et
    l'import Excel). Sur cette page, les pays se saisissent avec UNE liste de suggestions partagée
    (`<datalist>`) : ne pas remettre un `<select>` de pays par ligne (page de plusieurs Mo).
  - Pré-comptes (ADM-04) : statut `INVITE` (compte sans mot de passe, fiche VISIBLE des membres,
    exclu du ménage des inscriptions non confirmées). `/admin/invitations` : import CSV en deux temps
    (`analyserImport` → aperçu, `confirmerImport`), envoi des liens (`src/lib/invitations.ts`, jeton
    stocké haché dans `Verification`, 30 jours) ou lien à copier. `/invitation/[jeton]` : la personne
    choisit son mot de passe → compte ACTIF, e-mail confirmé, connexion. « Créer un compte » et « Mot de
    passe oublié » renvoient le lien d'invitation à un pré-compte (`inviterSiPreCompte`).
    L'e-mail d'invitation dit d'où viennent les données et comment les modifier ou les supprimer.
  - Fichiers CSV importés dans l'admin : `src/lib/csv.ts` (séparateur détecté, UTF-8 ou Windows-1252,
    2 Mo max).
  - Limites de longueur (ADM-05) : chaque champ du bureau porte son `maxLength`, et `ZoneTexte`
    affiche un compteur de caractères quand `maxLength` est fixé. Garder la limite du formulaire
    identique à celle du schéma zod de l'action.
- **Données personnelles envoyées par Guillaume (TRA-04)** : bases de masters (prénom, nom, e-mail),
  listes de membres, séjours Erasmus, base d'universités… Ces fichiers restent HORS du dépôt Git et
  hors du dossier du projet (ex. `Téléchargements`) ; ne jamais les copier en fixture, en exemple ni
  dans un commit (`.gitignore` exclut déjà `*.xlsx`, `*.xls`, `import-*.csv`). On les traite par import
  local : console d'administration (Pré-comptes, Établissements → Importer) ou script avec simulation
  par défaut et `--confirmer`. Ne pas afficher leur contenu au-delà de ce qu'il faut pour en comprendre
  la structure. Import groupé des trois fichiers (annuaire privé, poursuites, Erasmus) : `npm run import:reel`
  (`scripts/import-donnees-reelles.ts`, fait en local le 4 octobre 2026) ; propriétaire : `npm run admin:creer`.
- Plan de construction par étapes (validé le 3 octobre 2026) : la **structure fonctionnelle**
  (étapes 0 à 9 : base, comptes, fiche, annuaire, stages, historique public, offres,
  événements, actualités, bureau, admin) est en place. Restent : contenus réels et finitions
  de design (Guillaume enverra les informations), puis l'étape 10 (mise en ligne, voir
  `DEPLOIEMENT.md`).
- Import de l'Excel historique : `npm run import:excel` (`scripts/import-excel.ts`), simulation
  par défaut, `--confirmer` pour écrire ; rapport `import-excel-rapport.csv` (ignoré par Git).
- **Données réelles : import groupé AVANT la mise en service complète.** Guillaume enverra
  toutes ses bases (masters / poursuites d'études, Erasmus, liste des membres) pour qu'elles
  soient importées en une fois avant l'ouverture du site. D'ici là, on ne construit que des
  gabarits avec des données d'EXEMPLE (fictives, comptes `@exemple.test`) : ne pas réclamer
  ces fichiers, ne pas inventer de données réelles.
- Les données Excel des anciens contiennent des données personnelles : ne jamais les copier
  dans le dépôt Git (ni en fixture, ni en exemple).
- Langue : français uniquement pour l'instant

## Déploiement

- Hébergement : VPS Hostinger (KVM 4), avec Coolify installé comme plateforme de déploiement.
- Dépôt GitHub : https://github.com/fukaziroh3129/Site-Bilicence-ABM (branche `main`)
- Déploiement automatique : chaque `git push` sur `main` redéploie le site via webhook Coolify.
- Nom de domaine prévu à terme : bilicence.fr (actuellement chez Hostinger, pas encore
  pointé vers le VPS).
- Avant le premier push utilisant la base : configurer Coolify (base, variables, volume) —
  voir `DEPLOIEMENT.md`. Le démarrage applique les migrations (`prisma migrate deploy`).
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
- Adhésion gratuite = création de compte sur le site. Boutique (et dons éventuels) : HelloAsso (widgets
  intégrés sur `/boutique`), pas de paiement à développer sur le site.
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
- **Dégradés et animations : autorisés depuis le 3 octobre 2026** (demande de Guillaume, pour un
  rendu plus premium), dans ces limites : dégradés UNIQUEMENT tonaux dans la gamme bordeaux
  (tokens `--degrade-*` et classes `.fond-bordeaux`, `.fond-bordeaux-profond`, `.filigrane`,
  `.carte-premium`, `.projecteur`, `.reflet`, `.lien-anime` dans
  `src/styles/design-system/effets.css`) ; animations motivées (apparition au défilement,
  sceau 3D du bandeau d'accueil, compteurs de chiffres RÉELS) via `src/components/anime.tsx` (bibliothèque
  Motion) ; tout ce qui est visible dès l'arrivée sur la page (bandeaux) s'anime en CSS pur
  (`.apparait`, `.revele-mot`) pour s'afficher même avant le JavaScript ; toujours respecter
  « réduire les animations ». Toujours interdits : flou (`backdrop-filter`), texture de bruit,
  couleurs hors charte, émoji. Pictogrammes vectoriels (Lucide) uniquement.
- Éléments graphiques institutionnels disponibles : `<Ornement />` (filets + losange ◆ qui se
  dessinent), `<FiletTitre />` (filet sous les titres de section, déjà dans `TitreSection`),
  `<SceauHero />` (sceau seul en CSS 3D, tourné vers le texte, devant un anneau fin, respiration ± 4°,
  sans parallaxe ni rebond) et `<MotifCourbes />` (courbes de niveau blanches à 8 % en fond du bandeau
  d'accueil, effacées dans la couronne du sceau ; motif original régénérable par
  `node scripts/motif-courbes.mjs`, aucune licence à créditer),
  `.cadre-fin` (cadre fin intérieur, « FramedPanel » de la charte), `.lettrine` (première lettre
  des articles), `<SceauFiligrane />` (grand sceau en filigrane qui pivote au défilement).
  Les utiliser avec parcimonie : un ornement par page au plus, pas de cadre sur chaque carte.
- **Pages de travail (refonte du 4 octobre 2026, maquette `../maquettes/refonte-espace-admin.html`)** : briques
  dans `src/components/ui.tsx` à réutiliser plutôt que de réécrire des cadres à la main :
  `BandeauEspace` (bandeau bordeaux COMPACT des pages de l'espace membres : titre, phrase, chiffre clé Anton, bouton
  `inverse`), `EnTeteConsole` (en-tête des pages admin : titre + filet dégradé, PAS de bandeau bordeaux — seul le
  tableau de bord admin en a un), `Panneau` (cadre blanc `shadow-abm-card`, en-tête titre + `Compte` + action ;
  `corps={false}` pour une liste ou un tableau bord à bord ; `sensible` pour une zone de suppression), `FilAriane`
  (retour en pilule + « Annuaire / Nom »), `Initiales` (médaillon, faute de photo), `BlocDate` (jour + mois, « sans
  date »), `classesTableau` (tableaux admin), `classeLisere` (liseré bordeaux à gauche = « attend une action »),
  `classeSaisie`, boutons `outline` / `danger` et taille `"petit"` (`buttonClasses(variante, taille)`).
  Règles : une seule ombre au repos (`shadow-abm-card`), l'ombre forte au survol et pour les fenêtres ; animations
  seulement sur les bandeaux, jamais sur les listes ni les tableaux. Annuaire, Offres et Archive des stages filtrent
  INSTANTANÉMENT dans le navigateur (`src/components/filtres-instantanes.tsx` : `CadreFiltres`, `ChampRecherche`,
  `PastillesChoix`, `ListeChoix`, `Bascule`, `Tri`, `useFiltresDansAdresse` qui garde les filtres dans l'adresse) ;
  les listes admin gardent le formulaire GET `Filtres` (`src/components/filtres.tsx`). Offres : « Proposée par Prénom
  N. (promo) », visible des seuls membres connectés (choix de Guillaume). Encart d'avancement de la fiche :
  `EncartCompletude` ; sous-pages de Ma fiche : `GabaritSousPageFiche`.
- Accessibilité intégrée : lien « Aller au contenu », `scroll-padding-top` sous l'en-tête
  collant, récapitulatif d'erreurs focalisé avec liens vers les champs (`MessageFormulaire`),
  cibles cliquables de 24 px minimum.
- Vouvoiement partout, typographie française stricte (espaces insécables, guillemets «»,
  dates en toutes lettres).
- Logo : `public/brand/logo-abm-seal{,-bordeaux,-white}.png`. **Attention** : le logo n'existe
  qu'en PNG (pas de SVG vectoriel) — les codes hex de la charte sont des estimations visuelles,
  à recaler si un fichier vectoriel source est fourni un jour. Pas de monogramme simplifié
  (favicon) fourni — ne pas en inventer un sans validation du bureau.
- Référence complète (ton éditorial, règles détaillées, composants) : design system Claude
  "ABM — Design System", https://claude.ai/artifact/RZbJkMeWPiK7bdsyapNeC9

## Images et logos manquants

Beaucoup de visuels (photos d'événements, portraits du bureau, logos partenaires —
notamment le logo de l'Université de Montpellier) ne sont pas encore disponibles et seront
ajoutés progressivement, au fur et à mesure du développement.

Règle à suivre : ne jamais remplacer une image manquante par une image générique, un
placeholder de banque d'images, ou une image générée par IA qui simulerait une vraie photo.
À la place, laisser un emplacement clairement identifié comme vide (cadre avec libellé du
type "Photo à ajouter — [description]" ou "Logo partenaire à ajouter : Université de
Montpellier"), aux bonnes dimensions/ratio, prêt à recevoir le fichier final plus tard. Ça
vaut aussi bien pour les logos partenaires que pour les photos éditoriales.

## Skills design installés

`ui-ux-pro-max` (dépôt nextlevelbuilder/ui-ux-pro-max-skill, licence MIT, installé le
3 octobre 2026) est dans `.claude/skills/ui-ux-pro-max/` : base de règles UX/accessibilité
interrogeable en local (`python .claude/skills/ui-ux-pro-max/scripts/search.py "<requête>"
--domain ux`). Utile pour les règles d'ergonomie ; ses propositions de palette et de polices
ne s'appliquent PAS (la charte ABM prime).

`taste-skill` (dépôt Leonxlnx/taste-skill) est installé dans `.claude/skills/` — il regroupe
13 variantes (taste générale, gpt-taste, styles spécifiques comme industrial-brutalist-ui,
minimalist-ui, etc.). Pour ce projet, rester sur le registre institutionnel/sobre du design
system ABM (voir section Design system ci-dessus) : ignorer les variantes de style qui ne
correspondent pas à cette identité (notamment les styles brutaliste ou minimaliste, à
l'opposé du registre "papier et sceau" bordeaux d'ABM).
