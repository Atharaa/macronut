"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfDay, startOfToday } from "@/lib/date";
import { recomputeGoalTargets } from "@/lib/goal";

const schema = z.object({
  weightKg: z.coerce.number().positive(),
  date: z.coerce.date().optional(),
});

export type WeightState = { error?: string; ok?: boolean };

export async function addWeight(
  _prev: WeightState | undefined,
  formData: FormData,
): Promise<WeightState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const parsed = schema.safeParse({
    weightKg: formData.get("weightKg"),
    date: formData.get("date") || undefined,
  });
  if (!parsed.success) return { error: "Poids invalide." };

  const date = parsed.data.date ? startOfDay(parsed.data.date) : startOfToday();

  await prisma.weightEntry.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: { weightKg: parsed.data.weightKg },
    create: { userId: user.id, date, weightKg: parsed.data.weightKg },
  });

  // Les besoins suivent le poids : on recalcule les objectifs.
  await recomputeGoalTargets(user.id);

  revalidatePath("/poids");
  revalidatePath("/objectif");
  revalidatePath("/");
  return { ok: true };
}
