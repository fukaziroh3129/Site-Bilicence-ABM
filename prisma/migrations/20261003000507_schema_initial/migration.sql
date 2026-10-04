-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('EN_ATTENTE', 'ACTIF', 'REFUSE');

-- CreateEnum
CREATE TYPE "RoleCompte" AS ENUM ('MEMBRE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TypeExperience" AS ENUM ('STAGE', 'ALTERNANCE', 'EMPLOI', 'AUTRE');

-- CreateEnum
CREATE TYPE "Niveau" AS ENUM ('LICENCE', 'MASTER');

-- CreateEnum
CREATE TYPE "TypeOffre" AS ENUM ('STAGE', 'ALTERNANCE', 'EMPLOI');

-- CreateEnum
CREATE TYPE "StatutOffre" AS ENUM ('EN_ATTENTE', 'PUBLIEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "CategorieArticle" AS ENUM ('PORTRAIT_ANCIEN', 'PORTRAIT_ETUDIANT', 'VIE_LICENCE', 'ASSOCIATION');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prenom" TEXT NOT NULL DEFAULT '',
    "nom" TEXT NOT NULL DEFAULT '',
    "promoEntree" INTEGER,
    "statut" "StatutCompte" NOT NULL DEFAULT 'EN_ATTENTE',
    "role" "RoleCompte" NOT NULL DEFAULT 'MEMBRE',
    "personneId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personne" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "promoEntree" INTEGER NOT NULL,
    "situationActuelle" TEXT,
    "secteurs" TEXT[],
    "ville" TEXT,
    "linkedin" TEXT,
    "emailContact" TEXT,
    "telephone" TEXT,
    "afficherLinkedin" BOOLEAN NOT NULL DEFAULT false,
    "afficherEmail" BOOLEAN NOT NULL DEFAULT false,
    "afficherTelephone" BOOLEAN NOT NULL DEFAULT false,
    "consentementPublic" BOOLEAN NOT NULL DEFAULT false,
    "consentementPublicLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "parcours" TEXT,
    "etablissement" TEXT NOT NULL,
    "anneeDebut" INTEGER,
    "anneeFin" INTEGER,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "type" "TypeExperience" NOT NULL,
    "organisation" TEXT NOT NULL,
    "poste" TEXT,
    "secteurs" TEXT[],
    "niveau" "Niveau",
    "ville" TEXT,
    "debut" TIMESTAMP(3),
    "fin" TIMESTAMP(3),
    "contactNom" TEXT,
    "contactFonction" TEXT,
    "resume" TEXT,
    "rapport" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offre" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "type" "TypeOffre" NOT NULL,
    "lieu" TEXT,
    "description" TEXT NOT NULL,
    "lien" TEXT,
    "contact" TEXT,
    "dateLimite" TIMESTAMP(3),
    "statut" "StatutOffre" NOT NULL DEFAULT 'EN_ATTENTE',
    "publieeLe" TIMESTAMP(3),
    "deposeParId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "lieu" TEXT,
    "description" TEXT,
    "lien" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categorie" "CategorieArticle" NOT NULL,
    "chapo" TEXT,
    "contenu" TEXT NOT NULL,
    "image" TEXT,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "publieLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembreBureau" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "photo" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembreBureau_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_personneId_key" ON "user"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "Personne_promoEntree_idx" ON "Personne"("promoEntree");

-- CreateIndex
CREATE INDEX "Formation_personneId_idx" ON "Formation"("personneId");

-- CreateIndex
CREATE INDEX "Experience_personneId_idx" ON "Experience"("personneId");

-- CreateIndex
CREATE INDEX "Experience_type_idx" ON "Experience"("type");

-- CreateIndex
CREATE INDEX "Offre_statut_idx" ON "Offre"("statut");

-- CreateIndex
CREATE INDEX "Evenement_debut_idx" ON "Evenement"("debut");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_publie_publieLe_idx" ON "Article"("publie", "publieLe");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offre" ADD CONSTRAINT "Offre_deposeParId_fkey" FOREIGN KEY ("deposeParId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
