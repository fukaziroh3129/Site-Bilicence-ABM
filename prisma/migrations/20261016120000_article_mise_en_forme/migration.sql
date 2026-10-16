-- Mise en page des articles : auteur, légende et cadrage de l'image de couverture, sommaire
ALTER TABLE "Article" ADD COLUMN "auteur" TEXT;
ALTER TABLE "Article" ADD COLUMN "imageLegende" TEXT;
ALTER TABLE "Article" ADD COLUMN "imageCadrage" TEXT NOT NULL DEFAULT 'centre';
ALTER TABLE "Article" ADD COLUMN "sommaire" BOOLEAN NOT NULL DEFAULT false;
