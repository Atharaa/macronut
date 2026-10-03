"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { parseDateParam, startOfWeek } from "@/lib/date";
import { numPositive } from "@/lib/validation";

export type BilanState = { error?: string; ok?: boolean };

/** Enregistre le total de kcal mangées des jours sans repas (champs kcal_YYYY-MM-DD). */
export async function saveManualIntakes(
  _prev: BilanState | undefined,
  formData: FormData,
): Promise<BilanState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const entries = [...formData.entries()]
    .filter(([key]) => key.startsWith("kcal_"))
    .map(([key, value]) => ({ date: parseDateParam(key.slice(5)), kcal: numPositive.safeParse(value) }));
  if (entries.length === 0 || entries.some((e) => !e.kcal.success)) {
    return { error: "Renseigne un total de kcal valide pour chaque jour." };
  }

  await prisma.$transaction(
    entries.map(({ date, kcal }) =>
      prisma.manualDayIntake.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: { kcal: kcal.data as number },
        create: { userId: user.id, date, kcal: kcal.data as number },
      }),
    ),
  );

  revalidatePath("/bilan");
  return { ok: true };
}

export async function completeReview(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const week = formData.get("weekStart") as string | null;
  if (!user || !week) return;
  const weekStart = startOfWeek(parseDateParam(week));
  await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId: user.id, weekStart } },
    update: {},
    create: { userId: user.id, weekStart },
  });
  revalidatePath("/bilan");
  revalidatePath("/");
}
