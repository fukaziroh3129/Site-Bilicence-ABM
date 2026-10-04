// Téléchargement d'un rapport de stage (PDF). Réservé aux membres validés, et seulement si son
// auteur a choisi de le partager ; l'auteur et le bureau y ont toujours accès.
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { cheminRapport, nomRapportValide } from "@/lib/fichiers";
import { slugifier } from "@/lib/format";
import { estAdministrateur } from "@/lib/roles";
import { obtenirSession } from "@/lib/session";

export async function GET(_request: Request, { params }: RouteContext<"/espace/rapports/[id]">) {
  const session = await obtenirSession();
  if (!session) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;

  const experience = await prisma.experience.findUnique({
    where: { id },
    select: {
      rapportFichier: true,
      partagerRapport: true,
      organisation: true,
      personne: { select: { id: true, nom: true, compte: { select: { statut: true } } } },
    },
  });
  if (!experience?.rapportFichier || !nomRapportValide(experience.rapportFichier)) return new Response("Introuvable", { status: 404 });

  const { user } = session;
  const estAuteur = user.personneId === experience.personne.id;
  const estAdmin = estAdministrateur(user.role) && user.statut === "ACTIF";
  const ficheVisible = !experience.personne.compte || experience.personne.compte.statut === "ACTIF";
  const estMembre = user.statut === "ACTIF" && experience.partagerRapport && ficheVisible;
  if (!estAuteur && !estAdmin && !estMembre) return new Response("Introuvable", { status: 404 });

  try {
    const contenu = await readFile(cheminRapport(experience.rapportFichier));
    const nom = `rapport-de-stage-${slugifier(`${experience.organisation}-${experience.personne.nom}`)}.pdf`;
    return new Response(contenu, {
      headers: {
        "Content-Type": "application/pdf",
        // Téléchargé plutôt qu'ouvert dans le site : un PDF ne doit pas pouvoir s'exécuter comme une page.
        "Content-Disposition": `attachment; filename="${nom}"`,
        // Document personnel : jamais gardé en cache par un intermédiaire.
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
