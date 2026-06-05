"use client";

import { useActionState, useState } from "react";
import { Footprints, Dumbbell, Pencil, Trash2 } from "lucide-react";
import { updateActivity, deleteActivity, type ActivityState } from "@/app/(app)/activite/actions";

export interface ActivityItemProps {
  id: string;
  type: "steps" | "sport";
  name: string | null;
  value: number;
  estimatedKcal: number;
}

export function ActivityItem(props: ActivityItemProps) {
  const isSteps = props.type === "steps";
  const Icon = isSteps ? Footprints : Dumbbell;
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ActivityState | undefined, FormData>(
    updateActivity,
    undefined,
  );

  return (
    <li className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <span className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {isSteps ? `${props.value} pas` : `${props.name ?? "Sport"} · ${props.value} min`}
        </span>
        <span className="text-sm font-semibold text-orange-600">+{props.estimatedKcal} kcal</span>
        <button
          type="button"
          aria-label="Modifier"
          onClick={() => setEditing((e) => !e)}
          className="text-neutral-300 hover:text-emerald-600"
        >
          <Pencil size={15} />
        </button>
        <form action={deleteActivity} className="flex">
          <input type="hidden" name="id" value={props.id} />
          <button type="submit" aria-label="Supprimer" className="text-neutral-300 hover:text-rose-500">
            <Trash2 size={15} />
          </button>
        </form>
      </div>

      {editing && (
        <form action={formAction} className="mt-2 flex items-center gap-2">
          <input type="hidden" name="id" value={props.id} />
          <input
            name="value"
            type="text"
            inputMode="numeric"
            defaultValue={props.value}
            required
            className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:bg-neutral-900"
            placeholder={isSteps ? "Nombre de pas" : "Durée (min)"}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "…" : "OK"}
          </button>
        </form>
      )}
      {state?.error && <p className="mt-1 text-xs text-rose-600">{state.error}</p>}
    </li>
  );
}
