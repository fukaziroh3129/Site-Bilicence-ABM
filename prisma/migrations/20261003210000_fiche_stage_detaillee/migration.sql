-- Patch MEM-04 : fiche de stage détaillée.
-- « Retour d'expérience détaillé » devient « Comment j'ai obtenu ce stage » : on renomme la colonne
-- pour conserver les textes déjà saisis.
ALTER TABLE "Experience" RENAME COLUMN "rapport" TO "obtention";

ALTER TABLE "Experience" ADD COLUMN "missions" TEXT,
ADD COLUMN "partagerContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "contactAccord" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "contactMoyen" TEXT,
ADD COLUMN "rapportFichier" TEXT,
ADD COLUMN "partagerRapport" BOOLEAN NOT NULL DEFAULT false;
