"use client";

import { useActionState } from "react";
import { addWeight, type WeightState } from "@/app/(app)/poids/actions";

export function WeightForm() {
  const [state, formAction, pending] = useActionState<WeightState | undefined, FormData>(
    addWeight,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="number"
          name="weightKg"
          step="0.1"
          required
          placeholder="Poids (kg)"
          className="flex-1 rounded-lg border p-2.5 bg-transparent"
        />
        <input type="date" name="date" className="rounded-lg border p-2.5 bg-transparent" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-600 px-4 font-medium text-white disabled:opacity-60"
        >
          +
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Pesée enregistrée.</p>}
    </form>
  );
}
