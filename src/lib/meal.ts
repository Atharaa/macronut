import type { MealType, FoodReference } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseMealText } from "@/lib/ai/parse-meal";
import { estimateFoodMacros } from "@/lib/ai/estimate-food";
import { findBestMatch, normalize } from "@/lib/food-search";
import { scaleMacros } from "@/lib/macros";

export interface AddFoodsResult {
  added: number;
  estimated: string[]; // aliments dont les valeurs ont été estimées par l'IA (à vérifier)
  failed: string[]; // aliments impossibles à estimer (ajoutés à 0 kcal)
}

function aiCiqualId(name: string): string {
  return `ai-${normalize(name).replace(/\s+/g, "-")}`;
}

/**
 * Découpe un message en aliments (IA), trouve/estime chaque aliment, calcule les
 * macros à l'échelle et crée les FoodItem du repas. Les aliments absents de la base
 * sont estimés par l'IA puis ajoutés à la base (réutilisables ensuite).
 */
export async function addFoodsFromText(
  userId: string,
  date: Date,
  mealType: MealType,
  text: string,
): Promise<AddFoodsResult> {
  const parsed = await parseMealText(text);
  if (parsed.length === 0) return { added: 0, estimated: [], failed: [] };

  const meal = await prisma.meal.upsert({
    where: { userId_date_type: { userId, date, type: mealType } },
    update: {},
    create: { userId, date, type: mealType },
  });

  const refs: FoodReference[] = await prisma.foodReference.findMany();
  const estimated: string[] = [];
  const failed: string[] = [];

  for (const item of parsed) {
    let ref = findBestMatch(item.name, refs);

    if (!ref) {
      const est = await estimateFoodMacros(item.name);
      if (est) {
        ref = await prisma.foodReference.upsert({
          where: { ciqualId: aiCiqualId(item.name) },
          update: { ...est },
          create: { ciqualId: aiCiqualId(item.name), name: item.name, ...est, source: "ai" },
        });
        refs.push(ref);
        estimated.push(item.name);
      }
    }

    if (ref) {
      const m = scaleMacros(ref, item.quantityG);
      await prisma.foodItem.create({
        data: { mealId: meal.id, referenceId: ref.id, name: ref.name, quantityG: item.quantityG, ...m },
      });
    } else {
      failed.push(item.name);
      await prisma.foodItem.create({
        data: {
          mealId: meal.id,
          name: item.name,
          quantityG: item.quantityG,
          kcal: 0,
          proteinG: 0,
          carbG: 0,
          fatG: 0,
          fiberG: 0,
        },
      });
    }
  }

  return { added: parsed.length, estimated, failed };
}
