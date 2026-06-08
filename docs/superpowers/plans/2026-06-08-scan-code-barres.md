# Scan code-barres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scanner le code-barres d'un produit (ou saisir le code) pour récupérer ses macros sur OpenFoodFacts et l'ajouter au repas du jour sélectionné.

**Architecture:** Le code-barres est décodé côté client (`@zxing/browser`, import dynamique, caméra arrière) ou saisi à la main. Une server action interroge OpenFoodFacts, upsert une `FoodReference` (`off-<code>`, source `openfoodfacts`) et renvoie ses macros. Un aperçu permet de confirmer la quantité, puis l'ajout réutilise l'action générique `addFoodByReference` (ex-`addRecentFood`).

**Tech Stack:** Next.js 15 (server actions), Prisma 6, Zod, React 19, `@zxing/browser`, OpenFoodFacts API v2, Vitest, Tailwind, lucide-react.

---

## File Structure

- `src/lib/openfoodfacts.ts` — **créer**. `mapOffProduct` (pur) + `fetchOffProduct` (réseau).
- `src/lib/__tests__/openfoodfacts.test.ts` — **créer**. Tests de `mapOffProduct`.
- `prisma/schema.prisma` — **modifier**. Ajouter `openfoodfacts` à l'enum `FoodSource` (+ migration).
- `src/lib/meal.ts` — **modifier**. Exclure les refs OFF du pool de matching texte.
- `src/app/(app)/actions.ts` — **modifier**. Renommer `addRecentFood` → `addFoodByReference`.
- `src/components/RecentChips.tsx` — **modifier**. Mettre à jour l'import.
- `src/app/(app)/scan/actions.ts` — **créer**. `lookupBarcode`.
- `src/components/BarcodeScanner.tsx` — **créer**. Overlay (saisie manuelle + aperçu + ajout, puis caméra).
- `src/components/MealScanButton.tsx` — **créer**. Bouton scan par repas.
- `src/app/(app)/page.tsx` — **modifier**. Rendre le bouton scan dans chaque repas.
- `package.json` — **modifier**. Dépendance `@zxing/browser`.

**Note tests :** le projet ne teste que des fonctions pures. Task 1 est en TDD complet. Le reste (migration, actions Prisma, composants client, caméra) se vérifie par `npx tsc --noEmit`, `npm test`, et la saisie manuelle du code (chemin sans caméra). Chaque task compile indépendamment.

**Note migration prod :** l'ajout de valeur d'enum crée une migration locale (Task 2). Pour la prod, exécuter `npx prisma migrate deploy` contre la base de prod au moment du déploiement (étape ops, hors code).

---

## Task 1: Mapping OpenFoodFacts (pur) + fetch

**Files:**
- Create: `src/lib/openfoodfacts.ts`
- Test: `src/lib/__tests__/openfoodfacts.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/lib/__tests__/openfoodfacts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mapOffProduct } from "@/lib/openfoodfacts";

const full = {
  status: 1,
  product: {
    product_name: "Yaourt nature",
    brands: "Danone, Activia",
    serving_quantity: 125,
    nutriments: {
      "energy-kcal_100g": 60,
      "proteins_100g": 4,
      "carbohydrates_100g": 5,
      "fat_100g": 3,
      "fiber_100g": 0.5,
    },
  },
};

describe("mapOffProduct", () => {
  it("produit complet → found avec marque, macros et portion", () => {
    const r = mapOffProduct(full);
    expect(r).toEqual({
      found: true,
      name: "Danone — Yaourt nature",
      per100g: { kcal: 60, proteinG: 4, carbG: 5, fatG: 3, fiberG: 0.5 },
      servingG: 125,
    });
  });

  it("status 0 → found:false", () => {
    expect(mapOffProduct({ status: 0 })).toEqual({ found: false });
  });

  it("null → found:false", () => {
    expect(mapOffProduct(null)).toEqual({ found: false });
  });

  it("nutriment manquant → 0", () => {
    const r = mapOffProduct({
      status: 1,
      product: { product_name: "Pain", nutriments: { "energy-kcal_100g": 250 } },
    });
    expect(r).toEqual({
      found: true,
      name: "Pain",
      per100g: { kcal: 250, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 },
      servingG: null,
    });
  });

  it("serving_quantity absent ou 0 → null", () => {
    const r = mapOffProduct({
      status: 1,
      product: { product_name: "X", serving_quantity: 0, nutriments: {} },
    });
    expect(r.found && r.servingG).toBe(null);
  });

  it("sans marque → pas de préfixe", () => {
    const r = mapOffProduct({ status: 1, product: { product_name: "Tofu", nutriments: {} } });
    expect(r.found && r.name).toBe("Tofu");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/lib/__tests__/openfoodfacts.test.ts`
