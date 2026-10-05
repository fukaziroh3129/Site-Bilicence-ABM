/*
  Warnings:

  - You are about to drop the `Evenement` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TypePublication" AS ENUM ('ACTUALITE', 'EVENEMENT');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "debut" TIMESTAMP(3),
ADD COLUMN     "fin" TIMESTAMP(3),
ADD COLUMN     "lien" TEXT,
ADD COLUMN     "lieu" TEXT,
ADD COLUMN     "type" "TypePublication" NOT NULL DEFAULT 'ACTUALITE',
ALTER COLUMN "contenu" DROP NOT NULL;

-- DropTable
DROP TABLE "Evenement";

-- CreateIndex
CREATE INDEX "Article_type_debut_idx" ON "Article"("type", "debut");
