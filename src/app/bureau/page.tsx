import type { Metadata } from "next";
import { connection } from "next/server";
import { FriseBureau, type MembreFrise } from "@/components/bureau/frise-bureau";
import { AFaire, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Le bureau",
  description: "Les membres du bureau et des pôles de l’association Alumni Bi-Licence Montpellier.",
};

export default async function Bureau() {
  await connection();
  const membres = await prisma.membreBureau.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }] });
  const versFrise = (m: (typeof membres)[number]): MembreFrise => ({ id: m.id, prenom: m.prenom, nom: m.nom, role: m.role, photo: m.photo });

  // Bureau restreint : les membres sans pôle. Le premier dans l'ordre d'affichage est en tête de frise.
  const [president, ...bureau] = membres.filter((m) => !site.poles.some((p) => p.code === m.pole)).map(versFrise);
  const poles = site.poles.map((p) => ({ code: p.code, nom: p.nom, membres: membres.filter((m) => m.pole === p.code).map(versFrise) }));
  const noms = site.poles.map((p) => p.nom);

  return (
    <>
      <PageHeader
        eyebrow={site.mandat ? `Mandat ${site.mandat}` : "L’association"}
        title="Le bureau"
        lead={`L’association s’organise en pôles : ${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}.`}
      />

      <div className="mx-auto max-w-5xl overflow-x-clip px-4 py-16 sm:px-8 sm:py-20">
        {membres.length === 0 ? (
          <AFaire>composition du bureau, à saisir dans Administration → Bureau (avec le pôle de chaque membre).</AFaire>
        ) : (
          <FriseBureau president={president ?? null} bureau={bureau} poles={poles} />
        )}
      </div>
    </>
  );
}
