import { redirect } from "next/navigation";

// Les événements sont publics depuis la fusion avec les actualités : page unique /actualites.
export default function Evenements() {
  redirect("/actualites?type=evenements");
}
