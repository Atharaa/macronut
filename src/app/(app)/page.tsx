import type { MealType } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfToday } from "@/lib/date";
import { MealInput } from "@/components/MealInput";
import { FoodItemRow } from "@/components/FoodItemRow";

const MEALS: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Petit déjeuner", icon: "🌅" },
  { type: "morning_snack", label: "Collation matin", icon: "🍎" },
  { type: "lunch", label: "Déjeuner", icon: "🍽️" },
  { type: "afternoon_snack", label: "Collation après-midi", icon: "🥨" },
  { type: "dinner", label: "Dîner", icon: "🌙" },
];

function r(n: number): number {
  return Math.round(n);
}

export default async function JourneePage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const today = startOfToday();
  const [meals, activities] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: user.id, date: today },
      include: { items: { include: { reference: true } } },
    }),
    prisma.activityEntry.findMany({ where: { userId: user.id, date: today } }),
  ]);
  const goal = user.goal;

  const mealByType = new Map(meals.map((m) => [m.type, m]));
  const allItems = meals.flatMap((m) => m.items);

  const consumed = allItems.reduce(
    (a, i) => ({
      kcal: a.kcal + i.kcal,
      proteinG: a.proteinG + i.proteinG,
      carbG: a.carbG + i.carbG,
      fatG: a.fatG + i.fatG,
      fiberG: a.fiberG + i.fiberG,
    }),
    { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 },
  );
  const activityBonus = activities.reduce((s, a) => s + a.estimatedKcal, 0);

  const hasGoal = goal?.targetKcal != null;
  const remainingKcal = hasGoal ? goal!.targetKcal! + activityBonus - consumed.kcal : null;

  const macroRow = (label: string, consumedG: number, targetG: number | null | undefined) => (
    <div className="flex-1 rounded-lg bg-white/15 px-1 py-1.5 text-center">
      <div className="text-[11px] opacity-85">{label}</div>
      <div className="text-sm font-semibold">{r(Math.max(0, (targetG ?? 0) - consumedG))} g</div>
      <div className="text-[10px] opacity-70">/ {targetG ?? "—"}</div>
    </div>
  );

  return (
    <main className="p-3">
      {/* Bandeau restant */}
      <section className="rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-4 text-white">
        <div className="text-xs uppercase tracking-wide opacity-85">Restant aujourd'hui</div>
        {hasGoal ? (
          <>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <div className="text-4xl font-bold">{r(remainingKcal!)}</div>
              <div className="text-sm opacity-85">
                / {goal!.targetKcal} kcal{activityBonus > 0 ? ` (+${activityBonus} activité)` : ""}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {macroRow("Prot.", consumed.proteinG, goal!.targetProteinG)}
              {macroRow("Gluc.", consumed.carbG, goal!.targetCarbG)}
              {macroRow("Lip.", consumed.fatG, goal!.targetFatG)}
              {macroRow("Fibres", consumed.fiberG, goal!.targetFiberG)}
            </div>
          </>
        ) : (
          <div className="mt-1 text-sm">
            Définis ton objectif pour voir tes besoins.{" "}
            <Link href="/objectif" className="underline">
              Aller à l'objectif
            </Link>
          </div>
        )}
      </section>

      {/* Repas */}
      <div className="mt-3 space-y-3">
        {MEALS.map((m) => {
          const meal = mealByType.get(m.type);
          const items = meal?.items ?? [];
          const mealKcal = items.reduce((s, i) => s + i.kcal, 0);
          const p = items.reduce((s, i) => s + i.proteinG, 0);
          const c = items.reduce((s, i) => s + i.carbG, 0);
          const f = items.reduce((s, i) => s + i.fatG, 0);
          const fib = items.reduce((s, i) => s + i.fiberG, 0);
          return (
            <section key={m.type} className="rounded-2xl border p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {m.icon} {m.label}
                </div>
                <div className="text-sm text-neutral-500">
                  {items.length ? `${r(mealKcal)} kcal` : "vide"}
                </div>
              </div>

              {items.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {items.map((i) => {
                    const per100 = i.reference
                      ? {
                          kcal: i.reference.kcal,
                          proteinG: i.reference.proteinG,
                          carbG: i.reference.carbG,
                          fatG: i.reference.fatG,
                          fiberG: i.reference.fiberG,
                        }
                      : i.quantityG > 0
                        ? {
                            kcal: (i.kcal * 100) / i.quantityG,
                            proteinG: (i.proteinG * 100) / i.quantityG,
                            carbG: (i.carbG * 100) / i.quantityG,
                            fatG: (i.fatG * 100) / i.quantityG,
                            fiberG: (i.fiberG * 100) / i.quantityG,
                          }
                        : { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 };
                    const badge: "ai" | "unknown" | undefined =
                      i.reference?.source === "ai" ? "ai" : !i.referenceId ? "unknown" : undefined;
                    return (
                      <FoodItemRow
                        key={i.id}
                        id={i.id}
                        name={i.name}
                        quantityG={i.quantityG}
                        kcal={i.kcal}
                        per100={per100}
                        badge={badge}
                      />
                    );
                  })}
                </ul>
              )}

              {items.length > 0 && (
                <div className="mt-2 text-[11px] text-neutral-400">
                  P {r(p)} · G {r(c)} · L {r(f)} · F {r(fib)}
                </div>
              )}

              <MealInput mealType={m.type} />
            </section>
          );
        })}
      </div>
    </main>
  );
}
