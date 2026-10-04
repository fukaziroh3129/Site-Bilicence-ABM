// S'exécute avant l'affichage des pages privées : renvoie vers la page de connexion
// si aucun cookie de session n'est présent. C'est un premier filtre rapide ; la vérification
// complète (compte validé, rôle admin) est refaite dans chaque page et chaque action.
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suite", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/espace/:path*", "/admin/:path*"],
};
