import { redirect } from "next/navigation";

// Les événements se gèrent avec les actualités, dans « Publications ».
export default function AdminEvenements() {
  redirect("/admin/actualites?type=evenements");
}
