"use client";

import { useActionState } from "react";
import { addMeal, type MealState } from "@/app/(app)/actions";

export function MealInput({ mealType }: { mealType: string }) {
  const [state, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addMeal,
    undefined,
  );
  return (
    <div className="mt-2">
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="mealType" value={mealType} />
        <input
          name="text"
          required
          placeholder="Ex : un yaourt grec et une poignée d'amandes"
          className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-600 px-3 font-medium text-white disabled:opacity-60"
        >
          {pending ? "…" : "+"}
        </button>
      </form>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      {state?.estimated && state.estimated.length > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          Estimé par l'IA (vérifie via ✎) : {state.estimated.join(", ")}
        </p>
      )}
      {state?.failed && state.failed.length > 0 && (
        <p className="mt-1 text-xs text-red-600">
          À compléter manuellement (✎) : {state.failed.join(", ")}
        </p>
      )}
    </div>
  );
}