Expected: FAIL — `mapOffProduct` non exporté.

- [ ] **Step 3: Créer `src/lib/openfoodfacts.ts`**

```ts
import type { Per100g } from "@/lib/macros";

export type ScanLookupResult =
  | { found: false }
  | { found: true; name: string; per100g: Per100g; servingG: number | null };

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function buildName(name: string, brands: unknown): string {
  if (typeof brands === "string" && brands.trim()) {
    return `${brands.split(",")[0].trim()} — ${name}`;
  }
  return name;
}

/** Transforme une réponse OpenFoodFacts en macros pour 100 g (champs manquants → 0). */
export function mapOffProduct(json: unknown): ScanLookupResult {
  const j = json as { status?: number; product?: Record<string, unknown> } | null;
  const product = j?.product;
  const name = product?.["product_name"];
  if (!j || j.status !== 1 || !product || typeof name !== "string" || !name.trim()) {
    return { found: false };
  }
  const n = (product["nutriments"] ?? {}) as Record<string, unknown>;
  const serving = num(product["serving_quantity"]);
  return {
    found: true,
    name: buildName(name.trim(), product["brands"]),
    per100g: {
      kcal: num(n["energy-kcal_100g"]),
      proteinG: num(n["proteins_100g"]),
      carbG: num(n["carbohydrates_100g"]),
      fatG: num(n["fat_100g"]),
      fiberG: num(n["fiber_100g"]),
    },
    servingG: serving > 0 ? serving : null,
  };
}

/** Interroge l'API OpenFoodFacts v2. Retourne le JSON parsé, ou null sur erreur. */
export async function fetchOffProduct(code: string): Promise<unknown> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_quantity`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "macronaut/1.0" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/lib/__tests__/openfoodfacts.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/openfoodfacts.ts src/lib/__tests__/openfoodfacts.test.ts
git commit -m "feat: mapping et fetch OpenFoodFacts"
```

---

## Task 2: Enum `FoodSource.openfoodfacts` + exclusion matching

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/meal.ts`

Prérequis : la base de dev doit tourner (DATABASE_URL = `localhost:5433`). Si elle est inaccessible, rapporter BLOCKED.

- [ ] **Step 1: Ajouter la valeur d'enum**

In `prisma/schema.prisma`, change:

```prisma
enum FoodSource {
  ciqual
  ai
  manual
}
```

to:

```prisma
enum FoodSource {
  ciqual
  ai
  manual
  openfoodfacts
}
```

- [ ] **Step 2: Créer et appliquer la migration**

Run: `npx prisma migrate dev --name add_openfoodfacts_source`
Expected: migration créée sous `prisma/migrations/`, appliquée, client régénéré sans erreur.

- [ ] **Step 3: Exclure les refs OFF du pool de matching texte**

In `src/lib/meal.ts`, change:

```ts
    const pool = item.isGeneric ? refs : refs.filter((r) => r.source === "manual");
```

to:

```ts
    const pool = item.isGeneric
      ? refs.filter((r) => r.source !== "openfoodfacts")
      : refs.filter((r) => r.source === "manual");
```

- [ ] **Step 4: Vérifier typecheck + tests**

