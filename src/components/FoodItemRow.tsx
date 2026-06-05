"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, Check } from "lucide-react";
import { saveFoodMacros, deleteFoodItem, type SaveMacrosState } from "@/app/(app)/actions";

export interface FoodItemRowProps {
  id: string;
  name: string;
  quantityG: number;
  kcal: number;
  per100: { kcal: number; proteinG: number; carbG: number; fatG: number; fiberG: number };
  badge?: "ai" | "unknown";
}

const r = (n: number) => Math.round(n);
const numCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:bg-neutral-900";

export function FoodItemRow(props: FoodItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<SaveMacrosState | undefined, FormData>(
    saveFoodMacros,
    undefined,
  );

  return (
    <li className="text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-200">
          {props.name} <span className="text-neutral-400">· {r(props.quantityG)} g</span>
          {props.badge === "ai" && (
            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              estimé
            </span>
          )}
          {props.badge === "unknown" && (
            <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
              à compléter
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="tabular-nums font-medium text-neutral-600 dark:text-neutral-300">{r(props.kcal)} kcal</span>
          <button
            type="button"
            aria-label="Modifier"
            onClick={() => setEditing((e) => !e)}
            className="text-neutral-300 hover:text-emerald-600"
          >
            <Pencil size={15} />
          </button>
          <form action={deleteFoodItem} className="flex">
            <input type="hidden" name="id" value={props.id} />
            <button type="submit" aria-label="Supprimer" className="text-neutral-300 hover:text-rose-500">
              <Trash2 size={15} />
            </button>
          </form>
        </span>
      </div>

      {editing && (
        <form action={formAction} className="mt-2 space-y-2 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-100 dark:bg-neutral-800/50 dark:ring-neutral-800">
          <input type="hidden" name="itemId" value={props.id} />
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs font-medium text-neutral-500">Quantité (g)</label>
            <input name="quantityG" type="number" step="1" defaultValue={r(props.quantityG)} required className={numCls} />
          </div>
          <p className="text-xs font-medium text-neutral-500">Valeurs pour 100 g :</p>
          <div className="grid grid-cols-5 gap-1.5">
            {([
              ["kcal", "kcal", props.per100.kcal],
              ["proteinG", "Prot", props.per100.proteinG],
              ["carbG", "Gluc", props.per100.carbG],
              ["fatG", "Lip", props.per100.fatG],
              ["fiberG", "Fib", props.per100.fiberG],
            ] as const).map(([name, ph, val]) => (
              <input key={name} name={name} type="number" step="0.1" defaultValue={val} placeholder={ph} required className={numCls} />
            ))}
          </div>
          {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}
          {state?.ok && (
            <p className="flex items-center gap-1 text-xs text-emerald-600">
              <Check size={13} /> Enregistré.
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </li>
  );
}
