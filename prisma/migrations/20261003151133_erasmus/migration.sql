-- CreateEnum
CREATE TYPE "StatutUniversite" AS ENUM ('VALIDE', 'PROPOSE');

-- CreateEnum
CREATE TYPE "DureeErasmus" AS ENUM ('SEMESTRE', 'ANNEE');

-- CreateTable
CREATE TABLE "Universite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT,
    "pays" TEXT NOT NULL,
    "statut" "StatutUniversite" NOT NULL DEFAULT 'VALIDE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Universite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Erasmus" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "universiteId" TEXT NOT NULL,
    "annee" INTEGER,
    "duree" "DureeErasmus",
    "niveau" "Niveau",
    "descriptif" TEXT,
    "retour" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Erasmus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Universite_pays_idx" ON "Universite"("pays");

-- CreateIndex
CREATE INDEX "Universite_statut_idx" ON "Universite"("statut");

-- CreateIndex
CREATE INDEX "Erasmus_personneId_idx" ON "Erasmus"("personneId");

-- CreateIndex
CREATE INDEX "Erasmus_universiteId_idx" ON "Erasmus"("universiteId");

-- AddForeignKey
ALTER TABLE "Erasmus" ADD CONSTRAINT "Erasmus_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Erasmus" ADD CONSTRAINT "Erasmus_universiteId_fkey" FOREIGN KEY ("universiteId") REFERENCES "Universite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
