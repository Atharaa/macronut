"use client";

import { useActionState, useState } from "react";
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
const numCls = "w-full rounded border bg-transparent px-2 py-1 text-sm";

export function FoodItemRow(props: FoodItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<SaveMacrosState | undefined, FormData>(
    saveFoodMacros,
    undefined,
  );

  return (
    <li className="text-sm">
      <div className="flex items-center justify-between">
        <span className="text-neutral-700 dark:text-neutral-200">
          {props.name} <span className="text-neutral-400">({r(props.quantityG)} g)</span>
          {props.badge === "ai" && (
            <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-700">estimé</span>
          )}
          {props.badge === "unknown" && (
            <span className="ml-1 rounded bg-red-100 px-1 text-[10px] text-red-700">à compléter</span>
          )}
        </span>
        <span className="flex items-center gap-2 text-neutral-500">
          {r(props.kcal)} kcal
          <button
            type="button"
            aria-label="Modifier"
            onClick={() => setEditing((e) => !e)}
            className="text-neutral-400 hover:text-green-600"
          >
            ✎
          </button>
          <form action={deleteFoodItem}>
            <input type="hidden" name="id" value={props.id} />
            <button type="submit" aria-label="Supprimer" className="text-neutral-400 hover:text-red-500">
              ×
            </button>
          </form>
        </span>
      </div>

      {editing && (
        <form action={formAction} className="mt-2 space-y-2 rounded-lg border p-2">
          <input type="hidden" name="itemId" value={props.id} />
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs text-neutral-500">Quantité (g)</label>
            <input name="quantityG" type="number" step="1" defaultValue={r(props.quantityG)} required className={numCls} />
          </div>
          <p className="text-xs font-medium text-neutral-500">Valeurs pour 100 g :</p>
          <div className="grid grid-cols-5 gap-1">
            <input name="kcal" type="number" step="0.1" defaultValue={props.per100.kcal} placeholder="kcal" required className={numCls} />
            <input name="proteinG" type="number" step="0.1" defaultValue={props.per100.proteinG} placeholder="Prot" required className={numCls} />
            <input name="carbG" type="number" step="0.1" defaultValue={props.per100.carbG} placeholder="Gluc" required className={numCls} />
            <input name="fatG" type="number" step="0.1" defaultValue={props.per100.fatG} placeholder="Lip" required className={numCls} />
            <input name="fiberG" type="number" step="0.1" defaultValue={props.per100.fiberG} placeholder="Fib" required className={numCls} />
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state?.ok && <p className="text-xs text-green-600">Enregistré. Tu peux fermer.</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-green-600 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </li>
  );
}
