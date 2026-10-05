// Point d'entrée technique de Better Auth, réduit aux seuls liens reçus par e-mail.
// Le site appelle Better Auth côté serveur (auth.api.* dans src/actions/) : ces appels ne passent pas par
// ici. Tout le reste de l'API (inscription, changement d'adresse, modification du compte…) est fermé, sinon
// on pourrait contourner les vérifications du site (mot de passe exigé, limites de tentatives, consentement).
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const gestionnaire = toNextJsHandler(auth);

/** Liens cliqués depuis un e-mail : confirmation d'adresse, réinitialisation du mot de passe, page d'erreur. */
const CHEMINS_AUTORISES = [/^\/api\/auth\/verify-email$/, /^\/api\/auth\/reset-password\/[\w-]+$/, /^\/api\/auth\/error$/];

const introuvable = () => new Response("Introuvable", { status: 404 });

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  if (!CHEMINS_AUTORISES.some((motif) => motif.test(pathname))) return introuvable();
  return gestionnaire.GET(request);
}

export async function POST() {
  return introuvable();
}