Run: `npx tsc --noEmit && npm test`
Expected: aucune erreur ; tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/meal.ts
git commit -m "feat: source FoodReference openfoodfacts (+ exclusion matching texte)"
```

---

## Task 3: Renommer `addRecentFood` → `addFoodByReference`

**Files:**
- Modify: `src/app/(app)/actions.ts`
- Modify: `src/components/RecentChips.tsx`

L'action d'ajout par référence devient générique (récents + scan). Renommage pur, comportement inchangé.

- [ ] **Step 1: Renommer dans `actions.ts`**

In `src/app/(app)/actions.ts`, change:

```ts
export async function addRecentFood(
```

to:

```ts
export async function addFoodByReference(
```

(La constante `recentSchema` juste au-dessus garde son nom : ne pas la renommer.)

- [ ] **Step 2: Mettre à jour `RecentChips.tsx`**

In `src/components/RecentChips.tsx`, change the import:

```tsx
import { addRecentFood, type MealState } from "@/app/(app)/actions";
```

to:

```tsx
import { addFoodByReference, type MealState } from "@/app/(app)/actions";
```

and the `useActionState` call inside `RecentChip`:

```tsx
  const [, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addFoodByReference,
    undefined,
  );
```

- [ ] **Step 3: Vérifier typecheck + tests**

Run: `npx tsc --noEmit && npm test`
Expected: aucune erreur (plus aucune référence à `addRecentFood`) ; tests verts.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/actions.ts" src/components/RecentChips.tsx
git commit -m "refactor: addRecentFood → addFoodByReference (action partagée)"
```

---

## Task 4: Server action `lookupBarcode`

**Files:**
- Create: `src/app/(app)/scan/actions.ts`

- [ ] **Step 1: Créer `src/app/(app)/scan/actions.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { fetchOffProduct, mapOffProduct } from "@/lib/openfoodfacts";
import type { Per100g } from "@/lib/macros";

export type LookupState =
  | { ok: true; referenceId: string; name: string; per100g: Per100g; servingG: number | null }
  | { ok: false; error: string };

/** Cherche un produit par code-barres sur OpenFoodFacts et upsert sa référence. */
export async function lookupBarcode(code: string): Promise<LookupState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const clean = code.trim();
  if (!/^\d{6,14}$/.test(clean)) return { ok: false, error: "Code invalide." };

  const mapped = mapOffProduct(await fetchOffProduct(clean));
  if (!mapped.found) return { ok: false, error: "Produit introuvable." };

  const ref = await prisma.foodReference.upsert({
    where: { ciqualId: `off-${clean}` },
    update: { name: mapped.name, ...mapped.per100g, source: "openfoodfacts" },
    create: { ciqualId: `off-${clean}`, name: mapped.name, ...mapped.per100g, source: "openfoodfacts" },
  });

  return {
    ok: true,
    referenceId: ref.id,
    name: mapped.name,
    per100g: mapped.per100g,
    servingG: mapped.servingG,
  };
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/scan/actions.ts"
git commit -m "feat: action lookupBarcode (OpenFoodFacts → FoodReference)"
```

---

## Task 5: `BarcodeScanner` — cœur (saisie manuelle + aperçu + ajout)

**Files:**
- Create: `src/components/BarcodeScanner.tsx`

Version sans caméra : saisie manuelle du code, lookup, aperçu, ajout. La caméra est ajoutée en Task 6.

- [ ] **Step 1: Créer `src/components/BarcodeScanner.tsx`**

```tsx
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
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur (le composant n'est pas encore monté ailleurs).

- [ ] **Step 3: Commit**

```bash
git add src/components/BarcodeScanner.tsx
git commit -m "feat: BarcodeScanner (saisie manuelle, aperçu, ajout)"
```

---

## Task 6: `BarcodeScanner` — couche caméra (zxing)

**Files:**
- Modify: `package.json` (via npm)
- Modify: `src/components/BarcodeScanner.tsx`

- [ ] **Step 1: Installer la dépendance**

Run: `npm install @zxing/browser`
Expected: `@zxing/browser` ajouté à `package.json`, installé.

- [ ] **Step 2: Ajouter les refs et l'effet caméra**

In `src/components/BarcodeScanner.tsx`, add two refs right after `const busyRef = useRef(false);`:

```tsx
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
```

Then add these two effects right before the existing `useEffect(() => { if (addState?.ok) ...`:

```tsx
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
```

- [ ] **Step 3: Insérer le flux vidéo dans la vue de scan**

In `src/components/BarcodeScanner.tsx`, inside the `{status !== "found" && (` block, add the `<video>` element as the first child of the inner `<div className="flex flex-1 flex-col ...">`, just before the `{status === "looking" && ...}` line:

```tsx
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <video
            ref={videoRef}
            className="aspect-square w-full max-w-xs rounded-2xl bg-black object-cover"
            muted
            playsInline
          />
          {status === "looking" && <p className="text-sm text-white/80">Recherche…</p>}
```

- [ ] **Step 4: Vérifier le typecheck + tests**

Run: `npx tsc --noEmit && npm test`
Expected: aucune erreur ; tests verts.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/BarcodeScanner.tsx
git commit -m "feat: scan caméra via @zxing/browser"
```

---

## Task 7: `MealScanButton` + câblage `page.tsx`

**Files:**
- Create: `src/components/MealScanButton.tsx`
- Modify: `src/app/(app)/page.tsx`

- [ ] **Step 1: Créer `src/components/MealScanButton.tsx`**

```tsx
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
```

- [ ] **Step 2: Importer dans `page.tsx`**

In `src/app/(app)/page.tsx`, add next to the other component imports:

```tsx
import { MealScanButton } from "@/components/MealScanButton";
```

- [ ] **Step 3: Rendre le bouton dans chaque repas**

In `src/app/(app)/page.tsx`, replace:

```tsx
              <MealInput mealType={m.type} date={dateParam} />
              <RecentChips mealType={m.type} date={dateParam} recents={recents.get(m.type) ?? []} />
```

with:

```tsx
              <MealInput mealType={m.type} date={dateParam} />
              <MealScanButton mealType={m.type} date={dateParam} />
              <RecentChips mealType={m.type} date={dateParam} recents={recents.get(m.type) ?? []} />
```

- [ ] **Step 4: Vérifier typecheck + build + tests**

Run: `npx tsc --noEmit && npm test`
Expected: aucune erreur ; tests verts.

- [ ] **Step 5: Vérification manuelle (chemin sans caméra)**

Lancer `npm run dev`, se connecter. Sous un repas, cliquer « Scanner un produit » : l'overlay s'ouvre. Saisir un code-barres réel (ex. `3017620422003`, Nutella) dans le champ manuel → OK : l'aperçu affiche le nom + macros/100 g + quantité par défaut. Saisir une quantité et « Ajouter » → l'overlay se ferme et le produit apparaît dans le repas. Saisir un code bidon (`0000000000000`) → « Produit introuvable. » + « Réessayer ». (La caméra se teste sur appareil réel en HTTPS, donc en prod.)

- [ ] **Step 6: Commit**

```bash
git add src/components/MealScanButton.tsx "src/app/(app)/page.tsx"
git commit -m "feat: bouton scan par repas"
```

---

## Self-Review

**Spec coverage :**
- `mapOffProduct` / `fetchOffProduct` → Task 1.
- Enum `openfoodfacts` + migration → Task 2 ; exclusion matching texte → Task 2 Step 3.
- Rename action partagée → Task 3.
- `lookupBarcode` (fetch + upsert `off-<code>`) → Task 4.
- Aperçu + quantité (défaut `servingG ?? 100`) + ajout via `addFoodByReference` → Task 5.
- Saisie manuelle + secours → Task 5 (manuel) ; caméra `@zxing/browser` import dynamique + `facingMode environment` + arrêt propre → Task 6.
- Bouton scan par repas + câblage jour sélectionné → Task 7.
- Cas limites : introuvable (Task 4 → message Task 5), caméra refusée → message + manuel (Task 6 catch), macros manquantes → 0 (Task 1 `num`), code illisible → scan continue (busyRef, Task 5), upsert idempotent (Task 4).
- Tests `mapOffProduct` → Task 1.

**Placeholder scan :** aucun TODO/TBD ; code complet partout.

**Type consistency :** `ScanLookupResult` (Task 1) et `LookupState` (Task 4) cohérents ; `Per100g` (de `@/lib/macros`) réutilisé. `lookupBarcode(code): Promise<LookupState>` (Task 4) appelé en Task 5 ; `Found = Extract<LookupState, {ok:true}>` aligne `referenceId/name/per100g/servingG`. `addFoodByReference` (Task 3) consommé en Task 5 via `useActionState`, champs `referenceId/mealType/date/quantityG` identiques à son schéma (`recentSchema` + champ `date`). `BarcodeScanner({mealType,date,onClose})` (Task 5) appelé par `MealScanButton` (Task 7) avec `date={dateParam}` (string). `controlsRef`/`videoRef`/`busyRef` (Task 6) cohérents avec `handleCode`/`status` définis en Task 5.
