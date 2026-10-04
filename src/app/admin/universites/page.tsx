import { redirect } from "next/navigation";

// Ancienne adresse : la liste des universités est devenue la liste unifiée des établissements (ADM-03).
export default function AncienneListeUniversites() {
  redirect("/admin/etablissements");
}
