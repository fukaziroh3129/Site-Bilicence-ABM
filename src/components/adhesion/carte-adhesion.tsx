import Image from "next/image";
import { SceauFiligrane } from "@/components/anime";
import { site } from "@/lib/site";
import type { Profil } from "@/lib/profils";

/**
 * Carte d'adhésion (élément graphique, pas une vraie carte) : sur la page d'adhésion, elle se remplit au fur
 * et à mesure de la saisie. Tant qu'un champ est vide, un texte d'exemple grisé tient sa place.
 */
export function CarteAdhesion({
  profil,
  prenom,
  nom,
  detail,
  className,
}: {
  profil: Profil;
  prenom: string;
  nom: string;
  /** Promotion (« 2023-2026 ») ou fonction (« Responsable de la formation »). */
  detail: string;
  className?: string;
}) {
  const personnel = profil === "PERSONNEL";
  const titulaire = `${prenom} ${nom}`.trim();
  return (
    <div className={`group [perspective:1200px] ${className ?? ""}`}>
      <div className="fond-bordeaux cadre-fin relative aspect-[1.586] w-full overflow-hidden rounded-abm-lg p-5 text-white shadow-abm-raised transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:[transform:rotateY(-6deg)_rotateX(4deg)] sm:p-7">
        <SceauFiligrane className="-bottom-24 -right-20 size-72" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <Image src="/brand/logo-abm-seal-white.png" alt="" width={56} height={56} className="size-11 sm:size-14" />
            <span className="eyebrow text-right text-white/70">{personnel ? site.universite : "Carte de membre"}</span>
          </div>
          <div className="min-w-0">
            <p className="font-impact text-3xl tracking-wide sm:text-4xl">{personnel ? "PERSONNEL" : "MEMBRE"}</p>
            <p className={`mt-1 truncate font-display text-lg font-bold ${titulaire ? "" : "text-white/40"}`}>
              {titulaire || "Prénom Nom"}
            </p>
            <p className={`eyebrow mt-2 truncate ${detail ? "text-white/70" : "text-white/40"}`}>
              {detail || (personnel ? "Fonction" : "Promotion")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
