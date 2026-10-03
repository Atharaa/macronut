export interface DayIntake {
  date: string; // YYYY-MM-DD
  kcal: number | null; // null = aucun repas ni saisie manuelle
  manual: boolean;
  proteinG: number | null; // null pour une saisie manuelle (macros inconnues)
  budget: number | null; // objectif kcal du jour (objectif + activités), null sans objectif
}

export interface WeekRecap {
  totalKcal: number;
  avgKcal: number;
  totalBudget: number | null;
  gapKcal: number | null; // > 0 : au-dessus de l'objectif sur la semaine
  daysOver: number;
  avgProteinG: number | null; // moyenne sur les jours avec repas détaillés
}

/** Jours de la semaine sans repas ni saisie manuelle. */
export function missingDays(days: DayIntake[]): string[] {
  return days.filter((d) => d.kcal == null).map((d) => d.date);
}

/** Récapitulatif des apports d'une semaine complète. */
export function buildWeekRecap(days: DayIntake[]): WeekRecap {
  const totalKcal = days.reduce((s, d) => s + (d.kcal ?? 0), 0);
  const hasBudget = days.every((d) => d.budget != null);
  const totalBudget = hasBudget ? days.reduce((s, d) => s + d.budget!, 0) : null;
  const detailed = days.filter((d) => d.proteinG != null);
  return {
    totalKcal,
    avgKcal: days.length ? totalKcal / days.length : 0,
    totalBudget,
    gapKcal: totalBudget != null ? totalKcal - totalBudget : null,
    daysOver: days.filter((d) => d.budget != null && (d.kcal ?? 0) > d.budget).length,
    avgProteinG: detailed.length ? detailed.reduce((s, d) => s + d.proteinG!, 0) / detailed.length : null,
  };
}
