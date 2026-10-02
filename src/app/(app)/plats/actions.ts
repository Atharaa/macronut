"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { numMin0 } from "@/lib/validation";

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
