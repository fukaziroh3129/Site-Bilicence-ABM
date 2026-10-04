// Sert les images téléversées, rangées hors du dossier public/.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { dossierFichiers, nomValide } from "@/lib/fichiers";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_request: Request, { params }: RouteContext<"/fichiers/[nom]">) {
  const { nom } = await params;
  if (!nomValide(nom)) return new Response("Introuvable", { status: 404 });

  try {
    const contenu = await readFile(path.join(dossierFichiers(), nom));
    return new Response(contenu, {
      headers: {
        "Content-Type": TYPES[nom.split(".").pop() ?? ""] ?? "application/octet-stream",
        // Le nom de fichier est unique : l'image peut être gardée en cache longtemps.
        "Cache-Control": "public, max-age=31536000, immutable",
        // Un fichier téléversé ne doit jamais pouvoir s'exécuter comme une page.
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
