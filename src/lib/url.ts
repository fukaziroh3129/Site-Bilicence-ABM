// Adresse publique du site (https://bilicence.fr en production), utilisée pour le référencement.
export const URL_SITE = (process.env.BETTER_AUTH_URL ?? "https://bilicence.fr").replace(/\/$/, "");
