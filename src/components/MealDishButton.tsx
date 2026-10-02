"use client";

import { useActionState, useEffect, useState } from "react";
import { ChefHat, Loader2, Plus, X } from "lucide-react";
import { addDishToMeal, type MealState } from "@/app/(app)/actions";

export interface DishOption {
  id: string;
  name: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

const r = (n: number) => Math.round(n);

export function MealDishButton({ mealType, date, dishes }: { mealType: string; date: string; dishes: DishOption[] }) {
  const [open, setOpen] = useState(false);
  if (dishes.length === 0) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
      >
        <ChefHat size={16} />
        Ajouter un plat
      </button>
      {open && <DishPicker mealType={mealType} date={date} dishes={dishes} onClose={() => setOpen(false)} />}
    </>
  );
}

function DishPicker({
  mealType,
  date,
  dishes,
  onClose,
}: {
  mealType: string;
  date: string;
  dishes: DishOption[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<DishOption | null>(null);
  const [state, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addDishToMeal,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">Mes plats</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>
        <ul className="space-y-1.5">
          {dishes.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelected(d)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ring-1 ${
                  selected?.id === d.id
                    ? "bg-emerald-50 ring-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-600"
                    : "ring-neutral-100 dark:ring-neutral-800"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-neutral-700 dark:text-neutral-200">{d.name}</span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    P {r(d.proteinG)} · G {r(d.carbG)} · L {r(d.fatG)}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-neutral-600 dark:text-neutral-300">{r(d.kcal)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <form action={formAction} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="dishId" value={selected.id} />
            <input type="hidden" name="mealType" value={mealType} />
            <input type="hidden" name="date" value={date} />
            <label className="text-xs font-medium text-neutral-500">Portions</label>
            <input
              name="portions"
              type="text"
              inputMode="decimal"
              defaultValue="1"
              required
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter
            </button>
          </form>
        )}
        {state?.error && <p className="mt-1 text-xs text-rose-600">{state.error}</p>}
      </div>
    </div>
  );
}
