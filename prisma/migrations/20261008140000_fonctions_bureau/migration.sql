-- CreateEnum
CREATE TYPE "NiveauFonction" AS ENUM ('BUREAU', 'POLE');

-- CreateTable
CREATE TABLE "Fonction" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" "NiveauFonction" NOT NULL DEFAULT 'POLE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "icone" TEXT,
    "description" TEXT,

    CONSTRAINT "Fonction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FonctionToMembreBureau" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FonctionToMembreBureau_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FonctionToMembreBureau_B_index" ON "_FonctionToMembreBureau"("B");

-- AddForeignKey
ALTER TABLE "_FonctionToMembreBureau" ADD CONSTRAINT "_FonctionToMembreBureau_A_fkey" FOREIGN KEY ("A") REFERENCES "Fonction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FonctionToMembreBureau" ADD CONSTRAINT "_FonctionToMembreBureau_B_fkey" FOREIGN KEY ("B") REFERENCES "MembreBureau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Reprise des données existantes ───────────────────────────────────────────
-- Un pôle (ancien code) devient une fonction de niveau POLE. Le pôle « communication » n'existait pas
-- vraiment : il n'est pas recréé (ses membres perdent leur étiquette et sont à rattacher à la main).
INSERT INTO "Fonction" ("id", "nom", "niveau", "ordre", "icone")
SELECT 'pole_' || p.code, p.nom, 'POLE', p.ordre, p.icone
FROM (VALUES
  ('evenementiel', 'Événementiel', 1, 'fete'),
  ('culture', 'Culture', 2, 'culture'),
  ('entraide', 'Entraide', 3, 'entraide'),
  ('sport', 'Sport', 4, 'sport'),
  ('technique', 'Technique', 5, 'technique')
) AS p(code, nom, ordre, icone)
WHERE EXISTS (SELECT 1 FROM "MembreBureau" m WHERE m."pole" = p.code);

-- Les membres sans pôle (bureau restreint) : une fonction BUREAU par intitulé de rôle, dans l'ordre d'affichage.
INSERT INTO "Fonction" ("id", "nom", "niveau", "ordre")
SELECT 'bureau_' || md5(r."role"), r."role", 'BUREAU', ROW_NUMBER() OVER (ORDER BY r."premier")
FROM (
  SELECT "role", MIN("ordre") AS "premier"
  FROM "MembreBureau"
  WHERE "pole" IS NULL AND "role" <> ''
  GROUP BY "role"
) AS r;

INSERT INTO "_FonctionToMembreBureau" ("A", "B")
SELECT 'pole_' || m."pole", m."id" FROM "MembreBureau" m
WHERE m."pole" IS NOT NULL AND EXISTS (SELECT 1 FROM "Fonction" f WHERE f."id" = 'pole_' || m."pole");

INSERT INTO "_FonctionToMembreBureau" ("A", "B")
SELECT 'bureau_' || md5(m."role"), m."id" FROM "MembreBureau" m
WHERE m."pole" IS NULL AND m."role" <> '';

-- AlterTable : le rôle devient une précision facultative (déjà reprise dans la fonction du bureau), plus de colonne « pole ».
UPDATE "MembreBureau" SET "role" = NULL WHERE "pole" IS NULL;
ALTER TABLE "MembreBureau" DROP COLUMN "pole",
ALTER COLUMN "role" DROP NOT NULL;
