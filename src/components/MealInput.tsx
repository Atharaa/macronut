"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { addFoodByReference, type MealState } from "@/app/(app)/actions";
import { FoodSearch } from "@/components/FoodSearch";
import type { PickedFood } from "@/lib/recipe";

const r = (n: number) => Math.round(n);

export function MealInput({ mealType, date }: { mealType: string; date: string }) {
  const [selected, setSelected] = useState<PickedFood | null>(null);
  const [state, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addFoodByReference,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) setSelected(null);
  }, [state]);

  return (
    <div className="mt-3">
      {!selected && <FoodSearch onPick={setSelected} placeholder="Ajouter un aliment… (riz, poulet)" />}

      {selected && (
        <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-100 dark:bg-neutral-800/50 dark:ring-neutral-800">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">{selected.name}</div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Pour 100 g : {r(selected.per100g.kcal)} kcal · P {r(selected.per100g.proteinG)} · G{" "}
                {r(selected.per100g.carbG)} · L {r(selected.per100g.fatG)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Annuler"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={16} />
            </button>
          </div>
          <form action={formAction} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="referenceId" value={selected.referenceId} />
            <input type="hidden" name="mealType" value={mealType} />
            <input type="hidden" name="date" value={date} />
            <input
              name="quantityG"
              defaultValue="100"
              inputMode="decimal"
              required
              aria-label="Quantité (g)"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <span className="text-sm text-neutral-500">g</span>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter
            </button>
          </form>
        </div>
      )}
      {state?.error && <p className="mt-1.5 px-1 text-xs text-rose-600">{state.error}</p>}
    </div>
  );
}
