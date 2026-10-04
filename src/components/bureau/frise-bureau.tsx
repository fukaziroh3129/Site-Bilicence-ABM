"use client";

// Page Bureau : une frise verticale qui se déploie au défilement. Le président en tête, puis le
// bureau, puis chaque pôle : son pictogramme apparaît sur la ligne en « éclatant » (anneau et éclats
// en losange, le ◆ de la charte), et ses membres jaillissent de part et d'autre.
// Avec « réduire les animations », tout s'affiche directement, sans mouvement.

import { BookOpen, Crown, Drama, Megaphone, PartyPopper, Trophy, Users, Wrench, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, type Variants } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

export type MembreFrise = { id: string; prenom: string; nom: string; role: string; photo: string | null };
export type PoleFrise = { code: string; nom: string; membres: MembreFrise[] };

/** Pictogramme de chaque pôle (Lucide). Un pôle inconnu prend le pictogramme « groupe ». */
const ICONES: Record<string, LucideIcon> = {
  communication: Megaphone,
  evenementiel: PartyPopper,
  culture: Drama,
  entraide: BookOpen,
  sport: Trophy,
  technique: Wrench,
};

const EASE = [0.16, 1, 0.3, 1] as const;
const ECLATS = 8;

/** Portrait : photo, ou emplacement signalé « photo à ajouter ». */
function Portrait({ membre, taille }: { membre: MembreFrise; taille: "grand" | "petit" }) {
  const classe = taille === "grand" ? "size-40 sm:size-48" : "size-16";
  if (membre.photo) {
    return (
      <Image
        src={membre.photo}
        alt={`${membre.prenom} ${membre.nom}`}
        width={taille === "grand" ? 400 : 160}
        height={taille === "grand" ? 400 : 160}
        unoptimized
        className={`${classe} shrink-0 rounded-full object-cover shadow-abm-card`}
      />
    );
  }
  return (
    <span
      title={`Photo à ajouter — ${membre.prenom} ${membre.nom}`}
      className={`${classe} flex shrink-0 items-center justify-center rounded-full border border-dashed border-bordeaux-300 bg-white font-display font-bold text-bordeaux-400 ${taille === "grand" ? "text-4xl" : "text-lg"}`}
    >
      <span aria-hidden>
        {membre.prenom[0]}
        {membre.nom[0]}
      </span>
      <span className="sr-only">Photo à ajouter</span>
    </span>
  );
}

// ─── Animations d'un pôle (déclenchées quand il entre à l'écran) ───
const noeud: Variants = {
  cache: { scale: 0, rotate: -40 },
  visible: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 14 } },
};
const anneau: Variants = {
  cache: { scale: 0.6, opacity: 0 },
  visible: { scale: [0.6, 2.6], opacity: [0.55, 0], transition: { duration: 0.9, ease: "easeOut", delay: 0.1 } },
};
const eclat = (i: number): Variants => {
  const angle = (i / ECLATS) * Math.PI * 2;
  return {
    cache: { x: 0, y: 0, opacity: 0, scale: 0.4 },
    visible: {
      x: Math.cos(angle) * 64,
      y: Math.sin(angle) * 64,
      opacity: [0, 1, 0],
      scale: [0.4, 1, 0.6],
      transition: { duration: 0.85, ease: EASE, delay: 0.12 },
    },
  };
};
const titrePole = (cote: "gauche" | "droite"): Variants => ({
  cache: { opacity: 0, x: cote === "gauche" ? -30 : 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE, delay: 0.15 } },
});
const groupeMembres: Variants = { cache: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } } };
/** Les membres jaillissent depuis la ligne (côté du pictogramme), avec un léger rebond. */
const membre = (cote: "gauche" | "droite"): Variants => ({
  cache: { opacity: 0, scale: 0.4, x: cote === "gauche" ? 70 : -70 },
  visible: { opacity: 1, scale: 1, x: 0, transition: { type: "spring", stiffness: 220, damping: 16 } },
});

