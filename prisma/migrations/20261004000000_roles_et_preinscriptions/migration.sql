-- Nouveaux rôles du bureau (patch ADM-01) et statut des pré-comptes (patch ADM-04).
-- Valeurs ajoutées seules dans cette migration : PostgreSQL interdit d'utiliser une nouvelle valeur
-- d'enum dans la transaction qui l'a créée (voir la migration suivante).
ALTER TYPE "RoleCompte" ADD VALUE 'ANIMATEUR';
ALTER TYPE "RoleCompte" ADD VALUE 'PROPRIETAIRE';
ALTER TYPE "StatutCompte" ADD VALUE 'INVITE' BEFORE 'EN_ATTENTE';
