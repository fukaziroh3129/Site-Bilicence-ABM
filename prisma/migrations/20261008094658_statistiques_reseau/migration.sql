-- AlterTable
ALTER TABLE "Domaine" ADD COLUMN     "groupe" TEXT;

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "mentionAControler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentionAuto" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mentionId" TEXT;

-- AlterTable
ALTER TABLE "Personne" ADD COLUMN     "sansErasmus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sansExperience" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FamilleMention" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 100,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilleMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "familleId" TEXT NOT NULL,
    "variantes" TEXT[],
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilleMention_code_key" ON "FamilleMention"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Mention_code_key" ON "Mention"("code");

-- CreateIndex
CREATE INDEX "Mention_familleId_idx" ON "Mention"("familleId");

-- CreateIndex
CREATE INDEX "Formation_mentionId_idx" ON "Formation"("mentionId");

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_mentionId_fkey" FOREIGN KEY ("mentionId") REFERENCES "Mention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "FamilleMention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Domaines professionnels : liste élargie, rangée par groupes ──────────────────
-- « Administration publique / territoriale » et « Droit / justice » sont remplacés par des domaines plus précis.
UPDATE "Personne"   SET "secteurs" = array_replace(array_replace("secteurs", 'administration', 'etat'), 'droit', 'juridique');
UPDATE "Experience" SET "secteurs" = array_replace(array_replace("secteurs", 'administration', 'etat'), 'droit', 'juridique');
UPDATE "Personne"   SET "secteurs" = ARRAY(SELECT DISTINCT unnest("secteurs")) WHERE cardinality("secteurs") > 1;
UPDATE "Experience" SET "secteurs" = ARRAY(SELECT DISTINCT unnest("secteurs")) WHERE cardinality("secteurs") > 1;
DELETE FROM "Domaine" WHERE "code" IN ('administration', 'droit');

