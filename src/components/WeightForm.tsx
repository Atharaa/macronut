"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addWeight, type WeightState } from "@/app/(app)/poids/actions";

const inputCls =
  "rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:focus:bg-neutral-900";

export function WeightForm() {
  const [state, formAction, pending] = useActionState<WeightState | undefined, FormData>(
    addWeight,
    undefined,
  );
  return (
    <form action={formAction} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="flex items-center gap-2">
        <input type="text" inputMode="decimal" name="weightKg" required placeholder="Poids (kg)" className={`min-w-0 flex-1 ${inputCls}`} />
        <input type="date" name="date" className={inputCls} />
        <button
          type="submit"
          disabled={pending}
          aria-label="Ajouter"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 disabled:opacity-60"
        >
          <Plus size={20} />
        </button>
      </div>
      {state?.error && <p className="mt-1.5 text-xs text-rose-600">{state.error}</p>}
      {state?.ok && <p className="mt-1.5 text-xs text-emerald-600">Pesée enregistrée.</p>}
    </form>
  );
}
