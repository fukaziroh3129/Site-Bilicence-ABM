"use client";

// Fenêtre affichée à un compte en attente de validation qui ouvre une rubrique réservée aux
// membres : depuis le menu (événement EVENEMENT_RESTREINT) ou après une redirection du serveur
// (adresse /espace?acces=restreint, quand la personne a saisi l'adresse directement).

import { IdCard } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Fenetre } from "@/components/fenetre/fenetre";
import { EVENEMENT_RESTREINT } from "@/components/nav-deroulante";
import { buttonClasses } from "@/components/ui";

export function DialogueRestreint() {
  const params = useSearchParams();
  const chemin = usePathname();
  const router = useRouter();
  const [rubrique, setRubrique] = useState<string | null>(null);
  const depuisAdresse = params.get("acces") === "restreint";

  useEffect(() => {
    const ouvrir = (e: Event) => setRubrique((e as CustomEvent<{ rubrique: string }>).detail.rubrique);
    window.addEventListener(EVENEMENT_RESTREINT, ouvrir);
    return () => window.removeEventListener(EVENEMENT_RESTREINT, ouvrir);
  }, []);

  function fermer() {
    setRubrique(null);
    if (depuisAdresse) router.replace(chemin, { scroll: false });
  }

  return (
    <Fenetre
      etroite
      ouverte={rubrique !== null || depuisAdresse}
      onFermer={fermer}
      surtitre="Compte en attente de validation"
      titre="Cette rubrique est réservée aux membres validés"
      pied={
        <>
          <Link href="/espace/ma-fiche" onClick={() => setRubrique(null)} className={buttonClasses("primary")}>
            <IdCard size={16} aria-hidden /> Compléter ma fiche
          </Link>
          <button type="button" onClick={fermer} className="text-sm text-ink-soft underline underline-offset-4 hover:text-bordeaux-700">
            Fermer
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          {rubrique ? (
            <>
              La rubrique <strong>« {rubrique} »</strong> n’est accessible qu’aux membres dont le compte a été validé par le bureau.
            </>
          ) : (
            <>Cette partie du site n’est accessible qu’aux membres dont le compte a été validé par le bureau.</>
          )}{" "}
          Le bureau vérifie que chaque inscrit a bien suivi la bi-licence, pour protéger les informations des anciens
          (coordonnées, stages, contacts).
        </p>
        <p>
          En attendant, vous pouvez déjà <strong>remplir votre fiche</strong>&nbsp;: elle sera visible des autres membres dès
          la validation de votre compte. Vous recevrez un e-mail à ce moment-là.
        </p>
      </div>
    </Fenetre>
  );
}
