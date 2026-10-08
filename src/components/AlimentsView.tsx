"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanBarcode, Check, X } from "lucide-react";
import { FoodSearch } from "@/components/FoodSearch";
import { ScanOverlay, ScanView, type FoundProduct } from "@/components/ScanView";
import type { PickedFood } from "@/lib/recipe";

const r = (n: number) => Math.round(n);

export function AlimentsView({ scanned }: { scanned: PickedFood[] }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<PickedFood | null>(null);
  const [justScanned, setJustScanned] = useState(false);

  function handleFound(product: FoundProduct) {
    setScanning(false);
    setSelected(product);
    setJustScanned(true);
    router.refresh();
  }

  function pick(food: PickedFood) {
    setSelected(food);
    setJustScanned(false);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setScanning(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 py-3 text-sm font-medium text-white shadow-sm shadow-emerald-500/30"
      >
        <ScanBarcode size={18} />
        Scanner un produit
      </button>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
        <FoodSearch onPick={pick} placeholder="Rechercher dans la base…" />
      </section>

      {selected && <FoodDetail food={selected} justScanned={justScanned} onClose={() => setSelected(null)} />}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
        <div className="font-semibold text-neutral-800 dark:text-neutral-100">Produits scannés ({scanned.length})</div>
        {scanned.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">Aucun produit scanné pour l'instant.</p>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
            {scanned.map((f) => (
              <li key={f.referenceId}>
                <button type="button" onClick={() => pick(f)} className="flex w-full items-center gap-2 py-2 text-left text-sm">
                  <span className="min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-200">{f.name}</span>
                  <span className="shrink-0 text-xs text-neutral-400">{r(f.per100g.kcal)} kcal/100 g</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {scanning && (
        <ScanOverlay onClose={() => setScanning(false)}>
          <ScanView onFound={handleFound} />
        </ScanOverlay>
      )}
    </div>
  );
}

function FoodDetail({ food, justScanned, onClose }: { food: PickedFood; justScanned: boolean; onClose: () => void }) {
  const rows = [
    ["Énergie", `${r(food.per100g.kcal)} kcal`],
    ["Protéines", `${food.per100g.proteinG} g`],
    ["Glucides", `${food.per100g.carbG} g`],
    ["Lipides", `${food.per100g.fatG} g`],
    ["Fibres", `${food.per100g.fiberG} g`],
  ];
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200 dark:bg-neutral-900 dark:ring-emerald-500/30">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {justScanned && (
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check size={13} /> Enregistré dans la base
            </div>
          )}
          <div className="font-semibold text-neutral-800 dark:text-neutral-100">{food.name}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={16} />
        </button>
      </div>
      <p className="mt-2 text-xs font-medium text-neutral-500">Pour 100 g</p>
      <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="font-medium text-neutral-700 dark:text-neutral-200">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
