// Trace des actions sensibles du bureau (rôles, suppressions, export complet, liens de connexion), écrite
// dans le journal du serveur (Coolify → application → Logs). Seul l'auteur est nommé ; la cible est un identifiant.
import "server-only";

export function journaliser(auteur: { id: string; email: string }, action: string, cible?: string) {
  console.info(`[journal] ${new Date().toISOString()} ${action} — par ${auteur.email} (${auteur.id})${cible ? ` — cible ${cible}` : ""}`);
}
