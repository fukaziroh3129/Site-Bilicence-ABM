-- Contrôle a posteriori des cartes « Que sont-ils devenus ? » par le bureau
ALTER TABLE "Personne" ADD COLUMN "publicControleLe" TIMESTAMP(3);
ALTER TABLE "Personne" ADD COLUMN "publicRetireLe" TIMESTAMP(3);
ALTER TABLE "Personne" ADD COLUMN "publicRetireMotif" TEXT;
