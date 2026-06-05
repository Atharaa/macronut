import type { MealType } from "@prisma/client";
import Link from "next/link";
import { Sunrise, Apple, UtensilsCrossed, Cookie, Moon, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfToday } from "@/lib/date";
import { MealInput } from "@/components/MealInput";
import { FoodItemRow } from "@/components/FoodItemRow";
import { MacroBar } from "@/components/MacroBar";
import { ACTIVITY_REINTEGRATION } from "@/lib/nutrition";

const MEALS: { type: MealType; label: string; icon: LucideIcon; chip: string }[] = [
  { type: "breakfast", label: "Petit déjeuner", icon: Sunrise, chip: "bg-amber-100 text-amber-600" },
  { type: "morning_snack", label: "Collation matin", icon: Apple, chip: "bg-emerald-100 text-emerald-600" },
  { type: "lunch", label: "Déjeuner", icon: UtensilsCrossed, chip: "bg-sky-100 text-sky-600" },
  { type: "afternoon_snack", label: "Collation après-midi", icon: Cookie, chip: "bg-orange-100 text-orange-600" },
  { type: "dinner", label: "Dîner", icon: Moon, chip: "bg-indigo-100 text-indigo-600" },
];

const r = (n: number) => Math.round(n);

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
  const activityBurn = activities.reduce((s, a) => s + a.estimatedKcal, 0);
  // On ne réintègre qu'une partie des calories de sport (souvent surestimées).
  const activityBonus = Math.round(activityBurn * ACTIVITY_REINTEGRATION);

  const hasGoal = goal?.targetKcal != null;
  const budget = hasGoal ? goal!.targetKcal! + activityBonus : 0;
  const remainingKcal = hasGoal ? budget - consumed.kcal : null;
  const pctEaten = budget > 0 ? Math.min(100, Math.round((consumed.kcal / budget) * 100)) : 0;

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const macroBars = [
    { label: "Protéines", consumed: consumed.proteinG, target: goal?.targetProteinG, barClass: "bg-indigo-500", trackClass: "bg-indigo-100 dark:bg-indigo-950/50" },
    { label: "Glucides", consumed: consumed.carbG, target: goal?.targetCarbG, barClass: "bg-amber-500", trackClass: "bg-amber-100 dark:bg-amber-950/50" },
    { label: "Lipides", consumed: consumed.fatG, target: goal?.targetFatG, barClass: "bg-rose-500", trackClass: "bg-rose-100 dark:bg-rose-950/50" },
    { label: "Fibres", consumed: consumed.fiberG, target: goal?.targetFiberG, barClass: "bg-emerald-500", trackClass: "bg-emerald-100 dark:bg-emerald-950/50" },
  ];

  return (
    <main className="space-y-4 p-4">
      {/* En-tête dégradé : calories restantes */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
        <div className="text-xs font-medium uppercase tracking-wide text-white/75 first-letter:uppercase">
          {dateLabel}
        </div>
        {hasGoal ? (
          <>
            <div className="mt-1 flex items-end justify-between">
              <div>
                <div className="text-5xl font-bold leading-none">{r(remainingKcal!)}</div>
                <div className="mt-1 text-sm text-white/80">kcal restantes</div>
              </div>
              <div className="text-right text-xs text-white/75">
                <div>{r(consumed.kcal)} consommées</div>
                <div>objectif {goal!.targetKcal}</div>
                {activityBonus > 0 && <div>+{activityBonus} activité</div>}
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${pctEaten}%` }}
              />
            </div>
          </>
        ) : (
          <div className="mt-2 text-sm text-white/90">
            Définis ton objectif pour suivre tes besoins.{" "}
            <Link href="/objectif" className="font-semibold underline underline-offset-2">
              Configurer
            </Link>
          </div>
        )}
      </section>

      {/* Macros */}
      {hasGoal && (
        <section className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
          {macroBars.map((m) => (
            <MacroBar key={m.label} {...m} />
          ))}
        </section>
      )}

      {/* Repas */}
      <div className="space-y-3">
        {MEALS.map((m) => {
          const meal = mealByType.get(m.type);
          const items = meal?.items ?? [];
          const mealKcal = items.reduce((s, i) => s + i.kcal, 0);
          const p = items.reduce((s, i) => s + i.proteinG, 0);
          const c = items.reduce((s, i) => s + i.carbG, 0);
          const f = items.reduce((s, i) => s + i.fatG, 0);
          const fib = items.reduce((s, i) => s + i.fiberG, 0);
          const Icon = m.icon;
          return (
            <section key={m.type} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.chip}`}>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-100">{m.label}</div>
                  {items.length > 0 && (
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      P {r(p)} · G {r(c)} · L {r(f)} · F {r(fib)}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  {items.length ? `${r(mealKcal)} kcal` : ""}
                </div>
              </div>

              {items.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
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
                        defaultOpen={badge === "unknown"}
                      />
                    );
                  })}
                </ul>
              )}

              <MealInput mealType={m.type} />
            </section>
          );
        })}
      </div>
    </main>
  );
}
