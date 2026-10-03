"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { addFoodByReference, type MealState } from "@/app/(app)/actions";
import { ScanOverlay, ScanView, type FoundProduct } from "@/components/ScanView";

export function BarcodeScanner({
  mealType,
  date,
  onClose,
}: {
  mealType: string;
  date: string;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<FoundProduct | null>(null);
  const [qty, setQty] = useState("100");
  const [addState, addAction, adding] = useActionState<MealState | undefined, FormData>(
    addFoodByReference,
    undefined,
  );

  function handleFound(found: FoundProduct) {
    setProduct(found);
    setQty(String(found.servingG ?? 100));
  }

  useEffect(() => {
    if (addState?.ok) onClose();
  }, [addState, onClose]);

  return (
    <ScanOverlay onClose={onClose}>
      {!product && <ScanView onFound={handleFound} />}

      {product && (
        <div className="m-auto w-full max-w-xs rounded-2xl bg-white p-4 dark:bg-neutral-900">
          <div className="font-semibold text-neutral-800 dark:text-neutral-100">{product.name}</div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Pour 100 g : {Math.round(product.per100g.kcal)} kcal · P {Math.round(product.per100g.proteinG)} · G{" "}
            {Math.round(product.per100g.carbG)} · L {Math.round(product.per100g.fatG)}
          </div>
          <form action={addAction} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="referenceId" value={product.referenceId} />
            <input type="hidden" name="mealType" value={mealType} />
            <input type="hidden" name="date" value={date} />
            <input
              name="quantityG"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="numeric"
              required
              placeholder="Quantité (g)"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter
            </button>
          </form>
          {addState?.error && <p className="mt-1 text-xs text-rose-600">{addState.error}</p>}
        </div>
      )}
    </ScanOverlay>
  );
}
