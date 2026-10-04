"use client";

// Animations du site (bibliothèque Motion). Chaque animation a une raison :
// faire apparaître le contenu dans l'ordre de lecture, donner du relief au sceau,
// rendre vivants les chiffres réels du réseau. Avec « réduire les animations »
// (réglage du système), tout s'affiche directement, sans mouvement.

import {
  MotionConfig,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** À placer une fois dans la mise en page : applique la préférence « réduire les animations ». */
export function FournisseurAnimations({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fait apparaître son contenu (fondu + légère montée) quand il entre à l'écran. */
export function Apparition({
  children,
  delai = 0,
  className,
  decalage = 24,
}: {
  children: React.ReactNode;
  delai?: number;
  className?: string;
  decalage?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: decalage }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: delai, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const conteneurGroupe = {
  cache: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const elementGroupe = {
  cache: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Liste dont les éléments apparaissent l'un après l'autre. Utiliser avec ElementGroupe. */
export function Groupe({ children, className, as = "ul" }: { children: React.ReactNode; className?: string; as?: "ul" | "div" }) {
  const Composant = as === "ul" ? motion.ul : motion.div;
  return (
    <Composant className={className} variants={conteneurGroupe} initial="cache" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
      {children}
    </Composant>
  );
}

export function ElementGroupe({ children, className, as = "li" }: { children: React.ReactNode; className?: string; as?: "li" | "div" }) {
  const Composant = as === "li" ? motion.li : motion.div;
  return (
    <Composant className={className} variants={elementGroupe}>
      {children}
    </Composant>
  );
}

/**
 * Titre dont les mots montent l'un après l'autre (bandeau d'accueil).
 * Animation CSS (classe .revele-mot) : visible même avant le chargement du JavaScript.
 */
export function TitreAnime({ texte, className }: { texte: string; className?: string }) {
  const mots = texte.split(" ");
  return (
    <h1 className={className} aria-label={texte}>
      {mots.map((mot, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-1 align-bottom">
          <span className="revele-mot inline-block" style={{ animationDelay: `${150 + i * 90}ms` }}>
            {mot}
            {i < mots.length - 1 && " "}
          </span>
        </span>
      ))}
    </h1>
  );
}

/** Inclinaison au repos (degrés) : la face regarde vers le texte, à gauche, et bascule un peu vers le bas. */
const REPOS = { y: -22, x: 5 };
/** Débattement maximal à la souris (degrés), volontairement faible. */
const DEBATTEMENT = 4;

/**
 * Le sceau du bandeau d'accueil, en CSS 3D (sans bibliothèque) : le sceau seul, tourné vers le
 * texte, devant un anneau fin placé en retrait. La profondeur vient de l'écart entre les deux.
 * Il respire lentement (± 4°, sans arrêt marqué) et suit à peine la souris, sans rebond.
 */
export function SceauHero({ taille = 380 }: { taille?: number }) {
  const reduit = useReducedMotion();

  // Suivi de la souris sur toute la fenêtre, amorti sans dépassement (ressort sur-amorti)
  const sourisX = useMotionValue(0);
  const sourisY = useMotionValue(0);
  const amorti = { stiffness: 50, damping: 20, mass: 1 };
  const inclinaisonY = useSpring(useTransform(sourisX, [-0.5, 0.5], [-DEBATTEMENT, DEBATTEMENT]), amorti);
  const inclinaisonX = useSpring(useTransform(sourisY, [-0.5, 0.5], [DEBATTEMENT, -DEBATTEMENT]), amorti);

  useEffect(() => {
    if (reduit) return;
    const suivre = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      sourisX.set(e.clientX / window.innerWidth - 0.5);
      sourisY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", suivre, { passive: true });
    return () => window.removeEventListener("pointermove", suivre);
  }, [reduit, sourisX, sourisY]);

  return (
    <div
      data-sceau
      className="sceau-entree relative mx-auto aspect-square w-full [perspective:1400px]"
      style={{ maxWidth: taille }}
    >
      <div className="sceau-flotte h-full w-full [transform-style:preserve-3d]">
        <motion.div
          style={{ rotateX: inclinaisonX, rotateY: inclinaisonY }}
          className="h-full w-full [transform-style:preserve-3d]"
        >
          <div
            className="sceau-respire relative h-full w-full [transform-style:preserve-3d]"
            style={{ transform: `rotateY(${REPOS.y}deg) rotateX(${REPOS.x}deg)` }}
          >
            {/* Anneau fin en retrait : seul élément de profondeur */}
            <div
              aria-hidden
              className="absolute inset-[-12%] rounded-full border border-white/40"
              style={{ transform: "translateZ(-70px)" }}
            />
            <Image
              src="/brand/logo-abm-seal-white.png"
              alt="Sceau de l’association ABM"
              fill
              priority
              sizes="(min-width: 1024px) 380px, 280px"
              className="object-contain"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Rayon de la zone sans courbes autour du sceau, et largeur du fondu, en part de la largeur du sceau. */
const DEGAGEMENT = { rayon: 0.6, fondu: 0.15 };

/**
 * Motif de courbes de niveau (public/brand/motif-courbes.svg) en fond du bandeau d'accueil.
 * À placer dans la même section que <SceauHero /> : les courbes s'effacent à l'intérieur de la
 * couronne du sceau, pour qu'il se détache sur un fond calme. La position du sceau est mesurée
 * au chargement et à chaque changement de taille (le sceau passe au-dessus du titre sur mobile).
 */
export function MotifCourbes() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calque = ref.current;
    const sceau = calque?.parentElement?.querySelector<HTMLElement>("[data-sceau]");
    if (!calque || !sceau) return;

    const mesurer = () => {
      const c = calque.getBoundingClientRect();
      const s = sceau.getBoundingClientRect();
      calque.style.setProperty("--degage-x", `${s.left + s.width / 2 - c.left}px`);
      calque.style.setProperty("--degage-y", `${s.top + s.height / 2 - c.top}px`);
      calque.style.setProperty("--degage-rayon", `${s.width * DEGAGEMENT.rayon}px`);
      calque.style.setProperty("--degage-fondu", `${s.width * DEGAGEMENT.fondu}px`);
      calque.dataset.pret = "";
    };

    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(calque);
    observateur.observe(sceau);
    return () => observateur.disconnect();
  }, []);

  return <div ref={ref} aria-hidden className="motif-courbes" />;
}

/** Grand sceau en filigrane, qui tourne très lentement au fil du défilement. */
export function SceauFiligrane({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduit = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotation = useTransform(scrollYProgress, [0, 1], [-12, reduit ? -12 : 18]);

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute ${className ?? ""}`}>
      <motion.div style={{ rotate: rotation }} className="relative h-full w-full opacity-[0.06]">
        <Image src="/brand/logo-abm-seal-white.png" alt="" fill sizes="700px" className="object-contain" />
      </motion.div>
    </div>
  );
}

/** Écriture française d'un nombre : « 2 212 » (espace insécable fine entre les milliers). */
const enFrancais = (n: number) => n.toLocaleString("fr-FR");

/** Nombre qui défile de 0 à sa valeur quand il apparaît à l'écran (chiffres réels uniquement). */
export function Compteur({ valeur, className }: { valeur: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.6 });
  const reduit = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || !visible) return;
    if (reduit) {
      element.textContent = enFrancais(valeur);
      return;
    }
    const controles = animate(0, valeur, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => {
        element.textContent = enFrancais(Math.round(v));
      },
    });
    return () => controles.stop();
  }, [visible, valeur, reduit]);

  return (
    <span ref={ref} className={className}>
      {reduit ? enFrancais(valeur) : 0}
    </span>
  );
}

/**
 * Ornement séparateur de la charte : deux filets fins et le losange ◆ au centre.
 * Les filets se dessinent depuis le centre quand l'ornement apparaît.
 */
export function Ornement({ clair = false, className }: { clair?: boolean; className?: string }) {
  const couleur = clair ? "bg-white/45" : "bg-bordeaux-700/35";
  return (
    <div aria-hidden className={`flex items-center justify-center gap-4 ${className ?? ""}`}>
      <motion.span
        className={`h-px w-24 origin-right sm:w-40 ${couleur}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      <motion.span
        className={`text-xs ${clair ? "text-white/70" : "text-bordeaux-400"}`}
        initial={{ opacity: 0, rotate: -90 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
      >
        ◆
      </motion.span>
      <motion.span
        className={`h-px w-24 origin-left sm:w-40 ${couleur}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

/** Filet de 3 px sous un titre de section, qui se trace de gauche à droite à l'apparition. */
export function FiletTitre({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`block h-[3px] w-14 origin-left bg-[image:var(--degrade-bouton)] ${className ?? ""}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
    />
  );
}

/** Carte avec un halo qui suit la souris (classe CSS .projecteur). */
export function CarteProjecteur({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`projecteur ${className ?? ""}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