INSERT INTO "Domaine" ("id", "code", "libelle", "court", "groupe", "ordre", "modifieLe") VALUES
  ('dom_etat', 'etat', 'Administration d’État (ministères, préfectures…)', 'Administration d’État', 'Action publique', 1, CURRENT_TIMESTAMP),
  ('dom_local', 'local', 'Collectivités territoriales / action locale', 'Collectivités', 'Action publique', 2, CURRENT_TIMESTAMP),
  ('dom_europe', 'europe', 'Institutions européennes', 'Institutions européennes', 'Action publique', 3, CURRENT_TIMESTAMP),
  ('dom_international', 'international', 'Organisations internationales / diplomatie', 'International', 'Action publique', 4, CURRENT_TIMESTAMP),
  ('dom_politique', 'politique', 'Vie politique (cabinets, Parlement, partis)', 'Vie politique', 'Action publique', 5, CURRENT_TIMESTAMP),
  ('dom_evaluation', 'evaluation', 'Politiques publiques / évaluation', 'Politiques publiques', 'Action publique', 6, CURRENT_TIMESTAMP),
  ('dom_defense', 'defense', 'Défense / sécurité', 'Défense / sécurité', 'Action publique', 7, CURRENT_TIMESTAMP),
  ('dom_juridique', 'juridique', 'Justice / juridique', 'Juridique', 'Action publique', 8, CURRENT_TIMESTAMP),
  ('dom_finance', 'finance', 'Banque / finance / assurance', 'Finance', 'Économie et entreprise', 20, CURRENT_TIMESTAMP),
  ('dom_conseil', 'conseil', 'Conseil / audit / stratégie', 'Conseil', 'Économie et entreprise', 21, CURRENT_TIMESTAMP),
  ('dom_lobbying', 'lobbying', 'Affaires publiques / lobbying', 'Affaires publiques', 'Économie et entreprise', 22, CURRENT_TIMESTAMP),
  ('dom_entreprise', 'entreprise', 'Entreprise (RH, marketing, gestion)', 'Entreprise', 'Économie et entreprise', 23, CURRENT_TIMESTAMP),
  ('dom_entrepreneuriat', 'entrepreneuriat', 'Entrepreneuriat / startups', 'Entrepreneuriat', 'Économie et entreprise', 24, CURRENT_TIMESTAMP),
  ('dom_data', 'data', 'Études économiques / data', 'Études / data', 'Économie et entreprise', 25, CURRENT_TIMESTAMP),
  ('dom_urbanisme', 'urbanisme', 'Urbanisme / aménagement / logement', 'Urbanisme', 'Économie et entreprise', 26, CURRENT_TIMESTAMP),
  ('dom_ong', 'ong', 'ONG / humanitaire / développement', 'ONG / humanitaire', 'Société et engagement', 40, CURRENT_TIMESTAMP),
  ('dom_ess', 'ess', 'Associations / économie sociale et solidaire', 'Associations / ESS', 'Société et engagement', 41, CURRENT_TIMESTAMP),
  ('dom_environnement', 'environnement', 'Environnement / énergie / transition', 'Environnement', 'Société et engagement', 42, CURRENT_TIMESTAMP),
  ('dom_sante', 'sante', 'Santé / social / solidarités', 'Santé / social', 'Société et engagement', 43, CURRENT_TIMESTAMP),
  ('dom_education', 'education', 'Éducation / enseignement', 'Éducation', 'Société et engagement', 44, CURRENT_TIMESTAMP),
  ('dom_recherche', 'recherche', 'Recherche / université', 'Recherche', 'Savoirs, médias, culture', 60, CURRENT_TIMESTAMP),
  ('dom_medias', 'medias', 'Journalisme / médias', 'Médias', 'Savoirs, médias, culture', 61, CURRENT_TIMESTAMP),
  ('dom_communication', 'communication', 'Communication (dont politique)', 'Communication', 'Savoirs, médias, culture', 62, CURRENT_TIMESTAMP),
  ('dom_culture', 'culture', 'Culture / patrimoine', 'Culture', 'Savoirs, médias, culture', 63, CURRENT_TIMESTAMP),
  ('dom_autre', 'autre', 'Autre', 'Autre', NULL, 999, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "libelle" = EXCLUDED."libelle", "court" = EXCLUDED."court", "groupe" = EXCLUDED."groupe", "ordre" = EXCLUDED."ordre", "modifieLe" = CURRENT_TIMESTAMP;

-- ─── Grands domaines d'études et mentions de départ (modifiables dans /admin/mentions) ───
INSERT INTO "FamilleMention" ("id", "code", "libelle", "ordre", "modifieLe") VALUES
  ('fam_sp', 'science-politique-ri', 'Science politique & relations internationales', 1, CURRENT_TIMESTAMP),
  ('fam_eco', 'economie', 'Économie', 2, CURRENT_TIMESTAMP),
  ('fam_adm', 'administration-droit', 'Administration publique & droit', 3, CURRENT_TIMESTAMP),
  ('fam_ter', 'territoires-environnement', 'Territoires, urbanisme & environnement', 4, CURRENT_TIMESTAMP),
  ('fam_com', 'communication-culture', 'Communication, médias & culture', 5, CURRENT_TIMESTAMP),
  ('fam_ges', 'gestion-management', 'Gestion & management', 6, CURRENT_TIMESTAMP),
  ('fam_soc', 'sciences-humaines-sociales', 'Sciences humaines & sociales', 7, CURRENT_TIMESTAMP);

INSERT INTO "Mention" ("id", "code", "libelle", "familleId", "variantes", "modifieLe") VALUES
  ('men_science_politique', 'science-politique', 'Science politique', 'fam_sp', ARRAY['science po', 'sciences politiques', 'political science', 'sociologie politique'], CURRENT_TIMESTAMP),
  ('men_relations_internationales', 'relations-internationales', 'Relations internationales', 'fam_sp', ARRAY['RI', 'relations int', 'rel int', 'international relations', 'affaires internationales', 'expertise internationale', 'global affairs'], CURRENT_TIMESTAMP),
  ('men_affaires_publiques', 'affaires-publiques', 'Affaires publiques', 'fam_sp', ARRAY['politiques publiques', 'public policy', 'MPP', 'action publique', 'affaires publiques et internationales'], CURRENT_TIMESTAMP),
  ('men_etudes_europeennes', 'etudes-europeennes-internationales', 'Études européennes et internationales', 'fam_sp', ARRAY['affaires européennes', 'études européennes', 'european studies', 'european affairs'], CURRENT_TIMESTAMP),
  ('men_affaires_internationales_dev', 'affaires-internationales-developpement', 'Affaires internationales et développement', 'fam_sp', ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('men_etudes_developpement', 'etudes-developpement', 'Études du développement', 'fam_sp', ARRAY['development studies'], CURRENT_TIMESTAMP),
  ('men_economie', 'economie', 'Économie', 'fam_eco', ARRAY['economics', 'économie politique', 'sciences économiques'], CURRENT_TIMESTAMP),
  ('men_economie_appliquee', 'economie-appliquee', 'Économie appliquée', 'fam_eco', ARRAY['éco appliquée', 'applied economics'], CURRENT_TIMESTAMP),
  ('men_analyse_politique_eco', 'analyse-politique-economique', 'Analyse et politique économique', 'fam_eco', ARRAY['APE', 'politique économique'], CURRENT_TIMESTAMP),
  ('men_economie_developpement', 'economie-developpement', 'Économie du développement', 'fam_eco', ARRAY['development economics', 'économie du développement et analyse de la soutenabilité'], CURRENT_TIMESTAMP),
  ('men_economie_internationale', 'economie-internationale', 'Économie internationale', 'fam_eco', ARRAY['international economics'], CURRENT_TIMESTAMP),
  ('men_econometrie', 'econometrie-statistiques', 'Économétrie, statistiques', 'fam_eco', ARRAY['économétrie', 'statistique', 'data science for economics'], CURRENT_TIMESTAMP),
  ('men_mbfa', 'monnaie-banque-finance-assurance', 'Monnaie, banque, finance, assurance', 'fam_eco', ARRAY['MBFA', 'banque finance', 'banque et finance'], CURRENT_TIMESTAMP),
  ('men_economie_environnement', 'economie-environnement-energie-transports', 'Économie de l’environnement, de l’énergie et des transports', 'fam_eco', ARRAY['économie de l’environnement', 'économie de l’énergie', 'économie de l’énergie, de l’environnement et des transports'], CURRENT_TIMESTAMP),
  ('men_economie_organisations', 'economie-organisations', 'Économie des organisations', 'fam_eco', ARRAY['économie des entreprises et des marchés', 'économie industrielle'], CURRENT_TIMESTAMP),
  ('men_ess', 'economie-sociale-solidaire', 'Économie sociale et solidaire', 'fam_eco', ARRAY['ESS'], CURRENT_TIMESTAMP),
  ('men_ses', 'sciences-economiques-sociales', 'Sciences économiques et sociales', 'fam_eco', ARRAY['SES'], CURRENT_TIMESTAMP),
  ('men_administration_publique', 'administration-publique', 'Administration publique', 'fam_adm', ARRAY['IPAG', 'préparation concours'], CURRENT_TIMESTAMP),
  ('men_droit_public', 'droit-public', 'Droit public', 'fam_adm', ARRAY['droit public général'], CURRENT_TIMESTAMP),
  ('men_droit_international', 'droit-international-europeen', 'Droit international et européen', 'fam_adm', ARRAY['droit international', 'droit européen', 'droit de l’Union européenne'], CURRENT_TIMESTAMP),
  ('men_management_public', 'management-public', 'Management public', 'fam_adm', ARRAY['management des organisations publiques', 'économie et management publics'], CURRENT_TIMESTAMP),
  ('men_sante_publique', 'sante-publique', 'Santé publique', 'fam_adm', ARRAY['administration de la santé', 'économie et gestion de la santé', 'management de la santé'], CURRENT_TIMESTAMP),
  ('men_collectivites', 'droit-collectivites-territoriales', 'Droit des collectivités territoriales', 'fam_adm', ARRAY['collectivités territoriales'], CURRENT_TIMESTAMP),
  ('men_territoires', 'gestion-territoires-developpement-local', 'Gestion des territoires et développement local', 'fam_ter', ARRAY['GTDL', 'développement territorial', 'développement local'], CURRENT_TIMESTAMP),
  ('men_urbanisme', 'urbanisme-amenagement', 'Urbanisme et aménagement', 'fam_ter', ARRAY['urbanisme', 'aménagement', 'stratégies territoriales et urbaines'], CURRENT_TIMESTAMP),
  ('men_geographie', 'geographie-amenagement-environnement-developpement', 'Géographie, aménagement, environnement et développement', 'fam_ter', ARRAY['géographie'], CURRENT_TIMESTAMP),
  ('men_environnement', 'gestion-environnement', 'Gestion de l’environnement', 'fam_ter', ARRAY['environnement', 'transition écologique', 'développement durable'], CURRENT_TIMESTAMP),
  ('men_transports', 'transports-mobilites', 'Transports, mobilités', 'fam_ter', ARRAY['transports, logistique, territoire, environnement', 'mobilités'], CURRENT_TIMESTAMP),
  ('men_journalisme', 'journalisme', 'Journalisme', 'fam_com', ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('men_information_communication', 'information-communication', 'Information, communication', 'fam_com', ARRAY['communication politique', 'communication publique', 'communication des organisations'], CURRENT_TIMESTAMP),
  ('men_culture', 'direction-projets-culturels', 'Direction de projets culturels', 'fam_com', ARRAY['direction de projets ou d’établissements culturels', 'management culturel', 'gestion culturelle'], CURRENT_TIMESTAMP),
  ('men_management', 'management', 'Management', 'fam_ges', ARRAY['programme grande école', 'PGE', 'management des organisations'], CURRENT_TIMESTAMP),
  ('men_finance', 'finance', 'Finance', 'fam_ges', ARRAY['finance d’entreprise'], CURRENT_TIMESTAMP),
  ('men_rh', 'gestion-ressources-humaines', 'Gestion des ressources humaines', 'fam_ges', ARRAY['RH', 'ressources humaines'], CURRENT_TIMESTAMP),
  ('men_marketing', 'marketing-vente', 'Marketing, vente', 'fam_ges', ARRAY['marketing'], CURRENT_TIMESTAMP),
  ('men_mae', 'management-administration-entreprises', 'Management et administration des entreprises', 'fam_ges', ARRAY['MAE'], CURRENT_TIMESTAMP),
  ('men_sociologie', 'sociologie', 'Sociologie', 'fam_soc', ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('men_histoire', 'histoire-civilisations-patrimoine', 'Histoire, civilisations, patrimoine', 'fam_soc', ARRAY['histoire', 'histoire contemporaine'], CURRENT_TIMESTAMP),
  ('men_philosophie', 'philosophie', 'Philosophie', 'fam_soc', ARRAY[]::TEXT[], CURRENT_TIMESTAMP),
  ('men_shs', 'sciences-humaines-sociales', 'Sciences humaines et sociales', 'fam_soc', ARRAY['SHS'], CURRENT_TIMESTAMP),
  ('men_genre', 'etudes-genre', 'Études sur le genre', 'fam_soc', ARRAY['genre'], CURRENT_TIMESTAMP);
