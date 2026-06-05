"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfToday } from "@/lib/date";
import { ageFromBirthDate, computeTargets } from "@/lib/nutrition";

const optionalPositive = z.preprocess(
  (v) => (v === null || v === "" ? null : Number(v)),
  z.number().positive().nullable(),
);

const schema = z.object({
  sex: z.enum(["male", "female"]),
  birthDate: z.coerce.date(),
  heightCm: z.coerce.number().positive(),
  weightKg: z.coerce.number().positive(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goalType: z.enum(["loss", "gain", "maintain"]),
  targetKg: optionalPositive,
  weeklyRateKg: optionalPositive,
  leanMassKg: optionalPositive,
});

export type ObjectifState = { error?: string; ok?: boolean };

export async function saveProfile(
  _prev: ObjectifState | undefined,
  formData: FormData,
): Promise<ObjectifState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const parsed = schema.safeParse({
    sex: formData.get("sex"),
    birthDate: formData.get("birthDate"),
    heightCm: formData.get("heightCm"),
    weightKg: formData.get("weightKg"),
    activityLevel: formData.get("activityLevel"),
    goalType: formData.get("goalType"),
    targetKg: formData.get("targetKg"),
    weeklyRateKg: formData.get("weeklyRateKg"),
    leanMassKg: formData.get("leanMassKg"),
  });

  if (!parsed.success) {
    return { error: "Champs invalides. Vérifie les valeurs saisies." };
  }

  const data = parsed.data;
  const isMaintain = data.goalType === "maintain";
  const targetKg = isMaintain ? null : data.targetKg;
  const weeklyRateKg = isMaintain ? null : data.weeklyRateKg;

  const ageYears = ageFromBirthDate(data.birthDate);
  const targets = computeTargets({
    sex: data.sex,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    ageYears,
    activityLevel: data.activityLevel,
    goalType: data.goalType,
    weeklyRateKg,
    targetKg,
    leanMassKg: data.leanMassKg,
  });

  const today = startOfToday();

  await prisma.user.update({
    where: { id: user.id },
    data: { sex: data.sex, birthDate: data.birthDate, heightCm: data.heightCm, leanMassKg: data.leanMassKg },
  });

  await prisma.weightEntry.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: { weightKg: data.weightKg },
    create: { userId: user.id, date: today, weightKg: data.weightKg },
  });

  await prisma.goal.upsert({
    where: { userId: user.id },
    update: {
      type: data.goalType,
      targetKg,
      weeklyRateKg,
      activityLevel: data.activityLevel,
      targetKcal: targets.targetKcal,
      targetProteinG: targets.proteinG,
      targetCarbG: targets.carbG,
      targetFatG: targets.fatG,
      targetFiberG: targets.fiberG,
    },
    create: {
      userId: user.id,
      type: data.goalType,
      targetKg,
      weeklyRateKg,
      activityLevel: data.activityLevel,
      targetKcal: targets.targetKcal,
      targetProteinG: targets.proteinG,
      targetCarbG: targets.carbG,
      targetFatG: targets.fatG,
      targetFiberG: targets.fiberG,
    },
  });

  revalidatePath("/objectif");
  revalidatePath("/");
  return { ok: true };
}
