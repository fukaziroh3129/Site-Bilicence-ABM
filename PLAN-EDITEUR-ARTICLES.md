# Éditeur d'articles enrichi — propositions et plan technique

Demande de Guillaume (16 octobre 2026) : les articles sont trop simples (texte brut) ; l'association doit pouvoir
publier des articles agréables à lire et utiles (couleurs, polices, tailles, mise en page…).

## 1. Propositions

Principe : **on ne laisse pas tout libre**. Les couleurs, polices et tailles sont des choix dans une courte liste
tirée de la charte ABM (bordeaux, rose pâle, beige papier ; Playfair, Source Sans, Great Vibes, Anton). Un article
reste ainsi toujours « dans le style du site », même écrit par quelqu'un d'autre que Guillaume.

### A. Mise en forme du texte (barre d'outils)
| Fonction | Détail |
|---|---|
| Titres | titre de section et sous-titre (servent aussi au sommaire) |
| Gras, italique, souligné, barré, surligné | boutons + raccourcis Ctrl+B / Ctrl+I / Ctrl+U |
| **Couleur du texte** | bordeaux, rose, gris, blanc (pour les fonds foncés) |
| **Fond du texte (surlignage)** | rose pâle, beige, bordeaux |
| **Taille** | petit, normal, grand, très grand |
| **Police** | normale, Playfair (élégante), Great Vibes (manuscrite), Anton (affiche) |
| Listes | à puces, numérotée, à cocher |
| Citation | grande citation avec nom de l'auteur |
| Séparateur | filet orné de la charte |
| Lien et **bouton** | « Je m'inscris » → bouton bordeaux du site |

### B. Blocs de mise en page
| Bloc | Usage |
|---|---|
| Encadré « Info », « Important », « Conseil » | dates limites, à retenir, astuces |
| Fonds colorés (rose, beige, bordeaux) | mettre un passage en valeur |
| **Chiffres clés** | « 120 inscrits · 3 promotions · 14 pays » en grand |
| **Deux colonnes** | comparer, présenter deux intervenants |
| Texte centré | invitation, formule d'ouverture |
| **Galerie de photos** | 2 ou 3 photos côte à côte avec légendes |

### C. Images dans le texte
Téléversement depuis la barre d'outils, légende, taille (petite, moyenne, grande) et place (à gauche, à droite
avec le texte autour, centrée). Seules les images téléversées sont acceptées (sécurité + pas de cookies tiers).

### D. Confort d'écriture
- **Aperçu fidèle** : l'onglet « Aperçu » utilise exactement le même rendu que la page publique.
- **Modèles de départ** : compte rendu d'événement, portrait d'ancien, annonce.
- **Aide-mémoire** repliable, compteur de caractères, « Enregistrer et continuer » (sans quitter l'éditeur).

### E. Confort de lecture
Sommaire cliquable (option, pour les longs articles), temps de lecture, auteur affiché, légende et cadrage
(haut / centre / bas) de la photo de couverture, bouton « Copier le lien » / « Partager », « À lire aussi »
(3 autres publications), date de mise à jour.

### Écarté volontairement
- Éditeur « tout visuel » (type Word) : dépendance lourde, enregistre du HTML (contraire à la règle de sécurité du
  projet : jamais de HTML saisi affiché tel quel).
- Vidéos YouTube/Instagram intégrées : cookies tiers, contraires aux mentions légales et à la politique CSP.
  Un lien ou un bouton suffit.
- Couleurs et polices libres, émoji : hors charte.

## 2. Plan technique

**Choix central : un texte à balises légères (« Markdown étendu ») dans la colonne `contenu` existante.**
Aucune conversion de données : un ancien article en texte simple s'affiche comme avant (paragraphes séparés par
une ligne vide, retours à la ligne conservés).

Pourquoi pas du HTML ? Le texte est transformé en *éléments React* par notre propre lecteur : rien n'est jamais
injecté en HTML brut (règle de sécurité du projet), et les couleurs/tailles/polices sont des noms d'une liste
fermée, pas du CSS libre.

| Étape | Fichier | Contenu |
|---|---|---|
| 1 | `prisma/schema.prisma` + migration écrite à la main | `Article.auteur`, `imageLegende`, `imageCadrage`, `sommaire` (ajouts sans risque) |
| 2 | `src/lib/article-texte.ts` | **Lecteur** (texte → arbre) : blocs, styles en ligne, liens/images sûrs, sommaire, temps de lecture |
| 3 | `src/components/article/corps-article.tsx` | **Rendu** de l'arbre en éléments React (charte ABM) ; utilisé par la page publique ET l'aperçu |
| 4 | `src/components/article/editeur-texte.tsx` | Éditeur client : barre d'outils, aperçu, modèles, aide-mémoire, raccourcis |
| 5 | `src/actions/admin.ts` | Champs ajoutés au schéma zod, action `televerserImageTexte`, « Enregistrer et continuer », nettoyage des images retirées |
| 6 | formulaire admin | Remplace la zone de texte, ajoute auteur / légende / cadrage / sommaire |
| 7 | page publique `/actualites/[slug]` | Rendu enrichi, sommaire, temps de lecture, partage, « À lire aussi » |
| 8 | `scripts/tester-article-texte.ts` | Tests du lecteur (compatibilité des anciens articles, sécurité des liens/images) |
| 9 | `ARTICLE-OUVERTURE-SITE.md` | Article d'ouverture réécrit avec les nouvelles possibilités |

Sécurité : liens limités à http(s), mailto, tel, adresses internes ; images limitées aux fichiers téléversés
(`/fichiers/<uuid>.jpg|png|webp`) ; envoi d'image réservé au bureau, vérifié par signature (`verifierImage`) ;
CSP inchangée.
