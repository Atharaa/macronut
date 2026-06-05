"use client";

import { useActionState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addMeal, type MealState } from "@/app/(app)/actions";

export function MealInput({ mealType }: { mealType: string }) {
  const [state, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addMeal,
    undefined,
  );
  return (
    <div className="mt-3">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="mealType" value={mealType} />
        <input
          name="text"
          required
          placeholder="Ajouter… ex : un yaourt grec et des amandes"
          className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Ajouter"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 disabled:opacity-60"
        >
          {pending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
        </button>
      </form>
      {state?.error && <p className="mt-1.5 px-1 text-xs text-rose-600">{state.error}</p>}
      {state?.estimated && state.estimated.length > 0 && (
        <p className="mt-1.5 px-1 text-xs text-amber-600">
          Estimé par l'IA (vérifie via ✎) : {state.estimated.join(", ")}
        </p>
      )}
      {state?.needsInput && state.needsInput.length > 0 && (
        <p className="mt-1.5 px-1 text-xs text-rose-600">
          Produit perso à compléter — saisis les valeurs via ✎ : {state.needsInput.join(", ")}
        </p>
      )}
    </div>
  );
}
