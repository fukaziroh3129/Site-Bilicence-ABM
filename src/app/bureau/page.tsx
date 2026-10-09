import type { Metadata } from "next";
import { connection } from "next/server";
import { FriseBureau, type MembreFrise } from "@/components/bureau/frise-bureau";
import { AFaire, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { trierFonctions } from "@/lib/fonctions-bureau";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Le bureau",
  description: "Les membres du bureau et des pôles de l’association Alumni Bi-Licence Montpellier.",
};

type MembreBase = { id: string; prenom: string; nom: string; role: string | null; photo: string | null };

export default async function Bureau() {
  await connection();
  const fonctions = trierFonctions(
    await prisma.fonction.findMany({
      include: { membres: { orderBy: [{ ordre: "asc" }, { nom: "asc" }] } },
    }),
  );
  const versFrise = (m: MembreBase, intitules: string[] = []): MembreFrise => ({
    id: m.id,
    prenom: m.prenom,
    nom: m.nom,
    photo: m.photo,
    // Sous le nom : la ou les fonctions du bureau, puis la précision libre éventuelle.
    intitule: [...intitules, m.role].filter(Boolean).join(" · "),
  });

  // Le bureau : les personnes ayant au moins une fonction du bureau, classées selon le rang de leur
  // première fonction (puis leur ordre d'affichage). La première est en tête de frise.
  const parMembre = new Map<string, { membre: MembreBase; intitules: string[] }>();
  for (const f of fonctions.filter((f) => f.niveau === "BUREAU")) {
    for (const m of f.membres) {
      const deja = parMembre.get(m.id);
      if (deja) deja.intitules.push(f.nom);
      else parMembre.set(m.id, { membre: m, intitules: [f.nom] });
    }
  }
  const [president, ...bureau] = [...parMembre.values()].map((x) => versFrise(x.membre, x.intitules));

  const poles = fonctions
    .filter((f) => f.niveau === "POLE")
    .map((f) => ({ id: f.id, nom: f.nom, description: f.description, icone: f.icone, membres: f.membres.map((m) => versFrise(m)) }));
  const noms = poles.map((p) => p.nom);

  return (
    <>
      <PageHeader
        eyebrow={site.mandat ? `Mandat ${site.mandat}` : "L’association"}
        title="Le bureau"
        lead={
          noms.length > 1
            ? `L’association s’organise en pôles : ${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}.`
            : noms.length === 1
              ? `L’association s’organise autour du pôle ${noms[0]}.`
              : undefined
        }
      />

      <div className="mx-auto max-w-5xl overflow-x-clip px-4 py-16 sm:px-8 sm:py-20">
        {!president && poles.length === 0 ? (
          <AFaire>composition du bureau, à saisir dans Administration → Bureau (fonctions et pôles, puis membres).</AFaire>
        ) : (
          <FriseBureau president={president ?? null} bureau={bureau} poles={poles} />
        )}
      </div>
    </>
  );
}
