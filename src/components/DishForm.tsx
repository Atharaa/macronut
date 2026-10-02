"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createDish, type DishState } from "@/app/(app)/plats/actions";

const fieldCls =
  "w-full rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:focus:bg-neutral-900";

const MACROS = [
  ["kcal", "Kcal"],
  ["proteinG", "Protéines (g)"],
  ["fatG", "Lipides (g)"],
  ["carbG", "Glucides (g)"],
] as const;

export function DishForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<DishState | undefined, FormData>(
    createDish,
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
      <input name="name" type="text" required placeholder="Nom du plat" className={fieldCls} />
      <p className="px-1 text-xs font-medium text-neutral-500">Valeurs pour une portion :</p>
      <div className="grid grid-cols-2 gap-2">
        {MACROS.map(([name, ph]) => (
          <input key={name} name={name} type="text" inputMode="decimal" required placeholder={ph} className={fieldCls} />
        ))}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        <Plus size={16} />
        {pending ? "Enregistrement…" : "Ajouter le plat"}
      </button>
      {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-xs text-emerald-600">Plat ajouté.</p>}
    </form>
  );
}
