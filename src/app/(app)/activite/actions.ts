"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getLatestWeight } from "@/lib/user";
import { startOfToday } from "@/lib/date";
import { computeActivityKcal, sportMet, sportLabel } from "@/lib/nutrition";
import { numPositive } from "@/lib/validation";

const DEFAULT_WEIGHT_KG = 70;

const schema = z.object({
  type: z.enum(["sport", "steps"]),
  value: numPositive,
  sport: z.string().optional(),
});

export type ActivityState = { error?: string; ok?: boolean };

export async function addActivity(
  _prev: ActivityState | undefined,
  formData: FormData,
): Promise<ActivityState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const parsed = schema.safeParse({
    type: formData.get("type"),
    value: formData.get("value"),
    sport: formData.get("sport"),
  });
  if (!parsed.success) return { error: "Activité invalide." };

  const latest = await getLatestWeight(user.id);
  const weightKg = latest?.weightKg ?? DEFAULT_WEIGHT_KG;
  const isSport = parsed.data.type === "sport";
  const met = isSport ? sportMet(parsed.data.sport) : undefined;
  const estimatedKcal = computeActivityKcal(parsed.data.type, parsed.data.value, weightKg, met);

  await prisma.activityEntry.create({
    data: {
      userId: user.id,
      date: startOfToday(),
      type: parsed.data.type,
      name: isSport ? sportLabel(parsed.data.sport) : null,
      value: parsed.data.value,
      estimatedKcal,
    },
  });

  revalidatePath("/activite");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteActivity(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.activityEntry.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/activite");
  revalidatePath("/");
}
