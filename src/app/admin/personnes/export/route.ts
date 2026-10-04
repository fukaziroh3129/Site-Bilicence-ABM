// Export de toutes les fiches au format CSV (ouvrable dans Excel), réservé au bureau.
import { prisma } from "@/lib/db";
import { libellePromo } from "@/lib/format";
import { dictionnaireDomaines } from "@/lib/domaines";
import { estAdministrateur } from "@/lib/roles";
import { obtenirSession } from "@/lib/session";

/** Cellule CSV : entre guillemets, guillemets doublés, et neutralisation des formules Excel. */
function cellule(valeur: unknown) {
  let texte = String(valeur ?? "");
  // Une cellule commençant par = + - @ serait interprétée comme une formule par Excel.
  if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return `"${texte.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await obtenirSession();
  if (!session || !estAdministrateur(session.user.role) || session.user.statut !== "ACTIF") {
    return new Response("Accès réservé au bureau", { status: 403 });
  }

  const domaines = await dictionnaireDomaines();
  const personnes = await prisma.personne.findMany({
    include: {
      compte: { select: { email: true, statut: true } },
      formations: { orderBy: [{ anneeDebut: "desc" }] },
      experiences: { orderBy: [{ debut: { sort: "desc", nulls: "last" } }] },
    },
    orderBy: [{ promoEntree: "asc" }, { nom: "asc" }, { prenom: "asc" }],
  });

  const entetes = [
    "Promotion", "Prénom", "Nom", "Situation actuelle", "Structure", "Ville", "Domaines",
    "E-mail de contact", "Téléphone", "LinkedIn", "Compte", "Affichage public",
    "Formations", "Stages et emplois",
  ];

  const lignes = personnes.map((p) =>
    [
      libellePromo(p.promoEntree),
      p.prenom,
      p.nom,
      p.situationActuelle,
      p.structureActuelle,
      p.ville,
      p.secteurs.map(domaines.libelle).join(", "),
      p.emailContact,
      p.telephone,
      p.linkedin,
      p.compte ? `${p.compte.email} (${p.compte.statut === "ACTIF" ? "actif" : "inactif"})` : "",
      p.consentementPublic ? "oui" : "non",
      p.formations.map((f) => [f.intitule, f.parcours, f.etablissement].filter(Boolean).join(", ")).join(" | "),
      p.experiences.map((e) => [e.organisation, e.poste].filter(Boolean).join(", ")).join(" | "),
    ]
      .map(cellule)
      .join(";"),
  );

  const date = new Date().toISOString().slice(0, 10);
  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  return new Response("﻿" + [entetes.map(cellule).join(";"), ...lignes].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fiches-abm-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
