-- CreateEnum
CREATE TYPE "ReseauSocial" AS ENUM ('INSTAGRAM', 'LINKEDIN');

-- CreateTable
CREATE TABLE "PostSocial" (
    "id" TEXT NOT NULL,
    "reseau" "ReseauSocial" NOT NULL,
    "lien" TEXT NOT NULL,
    "legende" TEXT NOT NULL,
    "image" TEXT,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "publieLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostSocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostSocial_publie_publieLe_idx" ON "PostSocial"("publie", "publieLe");
