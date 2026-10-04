-- ─── ADM-01 : un seul propriétaire ─────────────────────────────────────────────
-- Le plus ancien administrateur actif devient propriétaire (s'il n'y en a pas déjà un).
UPDATE "user" SET "role" = 'PROPRIETAIRE'
WHERE "id" = (SELECT "id" FROM "user" WHERE "role" = 'ADMIN' AND "statut" = 'ACTIF' ORDER BY "createdAt" ASC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE "role" = 'PROPRIETAIRE');

-- ─── ADM-04 : pré-comptes ─────────────────────────────────────────────────────
ALTER TABLE "user" ADD COLUMN "invitationEnvoyeeLe" TIMESTAMP(3);

-- ─── ADM-03 : liste unifiée des établissements (ex-table Universite) ───────────
CREATE TYPE "TypeEtablissement" AS ENUM ('IEP', 'UNIVERSITE', 'ECOLE', 'AUTRE');

ALTER TABLE "Universite" RENAME TO "Etablissement";
ALTER TABLE "Etablissement" RENAME CONSTRAINT "Universite_pkey" TO "Etablissement_pkey";
ALTER INDEX "Universite_pays_idx" RENAME TO "Etablissement_pays_idx";
DROP INDEX "Universite_statut_idx";

ALTER TABLE "Etablissement"
  ADD COLUMN "type" "TypeEtablissement" NOT NULL DEFAULT 'UNIVERSITE',
  ADD COLUMN "aControler" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ajouteParId" TEXT,
  ALTER COLUMN "pays" SET DEFAULT 'FR';
-- Une université « proposée » devient utilisable tout de suite, mais reste à contrôler.
UPDATE "Etablissement" SET "aControler" = ("statut" = 'PROPOSE');
ALTER TABLE "Etablissement" DROP COLUMN "statut";
DROP TYPE "StatutUniversite";

CREATE INDEX "Etablissement_aControler_idx" ON "Etablissement"("aControler");
ALTER TABLE "Etablissement" ADD CONSTRAINT "Etablissement_ajouteParId_fkey" FOREIGN KEY ("ajouteParId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Formations : lien vers la liste commune (rempli par l'application et par scripts/relier-etablissements.ts)
ALTER TABLE "Formation" ADD COLUMN "etablissementId" TEXT;
CREATE INDEX "Formation_etablissementId_idx" ON "Formation"("etablissementId");
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── ADM-03 : domaines utilisables tout de suite, contrôlés ensuite ────────────
ALTER TABLE "Domaine"
  ADD COLUMN "aControler" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ajouteParId" TEXT;
UPDATE "Domaine" SET "aControler" = ("statut" = 'PROPOSE');
DROP INDEX "Domaine_statut_idx";
ALTER TABLE "Domaine" DROP COLUMN "statut";
DROP TYPE "StatutDomaine";
CREATE INDEX "Domaine_aControler_idx" ON "Domaine"("aControler");
ALTER TABLE "Domaine" ADD CONSTRAINT "Domaine_ajouteParId_fkey" FOREIGN KEY ("ajouteParId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── ADM-02 : notes de modification de fiche ──────────────────────────────────
CREATE TABLE "NoteModification" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "auteurId" TEXT,
    "auteurNom" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "lueLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteModification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NoteModification_personneId_idx" ON "NoteModification"("personneId");
ALTER TABLE "NoteModification" ADD CONSTRAINT "NoteModification_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteModification" ADD CONSTRAINT "NoteModification_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
