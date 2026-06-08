"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { addActivity, type ActivityState } from "@/app/(app)/activite/actions";
import { SPORTS } from "@/lib/nutrition";

const fieldCls =
  "rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:focus:bg-neutral-900";

export function ActivityForm({ date }: { date: string }) {
  const [state, formAction, pending] = useActionState<ActivityState | undefined, FormData>(
    addActivity,
    undefined,
  );
  const [type, setType] = useState<"steps" | "sport">("steps");

  return (
    <form action={formAction} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <input type="hidden" name="date" value={date} />
      <div className="flex gap-2">
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "steps" | "sport")}
          className={fieldCls}
        >
          <option value="steps">Pas</option>
          <option value="sport">Sport</option>
        </select>
        {type === "sport" && (
          <select name="sport" className={`min-w-0 flex-1 ${fieldCls}`} defaultValue={SPORTS[0].key}>
            {SPORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="value"
          inputMode="numeric"
          required
          placeholder={type === "sport" ? "Durée (minutes)" : "Nombre de pas"}
          className={`min-w-0 flex-1 ${fieldCls}`}
        />
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
      {state?.ok && <p className="text-xs text-emerald-600">Activité ajoutée.</p>}
    </form>
  );
}
