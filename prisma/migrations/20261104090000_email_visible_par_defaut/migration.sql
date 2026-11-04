-- L'e-mail de contact devient visible des membres connectés par défaut (choix de Guillaume, 4 novembre 2026) :
-- la personne le décoche dans « Ma fiche » si elle ne veut pas l'afficher.
ALTER TABLE "Personne" ALTER COLUMN "afficherEmail" SET DEFAULT true;

-- Fiches existantes des personnes qui n'ont pas encore activé de compte (fiche sans compte ou pré-compte
-- INVITE, reprises des fichiers de l'association) : leur e-mail devient visible des membres. Les comptes
-- déjà créés (en attente, actifs, refusés) gardent le choix qu'ils ont fait.
UPDATE "Personne" p
SET "afficherEmail" = true
WHERE p."emailContact" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "user" u
    WHERE u."personneId" = p."id" AND u."statut" <> 'INVITE'
  );
