// Pictogramme de chaque type de formation complémentaire (formulaire, annuaire, page Opportunités).

import { Award, BookOpen, GraduationCap, MonitorPlay, Shapes, type LucideIcon } from "lucide-react";
import type { TypeComplementaire } from "@/lib/complementaires";

export const ICONES_COMPLEMENTAIRE: Record<TypeComplementaire, LucideIcon> = {
  DU: GraduationCap,
  LICENCE: BookOpen,
  CERTIFICATION: Award,
  MOOC: MonitorPlay,
  AUTRE: Shapes,
};
