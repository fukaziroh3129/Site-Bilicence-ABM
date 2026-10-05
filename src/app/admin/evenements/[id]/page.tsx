import { redirect } from "next/navigation";

// Les événements se gèrent avec les actualités, dans « Publications » (formulaire unique).
export default async function AdminEvenement({ params }: PageProps<"/admin/evenements/[id]">) {
  const { id } = await params;
  redirect(id === "nouveau" ? "/admin/actualites/nouveau?type=evenement" : `/admin/actualites/${id}`);
}
