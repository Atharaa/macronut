"use client";

import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";

export function MealScanButton({ mealType, date }: { mealType: string; date: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Scanner un code-barres"
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
      >
        <ScanBarcode size={16} />
        Scanner un produit
      </button>
      {open && <BarcodeScanner mealType={mealType} date={date} onClose={() => setOpen(false)} />}
    </>
  );
}
