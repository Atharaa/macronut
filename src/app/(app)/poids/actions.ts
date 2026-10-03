"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfDay, startOfToday } from "@/lib/date";
import { recomputeGoalTargets } from "@/lib/goal";
import { numPositive, optionalNumPositive } from "@/lib/validation";

const schema = z.object({
  weightKg: numPositive,
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

const measurementSchema = z.object({
  chestCm: optionalNumPositive,
  waistCm: optionalNumPositive,
  thighCm: optionalNumPositive,
  date: z.coerce.date().optional(),
});

/** Enregistre les mensurations du jour ; un champ vide ne remplace pas une valeur existante. */
export async function addMeasurement(
  _prev: WeightState | undefined,
  formData: FormData,
): Promise<WeightState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const parsed = measurementSchema.safeParse({
    chestCm: formData.get("chestCm"),
    waistCm: formData.get("waistCm"),
    thighCm: formData.get("thighCm"),
    date: formData.get("date") || undefined,
  });
  if (!parsed.success) return { error: "Mesures invalides." };

  const { date: rawDate, ...values } = parsed.data;
  const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v != null));
  if (Object.keys(filled).length === 0) return { error: "Saisis au moins une mesure." };

  const date = rawDate ? startOfDay(rawDate) : startOfToday();
  await prisma.bodyMeasurement.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: filled,
    create: { userId: user.id, date, ...filled },
  });

  revalidatePath("/poids");
  return { ok: true };
}
