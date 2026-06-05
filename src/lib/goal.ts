import { prisma } from "@/lib/prisma";
import { getLatestWeight } from "@/lib/user";
import { ageFromBirthDate, computeTargets } from "@/lib/nutrition";

/**
 * Recalcule et enregistre les objectifs (kcal + macros) à partir du profil et de
 * la dernière pesée. Appelé quand le poids change, pour que les besoins suivent
 * la perte (le métabolisme de base baisse avec le poids). Sans effet si le profil
 * ou l'objectif est incomplet.
 */
export async function recomputeGoalTargets(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { goal: true },
  });
  if (!user?.goal || !user.sex || !user.birthDate || user.heightCm == null) return;

  const latest = await getLatestWeight(userId);
  if (!latest) return;

  const targets = computeTargets({
    sex: user.sex,
    weightKg: latest.weightKg,
    heightCm: user.heightCm,
    ageYears: ageFromBirthDate(user.birthDate),
    activityLevel: user.goal.activityLevel,
    goalType: user.goal.type,
    weeklyRateKg: user.goal.weeklyRateKg,
    targetKg: user.goal.targetKg,
    leanMassKg: user.leanMassKg,
  });

  await prisma.goal.update({
    where: { userId },
    data: {
      targetKcal: targets.targetKcal,
      targetProteinG: targets.proteinG,
      targetCarbG: targets.carbG,
      targetFatG: targets.fatG,
      targetFiberG: targets.fiberG,
    },
  });
}
