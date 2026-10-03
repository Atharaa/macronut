import { prisma } from "@/lib/prisma";
import { addDays, toDateParam } from "@/lib/date";
import { ACTIVITY_REINTEGRATION } from "@/lib/nutrition";
import type { DayIntake } from "@/lib/weekly";

/** Charge les apports des 7 jours à partir du lundi donné (repas, sinon saisie manuelle). */
export async function loadWeekIntakes(
  userId: string,
  weekStart: Date,
  targetKcal: number | null,
): Promise<DayIntake[]> {
  const range = { gte: weekStart, lte: addDays(weekStart, 6) };
  const [meals, activities, manuals] = await Promise.all([
    prisma.meal.findMany({ where: { userId, date: range }, include: { items: true } }),
    prisma.activityEntry.findMany({ where: { userId, date: range } }),
    prisma.manualDayIntake.findMany({ where: { userId, date: range } }),
  ]);

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const sameDay = (d: Date) => d.getTime() === date.getTime();
    const items = meals.filter((m) => sameDay(m.date)).flatMap((m) => m.items);
    const manual = manuals.find((m) => sameDay(m.date));
    const burn = activities.filter((a) => sameDay(a.date)).reduce((s, a) => s + a.estimatedKcal, 0);
    const budget = targetKcal != null ? targetKcal + Math.round(burn * ACTIVITY_REINTEGRATION) : null;

    if (items.length > 0) {
      return {
        date: toDateParam(date),
        kcal: items.reduce((s, it) => s + it.kcal, 0),
        manual: false,
        proteinG: items.reduce((s, it) => s + it.proteinG, 0),
        budget,
      };
    }
    return { date: toDateParam(date), kcal: manual?.kcal ?? null, manual: manual != null, proteinG: null, budget };
  });
}
