"use server";

import type { MealType } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfToday } from "@/lib/date";
import { addFoodsFromText } from "@/lib/meal";
import { isAiConfigured } from "@/lib/ai/parse-meal";
import { scaleMacros } from "@/lib/macros";
import { normalize } from "@/lib/food-search";
import { numPositive, numMin0 } from "@/lib/validation";

const MEAL_TYPES: MealType[] = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
];

export type MealState = {
  error?: string;
  ok?: boolean;
  estimated?: string[];
  needsInput?: string[];
};

export async function addMeal(
  _prev: MealState | undefined,
  formData: FormData,
): Promise<MealState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  if (!isAiConfigured()) {
    return { error: "Clé IA non configurée (ANTHROPIC_API_KEY)." };
  }

  const mealType = formData.get("mealType") as MealType | null;
  const text = (formData.get("text") as string | null)?.trim();
  if (!mealType || !MEAL_TYPES.includes(mealType)) return { error: "Repas inconnu." };
  if (!text) return { error: "Saisie vide." };

  try {
    const result = await addFoodsFromText(user.id, startOfToday(), mealType, text);
    revalidatePath("/");
    if (result.added === 0) return { error: "Aucun aliment détecté." };
    return { ok: true, estimated: result.estimated, needsInput: result.needsInput };
  } catch {
    return { error: "Erreur lors de l'analyse. Réessaie." };
  }
}

export async function deleteFoodItem(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const id = formData.get("id") as string | null;
  if (!id) return;
  await prisma.foodItem.deleteMany({
    where: { id, meal: { userId: user.id } },
  });
  revalidatePath("/");
}

const macrosSchema = z.object({
  itemId: z.string().min(1),
  quantityG: numPositive,
  kcal: numMin0,
  proteinG: numMin0,
  carbG: numMin0,
  fatG: numMin0,
  fiberG: numMin0,
});

export type SaveMacrosState = { error?: string; ok?: boolean };

/**
 * Correction manuelle : l'utilisateur saisit la quantité et les valeurs POUR 100 g
 * d'un aliment. On met à jour (ou crée) la référence en base (source = manuel) et on
 * recalcule l'item.
 */
export async function saveFoodMacros(
  _prev: SaveMacrosState | undefined,
  formData: FormData,
): Promise<SaveMacrosState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const parsed = macrosSchema.safeParse({
    itemId: formData.get("itemId"),
    quantityG: formData.get("quantityG"),
    kcal: formData.get("kcal"),
    proteinG: formData.get("proteinG"),
    carbG: formData.get("carbG"),
    fatG: formData.get("fatG"),
    fiberG: formData.get("fiberG"),
  });
  if (!parsed.success) return { error: "Valeurs invalides." };

  const item = await prisma.foodItem.findFirst({
    where: { id: parsed.data.itemId, meal: { userId: user.id } },
  });
  if (!item) return { error: "Aliment introuvable." };

  const per100g = {
    kcal: parsed.data.kcal,
    proteinG: parsed.data.proteinG,
    carbG: parsed.data.carbG,
    fatG: parsed.data.fatG,
    fiberG: parsed.data.fiberG,
  };

  let referenceId = item.referenceId;
  if (referenceId) {
    await prisma.foodReference.update({
      where: { id: referenceId },
      data: { ...per100g, source: "manual" },
    });
  } else {
    const ref = await prisma.foodReference.upsert({
      where: { ciqualId: `manual-${normalize(item.name).replace(/\s+/g, "-")}` },
      update: { ...per100g, source: "manual" },
      create: {
        ciqualId: `manual-${normalize(item.name).replace(/\s+/g, "-")}`,
        name: item.name,
        ...per100g,
        source: "manual",
      },
    });
    referenceId = ref.id;
  }

  const scaled = scaleMacros(per100g, parsed.data.quantityG);
  await prisma.foodItem.update({
    where: { id: item.id },
    data: { referenceId, quantityG: parsed.data.quantityG, ...scaled },
  });

  revalidatePath("/");
  return { ok: true };
}
