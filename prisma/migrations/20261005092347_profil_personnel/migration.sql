-- CreateEnum
CREATE TYPE "ProfilCompte" AS ENUM ('ALUMNI', 'PERSONNEL');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "fonction" TEXT,
ADD COLUMN     "profil" "ProfilCompte" NOT NULL DEFAULT 'ALUMNI';
