"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { addMeasurement, type WeightState } from "@/app/(app)/poids/actions";

const inputCls =
  "rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:focus:bg-neutral-900";

const FIELDS = [
  ["chestCm", "Poitrine (cm)"],
  ["waistCm", "Taille (cm)"],
  ["thighCm", "Cuisse (cm)"],
] as const;

export function MeasurementForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<WeightState | undefined, FormData>(
    addMeasurement,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800"
    >
      <div className="grid grid-cols-3 gap-2">
        {FIELDS.map(([name, ph]) => (
          <input key={name} type="text" inputMode="decimal" name={name} placeholder={ph} className={`min-w-0 ${inputCls}`} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="date" name="date" className={`min-w-0 flex-1 ${inputCls}`} />
        <button
          type="submit"
          disabled={pending}
          aria-label="Ajouter"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 disabled:opacity-60"
        >
          <Plus size={20} />
        </button>
      </div>
      {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-xs text-emerald-600">Mesures enregistrées.</p>}
    </form>
  );
}
