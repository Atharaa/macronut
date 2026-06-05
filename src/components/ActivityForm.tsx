"use client";

import { useActionState } from "react";
import { addActivity, type ActivityState } from "@/app/(app)/activite/actions";

export function ActivityForm() {
  const [state, formAction, pending] = useActionState<ActivityState | undefined, FormData>(
    addActivity,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <select name="type" className="rounded-lg border p-2.5 bg-transparent">
          <option value="steps">Pas</option>
          <option value="sport">Sport (min)</option>
        </select>
        <input
          type="number"
          name="value"
          step="1"
          required
          placeholder="Nombre / minutes"
          className="flex-1 rounded-lg border p-2.5 bg-transparent"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-600 px-4 font-medium text-white disabled:opacity-60"
        >
          +
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Activité ajoutée.</p>}
    </form>
  );
}
