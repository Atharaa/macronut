"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { lookupBarcode, type LookupState } from "@/app/(app)/scan/actions";
import { addFoodByReference, type MealState } from "@/app/(app)/actions";

type Found = Extract<LookupState, { ok: true }>;
type Status = "scanning" | "looking" | "error" | "found";

export function BarcodeScanner({
  mealType,
  date,
  onClose,
}: {
  mealType: string;
  date: string;
  onClose: () => void;
}) {
  const busyRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<Status>("scanning");
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Found | null>(null);
  const [qty, setQty] = useState("100");
  const [addState, addAction, adding] = useActionState<MealState | undefined, FormData>(
    addFoodByReference,
    undefined,
  );

  async function handleCode(code: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("looking");
    setError(null);
    const res = await lookupBarcode(code);
    if (res.ok) {
      setProduct(res);
      setQty(String(res.servingG ?? 100));
      setStatus("found");
    } else {
      setError(res.error);
      setStatus("error");
      busyRef.current = false;
    }
  }

  function retry() {
    setStatus("scanning");
    setError(null);
    busyRef.current = false;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        if (!videoRef.current) return;
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            if (result && !cancelled) handleCode(result.getText());
          },
        );
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch {
        if (!cancelled) setError("Caméra indisponible. Saisis le code à la main.");
      }
    })();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (status !== "scanning") controlsRef.current?.stop();
  }, [status]);

  useEffect(() => {
    if (addState?.ok) onClose();
  }, [addState, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 backdrop-blur">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
      >
        <X size={22} />
      </button>

      {status !== "found" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <video
            ref={videoRef}
            className="aspect-square w-full max-w-xs rounded-2xl bg-black object-cover"
            muted
            playsInline
          />
          {status === "looking" && <p className="text-sm text-white/80">Recherche…</p>}
          {error && (
            <div className="flex flex-col items-center gap-2">
              <p className="px-4 text-center text-sm text-rose-300">{error}</p>
              <button type="button" onClick={retry} className="text-sm font-medium text-emerald-400">
                Réessayer
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) handleCode(manual.trim());
            }}
            className="flex w-full max-w-xs items-center gap-2"
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              inputMode="numeric"
              placeholder="Code-barres"
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/50"
            />
            <button type="submit" className="rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white">
              OK
            </button>
          </form>
        </div>
      )}

      {status === "found" && product && (
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
    </div>
  );
}
