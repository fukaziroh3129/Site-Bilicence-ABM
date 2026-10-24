-- CreateEnum
CREATE TYPE "TypeComplementaire" AS ENUM ('DU', 'LICENCE', 'CERTIFICATION', 'MOOC', 'AUTRE');

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "complementaireEcarte" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "complementaireSuggere" "TypeComplementaire";

-- CreateTable
CREATE TABLE "FormationComplementaire" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "type" "TypeComplementaire" NOT NULL,
    "titre" TEXT NOT NULL,
    "organisme" TEXT NOT NULL,
    "etablissementId" TEXT,
    "anneeDebut" INTEGER,
    "anneeFin" INTEGER,
    "resultat" TEXT,
    "avis" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormationComplementaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormationComplementaire_personneId_idx" ON "FormationComplementaire"("personneId");

-- CreateIndex
CREATE INDEX "FormationComplementaire_etablissementId_idx" ON "FormationComplementaire"("etablissementId");

-- AddForeignKey
ALTER TABLE "FormationComplementaire" ADD CONSTRAINT "FormationComplementaire_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationComplementaire" ADD CONSTRAINT "FormationComplementaire_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

