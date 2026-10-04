// Limitation du nombre de tentatives (connexion, inscription, mot de passe oublié…),
// pour empêcher qu'un robot essaie des milliers de mots de passe.
// Les compteurs sont gardés en mémoire : suffisant pour un site sur un seul serveur.
import "server-only";
import { headers } from "next/headers";

type Fenetre = { debut: number; nombre: number };
const compteurs = new Map<string, Fenetre>();

/** Adresse IP du visiteur (transmise par le proxy de Coolify), ou « inconnue ». */
export async function adresseIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
}

/**
 * Vrai si l'action est autorisée ; faux si la limite est atteinte.
 * @param cle identifiant de ce qui est limité (ex. « connexion:1.2.3.4 »)
 * @param max nombre d'essais autorisés
 * @param secondes durée de la fenêtre
 */
export function autoriser(cle: string, max: number, secondes: number) {
  const maintenant = Date.now();
  const fenetre = compteurs.get(cle);

  if (!fenetre || maintenant - fenetre.debut > secondes * 1000) {
    compteurs.set(cle, { debut: maintenant, nombre: 1 });
  } else {
    fenetre.nombre += 1;
    if (fenetre.nombre > max) return false;
  }

  // Ménage occasionnel pour ne pas garder les vieilles entrées indéfiniment.
  if (compteurs.size > 5000) {
    for (const [k, f] of compteurs) if (maintenant - f.debut > 3600_000) compteurs.delete(k);
  }
  return true;
}

export const MESSAGE_LIMITE = "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
