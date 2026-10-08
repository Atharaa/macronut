"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { searchFoods } from "@/lib/food-search";
import type { PickedFood } from "@/lib/recipe";

/**
 * Recherche d'un aliment par nom dans la base (CIQUAL, aliments perso, produits scannés).
 * Les valeurs estimées par l'ancienne IA sont exclues (peu fiables).
 */
export async function searchFoodReferences(query: string): Promise<PickedFood[]> {
  const user = await getCurrentUser();
  if (!user || query.trim().length < 2) return [];
  const refs = await prisma.foodReference.findMany({ where: { source: { not: "ai" } } });
  return searchFoods(query, refs).map((r) => ({
    referenceId: r.id,
    name: r.name,
    per100g: { kcal: r.kcal, proteinG: r.proteinG, carbG: r.carbG, fatG: r.fatG, fiberG: r.fiberG },
    servingG: null,
  }));
}
