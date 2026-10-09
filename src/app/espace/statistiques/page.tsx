import { parametre } from "@/components/filtres";
import { TableauStatistiques } from "@/components/statistiques-reseau/tableau-statistiques";
import { exigerMembreActif } from "@/lib/session";
import { donneesStatistiques } from "@/lib/statistiques-reseau";

export const metadata = { title: "Statistiques" };

// Où mènent les études : établissements, mentions de master, domaines professionnels, par promotion.
// Réservé aux membres validés (les listes contiennent des noms, comme l'annuaire).
export default async function Statistiques({ searchParams }: PageProps<"/espace/statistiques">) {
  await exigerMembreActif();
  const p = await searchParams;
  return <TableauStatistiques donnees={await donneesStatistiques()} promoInitiale={parametre(p.promo) ?? ""} ongletInitial={parametre(p.onglet) ?? ""} />;
}
