// Encart « Votre fiche dans l'annuaire » : taux de remplissage, ce qu'il reste, bouton vers Ma fiche.
// Utilisé sur l'accueil de l'espace membres et dans « Mon compte ».

import { IdCard } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui";
import type { completude } from "@/lib/completude";

export function EncartCompletude({ avancement, id, className = "" }: { avancement: ReturnType<typeof completude> | null; id?: string; className?: string }) {
  const classe = `flex flex-wrap items-center gap-x-6 gap-y-4 rounded-abm-lg border border-bordeaux-700/15 bg-white p-5 shadow-abm-card sm:p-6 ${className}`;

  if (!avancement) {
    return (
      <section id={id} className={classe}>
        <IdCard size={32} aria-hidden className="text-bordeaux-700" />
        <div className="min-w-0 flex-[1_1_220px]">
          <h2 className="font-display text-lg font-bold text-bordeaux-700">Vous n’avez pas encore de fiche</h2>
          <p className="mt-1 text-sm text-ink-soft">C’est elle qui vous fait apparaître dans l’annuaire des membres.</p>
        </div>
        <Link href="/espace/ma-fiche" className={buttonClasses("primary")}>
          Créer ma fiche
        </Link>
      </section>
    );
  }

  const complete = avancement.pourcentage >= 100;
  return (
    <section id={id} className={classe}>
      <p className="font-impact text-5xl leading-none text-bordeaux-700">
        {avancement.pourcentage}
        <span className="text-3xl"> %</span>
      </p>
      <div className="min-w-0 flex-[1_1_220px]">
        <h2 className="font-display text-lg font-bold text-bordeaux-700">{complete ? "Votre fiche est complète" : "Votre fiche dans l’annuaire"}</h2>
        <div
          className="mt-2.5 h-2 overflow-hidden rounded-abm-pill bg-bordeaux-100"
          role="progressbar"
          aria-valuenow={avancement.pourcentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Remplissage de votre fiche"
        >
          <div className="h-full rounded-abm-pill bg-[image:var(--degrade-bouton)]" style={{ width: `${avancement.pourcentage}%` }} />
        </div>
        {avancement.restants.length > 0 && (
          <p className="mt-2 text-sm text-ink-soft">
            Il reste : {avancement.restants.slice(0, 3).map((r) => r.libelle.toLowerCase()).join(", ")}
            {avancement.restants.length > 3 ? "…" : "."}
          </p>
        )}
      </div>
      <Link href="/espace/ma-fiche" className={buttonClasses(complete ? "outline" : "primary")}>
        {complete ? "Voir ma fiche" : "Compléter ma fiche"}
      </Link>
    </section>
  );
}
