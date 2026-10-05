import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenirSession } from "@/lib/session";
import { EspaceAdhesion } from "./formulaire";

export const metadata: Metadata = {
  title: "Adhésion",
  description:
    "Adhérer gratuitement à l’association Alumni Bi-Licence Montpellier : étudiants et anciens de la bi-licence, personnel de l’université.",
};

// Adhérer = créer son compte sur le site (l'adhésion est gratuite ; le bureau valide chaque compte).
export default async function Adhesion() {
  if (await obtenirSession()) redirect("/espace");
  return <EspaceAdhesion />;
}
