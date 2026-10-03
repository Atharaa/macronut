"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { lookupBarcode, type LookupState } from "@/app/(app)/scan/actions";

export type FoundProduct = Extract<LookupState, { ok: true }>;
type Status = "scanning" | "looking" | "error";

export function ScanOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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
      {children}
    </div>
  );
}

/** Caméra + saisie manuelle du code-barres ; appelle onFound avec le produit trouvé. */
export function ScanView({ onFound }: { onFound: (product: FoundProduct) => void }) {
  const busyRef = useRef(false);
  const onFoundRef = useRef(onFound);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<Status>("scanning");
  const [error, setError] = useState<string | null>(null);
  onFoundRef.current = onFound;

  async function handleCode(code: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("looking");
    setError(null);
    const res = await lookupBarcode(code);
    if (res.ok) {
      onFoundRef.current(res);
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

  return (
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
  );
}
