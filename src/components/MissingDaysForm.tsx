"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveManualIntakes, type BilanState } from "@/app/(app)/bilan/actions";

const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });

export function MissingDaysForm({ dates }: { dates: string[] }) {
  const [state, formAction, pending] = useActionState<BilanState | undefined, FormData>(
    saveManualIntakes,
    undefined,
  );
  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800"
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Aucun repas saisi pour {dates.length > 1 ? "ces jours" : "ce jour"}. Indique le total de kcal mangées
        (approximatif), ou saisis les repas du jour.
      </p>
      {dates.map((d) => (
        <div key={d}>
          <div className="flex items-center gap-2">
            <label htmlFor={`kcal_${d}`} className="flex-1 text-sm font-medium capitalize text-neutral-700 dark:text-neutral-200">
              {fmt.format(new Date(d))}
            </label>
            <input
              id={`kcal_${d}`}
              name={`kcal_${d}`}
              type="text"
              inputMode="numeric"
              required
              placeholder="kcal"
              className="w-24 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          <Link href={`/?d=${d}`} className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ou saisir les repas
          </Link>
        </div>
      ))}
      {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Valider et voir le bilan"}
      </button>
    </form>
  );
}
