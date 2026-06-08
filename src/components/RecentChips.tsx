"use client";

import { useActionState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addRecentFood, type MealState } from "@/app/(app)/actions";
import type { RecentFood } from "@/lib/recents";

export function RecentChips({ mealType, date, recents }: { mealType: string; date: string; recents: RecentFood[] }) {
  if (recents.length === 0) return null;
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
      {recents.map((food) => (
        <RecentChip key={food.referenceId} mealType={mealType} date={date} food={food} />
      ))}
    </div>
  );
}

function RecentChip({ mealType, date, food }: { mealType: string; date: string; food: RecentFood }) {
  const [, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addRecentFood,
    undefined,
  );
  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="referenceId" value={food.referenceId} />
      <input type="hidden" name="mealType" value={mealType} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="quantityG" value={food.quantityG} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 active:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {food.name}
      </button>
    </form>
  );
}
