// Démarre une base PostgreSQL locale pour le développement, sans rien installer sur le PC.
// Utilisation : `npm run db` dans un terminal, à laisser ouvert pendant qu'on travaille.
// Les données sont gardées dans le dossier .pgdata/ (ignoré par Git).
// En production, la base est celle de Coolify : ce script ne sert qu'en local.

import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dossier = path.join(process.cwd(), ".pgdata");
const port = 5433; // 5433 plutôt que 5432 pour ne pas gêner un éventuel Postgres installé

const pg = new EmbeddedPostgres({
  databaseDir: dossier,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale-provider=icu", "--icu-locale=fr-FR", "--locale=C"],
  onLog: () => {},
});

async function main() {
  const premiereFois = !existsSync(dossier);
  if (premiereFois) {
    console.log("Première utilisation : création de la base locale…");
    await pg.initialise();
  }

  await pg.start();
  if (premiereFois) await pg.createDatabase("abm");

  console.log(`Base locale démarrée : postgresql://postgres:postgres@localhost:${port}/abm`);
  console.log("Laisser ce terminal ouvert. Ctrl+C pour arrêter.");

  const arreter = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", arreter);
  process.on("SIGTERM", arreter);
}

main().catch(async (erreur) => {
  console.error("Impossible de démarrer la base locale :", erreur);
  await pg.stop().catch(() => {});
  process.exit(1);
});
