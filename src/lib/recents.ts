import type { MealType } from "@prisma/client";

export interface RecentFood {
  referenceId: string;
  name: string;
  quantityG: number;
}

interface RecentMealInput {
  type: MealType;
  date: Date;
  items: { referenceId: string | null; name: string; quantityG: number }[];
}

const MAX_RECENTS = 8;

/**
 * Dérive les aliments récents par type de repas à partir d'un historique de repas.
 * Déduplique par référence (première occurrence = plus récente), exclut les items
 * sans référence, conserve la dernière quantité utilisée, limite à 8 par repas.
 */
export function buildRecents(meals: RecentMealInput[]): Map<MealType, RecentFood[]> {
  const byType = new Map<MealType, RecentFood[]>();
  const seen = new Map<MealType, Set<string>>();
  const sorted = [...meals].sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const meal of sorted) {
    let list = byType.get(meal.type);
    if (!list) {
      list = [];
      byType.set(meal.type, list);
    }
    let seenSet = seen.get(meal.type);
    if (!seenSet) {
      seenSet = new Set();
      seen.set(meal.type, seenSet);
    }
    for (const item of meal.items) {
      if (item.referenceId == null || seenSet.has(item.referenceId) || list.length >= MAX_RECENTS) {
        continue;
      }
      seenSet.add(item.referenceId);
      list.push({ referenceId: item.referenceId, name: item.name, quantityG: item.quantityG });
    }
  }

  return byType;
}
