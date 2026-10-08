"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { numMin0 } from "@/lib/validation";
import { perServing, type PortionMacros } from "@/lib/recipe";

const dishSchema = z.object({
  name: z.string().trim().min(1),
  kcal: numMin0,
  proteinG: numMin0,
  carbG: numMin0,
  fatG: numMin0,
});

export type DishState = { error?: string; ok?: boolean };

export async function createDish(
  _prev: DishState | undefined,
  formData: FormData,
): Promise<DishState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const parsed = dishSchema.safeParse({
    name: formData.get("name"),
    kcal: formData.get("kcal"),
    proteinG: formData.get("proteinG"),
    carbG: formData.get("carbG"),
    fatG: formData.get("fatG"),
  });
  if (!parsed.success) return { error: "Valeurs invalides." };

  await prisma.dish.create({ data: { userId: user.id, ...parsed.data } });

  revalidatePath("/plats");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteDish(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const id = formData.get("id") as string | null;
  if (!id) return;
  await prisma.dish.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/plats");
  revalidatePath("/");
}

const recipeSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  servings: z.number().int().positive(),
  ingredients: z
    .array(
      z.object({
        referenceId: z.string().min(1),
        quantityG: z.number().positive(),
        pieces: z.number().positive().nullable(),
      }),
    )
    .min(1),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
type PreparedRecipe = RecipeInput & { macros: PortionMacros };

/** Valide la recette, vérifie la propriété et calcule les macros par portion depuis la base. */
async function prepareRecipe(userId: string, input: unknown): Promise<PreparedRecipe | { error: string }> {
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) return { error: "Recette invalide." };

  const { id, ingredients, servings } = parsed.data;
  const [owned, refs] = await Promise.all([
    id ? prisma.dish.findFirst({ where: { id, userId } }) : null,
    prisma.foodReference.findMany({ where: { id: { in: ingredients.map((i) => i.referenceId) } } }),
  ]);
  const byId = new Map(refs.map((r) => [r.id, r]));
  if ((id && !owned) || ingredients.some((i) => !byId.has(i.referenceId))) {
    return { error: "Recette ou ingrédient introuvable." };
  }

  const lines = ingredients.map((i) => ({ per100g: byId.get(i.referenceId)!, quantityG: i.quantityG }));
  return { ...parsed.data, macros: perServing(lines, servings) };
}

export async function saveRecipe(input: RecipeInput): Promise<DishState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const recipe = await prepareRecipe(user.id, input);
  if ("error" in recipe) return recipe;

  const data = {
    name: recipe.name,
    servings: recipe.servings,
    ...recipe.macros,
    ingredients: { create: recipe.ingredients },
  };
  if (recipe.id) {
    await prisma.$transaction([
      prisma.dishIngredient.deleteMany({ where: { dishId: recipe.id } }),
      prisma.dish.update({ where: { id: recipe.id }, data }),
    ]);
  } else {
    await prisma.dish.create({ data: { userId: user.id, ...data } });
  }

  revalidatePath("/plats");
  revalidatePath("/");
  return { ok: true };
}
