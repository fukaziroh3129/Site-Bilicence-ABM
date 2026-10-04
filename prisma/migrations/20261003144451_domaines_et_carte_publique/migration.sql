-- CreateEnum
CREATE TYPE "StatutActuel" AS ENUM ('EN_LICENCE', 'EN_MASTER', 'EN_DOCTORAT', 'EN_ALTERNANCE', 'EN_POSTE', 'CESURE', 'EN_RECHERCHE');

-- CreateEnum
CREATE TYPE "StatutDomaine" AS ENUM ('VALIDE', 'PROPOSE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeExperience" ADD VALUE 'ASSOCIATIF';
ALTER TYPE "TypeExperience" ADD VALUE 'VOLONTARIAT';

-- AlterTable
ALTER TABLE "Personne" ADD COLUMN     "conseil" TEXT,
ADD COLUMN     "presentation" TEXT,
ADD COLUMN     "statutActuel" "StatutActuel",
ADD COLUMN     "structureActuelle" TEXT;

-- CreateTable
CREATE TABLE "Domaine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "statut" "StatutDomaine" NOT NULL DEFAULT 'VALIDE',
    "ordre" INTEGER NOT NULL DEFAULT 100,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domaine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Domaine_code_key" ON "Domaine"("code");

-- CreateIndex
CREATE INDEX "Domaine_statut_idx" ON "Domaine"("statut");

-- Domaines de départ : l'ancienne liste fixe de src/lib/secteurs.ts (mêmes codes, donc les fiches existantes restent valables).
INSERT INTO "Domaine" ("id", "code", "libelle", "court", "statut", "ordre", "modifieLe") VALUES
  ('dom_administration', 'administration', 'Administration publique / territoriale', 'Administration', 'VALIDE', 1, CURRENT_TIMESTAMP),
  ('dom_politique', 'politique', 'Politique / affaires publiques', 'Affaires publiques', 'VALIDE', 2, CURRENT_TIMESTAMP),
  ('dom_finance', 'finance', 'Finance / banque / assurance', 'Finance', 'VALIDE', 3, CURRENT_TIMESTAMP),
  ('dom_conseil', 'conseil', 'Conseil / audit', 'Conseil', 'VALIDE', 4, CURRENT_TIMESTAMP),
  ('dom_entrepreneuriat', 'entrepreneuriat', 'Entrepreneuriat / startups', 'Entrepreneuriat', 'VALIDE', 5, CURRENT_TIMESTAMP),
  ('dom_communication', 'communication', 'Communication / marketing', 'Communication', 'VALIDE', 6, CURRENT_TIMESTAMP),
  ('dom_medias', 'medias', 'Journalisme / médias', 'Médias', 'VALIDE', 7, CURRENT_TIMESTAMP),
  ('dom_international', 'international', 'International / diplomatie / ONG', 'International', 'VALIDE', 8, CURRENT_TIMESTAMP),
  ('dom_recherche', 'recherche', 'Enseignement / recherche', 'Recherche', 'VALIDE', 9, CURRENT_TIMESTAMP),
  ('dom_culture', 'culture', 'Culture', 'Culture', 'VALIDE', 10, CURRENT_TIMESTAMP),
  ('dom_droit', 'droit', 'Droit / justice', 'Droit', 'VALIDE', 11, CURRENT_TIMESTAMP),
  ('dom_autre', 'autre', 'Autre', 'Autre', 'VALIDE', 99, CURRENT_TIMESTAMP);