function Pole({ pole, index }: { pole: PoleFrise; index: number }) {
  const reduit = useReducedMotion();
  const Icone = ICONES[pole.code] ?? Users;
  // Sur grand écran, les pôles alternent à gauche et à droite de la ligne.
  const cote = index % 2 === 0 ? "droite" : "gauche";

  return (
    <motion.li
      className="relative grid md:grid-cols-2"
      initial="cache"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
    >
      {/* Pictogramme sur la ligne */}
      <div className="absolute left-7 top-0 z-10 -translate-x-1/2 md:left-1/2">
        <div className="relative flex size-14 items-center justify-center">
          {!reduit && (
            <>
              <motion.span variants={anneau} aria-hidden className="absolute inset-0 rounded-full border-2 border-bordeaux-400" />
              {Array.from({ length: ECLATS }, (_, i) => (
                <motion.span key={i} variants={eclat(i)} aria-hidden className="absolute text-[10px] text-bordeaux-500">
                  ◆
                </motion.span>
              ))}
            </>
          )}
          <motion.span
            variants={noeud}
            className="relative flex size-14 items-center justify-center rounded-full bg-[image:var(--degrade-bouton)] text-white shadow-abm-raised ring-4 ring-[var(--abm-paper)]"
          >
            <Icone size={24} strokeWidth={1.6} aria-hidden />
          </motion.span>
        </div>
      </div>

      {/* Contenu du pôle */}
      <div className={`pl-20 md:pl-0 ${cote === "droite" ? "md:col-start-2 md:pl-16" : "md:col-start-1 md:pr-16 md:text-right"}`}>
        <motion.div variants={titrePole(cote)} className="pt-2">
          <p className="eyebrow text-bordeaux-500">Pôle</p>
          <h3 className="font-display text-3xl font-bold text-bordeaux-700">{pole.nom}</h3>
        </motion.div>
        {pole.membres.length === 0 ? (
          <motion.p variants={titrePole(cote)} className="mt-3 text-sm text-ink-soft">
            Membres à ajouter (Administration → Bureau).
          </motion.p>
        ) : (
          <motion.ul variants={groupeMembres} className={`mt-5 flex flex-wrap gap-3 ${cote === "gauche" ? "md:justify-end" : ""}`}>
            {pole.membres.map((m) => (
              <motion.li
                key={m.id}
                variants={membre(cote)}
                className="flex w-full items-center gap-3 rounded-abm-md border border-bordeaux-700/15 bg-white p-3 pr-5 text-left shadow-abm-card sm:w-auto"
              >
                <Portrait membre={m} taille="petit" />
                <span>
                  <span className="block font-display text-lg font-bold leading-tight text-bordeaux-700">
                    {m.prenom} {m.nom}
                  </span>
                  <span className="block text-sm text-ink-soft">{m.role}</span>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.li>
  );
}

export function FriseBureau({
  president,
  bureau,
  poles,
}: {
  president: MembreFrise | null;
  bureau: MembreFrise[];
  poles: PoleFrise[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduit = useReducedMotion();
  // La ligne se trace au fil du défilement.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const trace = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <div>

      {/* En tête : le président */}
      {president && (
        <motion.div
          className="relative z-10 flex flex-col items-center text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="relative">
            <Portrait membre={president} taille="grand" />
            <span className="absolute -right-1 bottom-2 flex size-12 items-center justify-center rounded-full bg-[image:var(--degrade-bouton)] text-white shadow-abm-raised ring-4 ring-[var(--abm-paper)]">
              <Crown size={22} strokeWidth={1.6} aria-hidden />
            </span>
          </div>
          <p className="mt-5 font-display text-3xl font-bold text-bordeaux-700 sm:text-4xl">
            {president.prenom} {president.nom}
          </p>
          <p className="eyebrow mt-1 text-ink-soft">{president.role}</p>
        </motion.div>
      )}

      {/* Le reste du bureau (vice-présidence, trésorerie, secrétariat…) */}
      {bureau.length > 0 && (
        <motion.ul
          className="relative z-10 mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-4"
          initial="cache"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={groupeMembres}
        >
          {bureau.map((m, i) => (
            <motion.li
              key={m.id}
              variants={membre(i % 2 === 0 ? "gauche" : "droite")}
              className="flex items-center gap-3 rounded-abm-md border border-bordeaux-700/15 bg-white p-3 pr-5 shadow-abm-card"
            >
              <Portrait membre={m} taille="petit" />
              <span>
                <span className="block font-display text-lg font-bold leading-tight text-bordeaux-700">
                  {m.prenom} {m.nom}
                </span>
                <span className="block text-sm text-ink-soft">{m.role}</span>
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* Les pôles, le long de la ligne */}
      <div ref={ref} className="relative mt-16 pt-12">
        {/* La ligne : un rail clair, et le trait bordeaux qui se dessine par-dessus au défilement */}
        <div aria-hidden className="absolute bottom-0 left-7 top-0 w-[2px] -translate-x-1/2 bg-bordeaux-100 md:left-1/2">
          <motion.div className="h-full w-full origin-top bg-[image:var(--degrade-bouton)]" style={{ scaleY: reduit ? 1 : trace }} />
        </div>
        <ol className="relative space-y-20 pb-6 sm:space-y-24">
          {poles.map((p, i) => (
            <Pole key={p.code} pole={p} index={i} />
          ))}
        </ol>
      </div>
    </div>
  );
}
