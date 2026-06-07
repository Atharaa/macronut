# Aliments récents — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proposer sous chaque repas une rangée de chips d'aliments récemment consommés, ré-ajoutables en un tap avec la dernière quantité utilisée.

**Architecture:** Aucune nouvelle table. Une fonction pure `buildRecents` dérive les récents (références distinctes par type de repas, triées par récence) à partir des repas des 30 derniers jours déjà chargés dans `page.tsx`. Une server action `addRecentFood` recrée un `FoodItem` du jour à partir d'une `FoodReference` et d'une quantité. Un composant client `RecentChips` rend les chips (un `<form>` par chip).

**Tech Stack:** Next.js (App Router, server actions), Prisma, Zod, React `useActionState`, Vitest, Tailwind, lucide-react.

---

## File Structure

- `src/lib/recents.ts` — **créer**. Fonction pure `buildRecents` + types `RecentFood`. Aucune dépendance Prisma/DB (testable isolément).
- `src/lib/__tests__/recents.test.ts` — **créer**. Tests unitaires de `buildRecents`.
- `src/app/(app)/actions.ts` — **modifier**. Ajouter la server action `addRecentFood`.
- `src/components/RecentChips.tsx` — **créer**. Composant client des chips.
- `src/app/(app)/page.tsx` — **modifier**. Charger les repas des 30 derniers jours, dériver les récents, rendre `RecentChips` dans chaque section de repas.

**Note sur les tests :** le projet ne teste que des fonctions pures (`src/lib/__tests__`, plus un test de rendu `BottomNav`). Il n'existe pas de harnais d'intégration Prisma/server actions. On applique donc le TDD complet sur `buildRecents` (Task 1) et on vérifie les Tasks 2-4 par typecheck (`npx tsc --noEmit`) + lancement de l'app, conformément au pattern existant.

---

## Task 1: Fonction pure `buildRecents`

**Files:**
- Create: `src/lib/recents.ts`
- Test: `src/lib/__tests__/recents.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/lib/__tests__/recents.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildRecents } from "@/lib/recents";

const d = (iso: string) => new Date(iso);

describe("buildRecents", () => {
  it("déduplique par référence et garde la quantité la plus récente", () => {
    const recents = buildRecents([
      { type: "breakfast", date: d("2026-06-05"), items: [{ referenceId: "yog", name: "Yaourt", quantityG: 100 }] },
      { type: "breakfast", date: d("2026-06-07"), items: [{ referenceId: "yog", name: "Yaourt", quantityG: 125 }] },
    ]);
    const list = recents.get("breakfast")!;
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({ referenceId: "yog", name: "Yaourt", quantityG: 125 });
  });

  it("filtre par type de repas", () => {
    const recents = buildRecents([
      { type: "breakfast", date: d("2026-06-07"), items: [{ referenceId: "yog", name: "Yaourt", quantityG: 125 }] },
      { type: "dinner", date: d("2026-06-07"), items: [{ referenceId: "pasta", name: "Pâtes", quantityG: 200 }] },
    ]);
    expect(recents.get("breakfast")!.map((r) => r.referenceId)).toEqual(["yog"]);
    expect(recents.get("dinner")!.map((r) => r.referenceId)).toEqual(["pasta"]);
  });

  it("ordonne par récence décroissante", () => {
    const recents = buildRecents([
      { type: "lunch", date: d("2026-06-01"), items: [{ referenceId: "a", name: "A", quantityG: 50 }] },
      { type: "lunch", date: d("2026-06-07"), items: [{ referenceId: "b", name: "B", quantityG: 50 }] },
    ]);
    expect(recents.get("lunch")!.map((r) => r.referenceId)).toEqual(["b", "a"]);
  });

  it("exclut les items sans référence (referenceId null)", () => {
    const recents = buildRecents([
      { type: "dinner", date: d("2026-06-07"), items: [{ referenceId: null, name: "Plat maison", quantityG: 300 }] },
    ]);
    expect(recents.get("dinner") ?? []).toEqual([]);
  });

  it("limite à 8 par type de repas", () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ referenceId: `r${i}`, name: `R${i}`, quantityG: 10 }));
    const recents = buildRecents([{ type: "lunch", date: d("2026-06-07"), items }]);
    expect(recents.get("lunch")!).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/lib/__tests__/recents.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/recents"` (le module n'existe pas).

- [ ] **Step 3: Écrire l'implémentation minimale**

Create `src/lib/recents.ts`:

```ts
import type { MealType } from "@prisma/client";

export interface RecentFood {
  referenceId: string;
  name: string;
  quantityG: number;
}

interface RecentMealInput {
  type: MealType;
  date: Date;
  items: { referenceId: string | null; name: string; quantityG: number }[];
}

const MAX_RECENTS = 8;

/**
 * Dérive les aliments récents par type de repas à partir d'un historique de repas.
 * Déduplique par référence (première occurrence = plus récente), exclut les items
 * sans référence, conserve la dernière quantité utilisée, limite à 8 par repas.
 */
export function buildRecents(meals: RecentMealInput[]): Map<MealType, RecentFood[]> {
  const byType = new Map<MealType, RecentFood[]>();
  const seen = new Map<MealType, Set<string>>();
  const sorted = [...meals].sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const meal of sorted) {
    let list = byType.get(meal.type);
    if (!list) {
      list = [];
      byType.set(meal.type, list);
    }
    let seenSet = seen.get(meal.type);
    if (!seenSet) {
      seenSet = new Set();
      seen.set(meal.type, seenSet);
    }
    for (const item of meal.items) {
      if (item.referenceId == null || seenSet.has(item.referenceId) || list.length >= MAX_RECENTS) {
        continue;
      }
      seenSet.add(item.referenceId);
      list.push({ referenceId: item.referenceId, name: item.name, quantityG: item.quantityG });
    }
  }

  return byType;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/lib/__tests__/recents.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recents.ts src/lib/__tests__/recents.test.ts
git commit -m "feat: dérivation des aliments récents par type de repas"
```

---

## Task 2: Server action `addRecentFood`

**Files:**
- Modify: `src/app/(app)/actions.ts`

Toutes les dépendances nécessaires sont déjà importées dans ce fichier (`z`, `revalidatePath`, `prisma`, `getCurrentUser`, `startOfToday`, `scaleMacros`, `numPositive`) ainsi que le type `MealState`.

- [ ] **Step 1: Ajouter le schéma et l'action**

Add at the end of `src/app/(app)/actions.ts`:

```ts
const recentSchema = z.object({
  referenceId: z.string().min(1),
  mealType: z.enum(["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]),
  quantityG: numPositive,
});

/**
 * Ré-ajout en un tap d'un aliment récent : recrée un FoodItem du jour à partir
 * d'une FoodReference (source de vérité des macros) et de la quantité fournie.
 */
export async function addRecentFood(
  _prev: MealState | undefined,
  formData: FormData,
): Promise<MealState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié." };

  const parsed = recentSchema.safeParse({
    referenceId: formData.get("referenceId"),
    mealType: formData.get("mealType"),
    quantityG: formData.get("quantityG"),
  });
  if (!parsed.success) return { error: "Données invalides." };

  const ref = await prisma.foodReference.findUnique({ where: { id: parsed.data.referenceId } });
  if (!ref) return { error: "Aliment introuvable." };

  const meal = await prisma.meal.upsert({
    where: {
      userId_date_type: { userId: user.id, date: startOfToday(), type: parsed.data.mealType },
    },
    update: {},
    create: { userId: user.id, date: startOfToday(), type: parsed.data.mealType },
  });

  const m = scaleMacros(ref, parsed.data.quantityG);
  await prisma.foodItem.create({
    data: { mealId: meal.id, referenceId: ref.id, name: ref.name, quantityG: parsed.data.quantityG, ...m },
  });

  revalidatePath("/");
  return { ok: true };
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/actions.ts"
git commit -m "feat: action addRecentFood (ré-ajout d'un aliment récent)"
```

---

## Task 3: Composant `RecentChips`

**Files:**
- Create: `src/components/RecentChips.tsx`

Le type `RecentFood` est importé depuis `@/lib/recents` (source unique de vérité).

- [ ] **Step 1: Créer le composant**

Create `src/components/RecentChips.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addRecentFood, type MealState } from "@/app/(app)/actions";
import type { RecentFood } from "@/lib/recents";

export function RecentChips({ mealType, recents }: { mealType: string; recents: RecentFood[] }) {
  if (recents.length === 0) return null;
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
      {recents.map((food) => (
        <RecentChip key={food.referenceId} mealType={mealType} food={food} />
      ))}
    </div>
  );
}

function RecentChip({ mealType, food }: { mealType: string; food: RecentFood }) {
  const [, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addRecentFood,
    undefined,
  );
  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="referenceId" value={food.referenceId} />
      <input type="hidden" name="mealType" value={mealType} />
      <input type="hidden" name="quantityG" value={food.quantityG} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 active:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {food.name}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecentChips.tsx
git commit -m "feat: composant RecentChips (chips d'aliments récents)"
```

---

## Task 4: Câblage dans `page.tsx`

**Files:**
- Modify: `src/app/(app)/page.tsx`

- [ ] **Step 1: Ajouter les imports**

In `src/app/(app)/page.tsx`, after the existing import of `MacroBar` (around line 9), add:

```tsx
import { RecentChips } from "@/components/RecentChips";
import { buildRecents } from "@/lib/recents";
```

- [ ] **Step 2: Charger les repas des 30 derniers jours et dériver les récents**

In `JourneePage`, replace the existing data-loading block:

```tsx
  const today = startOfToday();
  const [meals, activities] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: user.id, date: today },
      include: { items: { include: { reference: true } } },
    }),
    prisma.activityEntry.findMany({ where: { userId: user.id, date: today } }),
  ]);
```

with:

```tsx
  const today = startOfToday();
  const since = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [meals, activities, recentMeals] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: user.id, date: today },
      include: { items: { include: { reference: true } } },
    }),
    prisma.activityEntry.findMany({ where: { userId: user.id, date: today } }),
    prisma.meal.findMany({
      where: { userId: user.id, date: { gte: since } },
      include: { items: { include: { reference: true } } },
    }),
  ]);
  const recents = buildRecents(recentMeals);
```

- [ ] **Step 3: Rendre `RecentChips` sous `MealInput`**

In the meal section, replace the line:

```tsx
              <MealInput mealType={m.type} />
```

with:

```tsx
              <MealInput mealType={m.type} />
              <RecentChips mealType={m.type} recents={recents.get(m.type) ?? []} />
```

- [ ] **Step 4: Vérifier le typecheck et le build**

Run: `npx tsc --noEmit && npm test`
Expected: typecheck sans erreur, tous les tests passent (dont les 5 de `recents`).

- [ ] **Step 5: Vérification manuelle**

Lancer `npm run dev`, se connecter, ajouter un aliment à un repas, recharger : une chip avec le nom de l'aliment apparaît sous ce repas. Taper la chip → l'aliment est ré-ajouté au repas du jour avec la même quantité. Vérifier qu'une chip de petit-déjeuner n'apparaît pas sous le dîner.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/page.tsx"
git commit -m "feat: afficher les aliments récents sous chaque repas"
```

---

## Self-Review

**Spec coverage :**
- Source de données sans nouveau modèle → Task 1 (`buildRecents`) + Task 4 (requête 30 j).
- Dernière quantité utilisée → Task 1 (dédup garde la plus récente) + Task 2 (`scaleMacros` avec cette quantité).
- Filtrage par type de repas → Task 1 + Task 4 (`recents.get(m.type)`).
- Affichage chips sous `MealInput` → Task 3 + Task 4 Step 3.
- Action 1-tap (upsert repas du jour, recalcul macros) → Task 2.
- Cas limites (aucun récent, référence orpheline, items null, doublons) → Task 1 (null), Task 2 (référence introuvable), Task 3 (liste vide → rien rendu), doublons autorisés (aucune dédup à l'ajout).
- Tests `buildRecents` (dédup, filtre, ordre, exclusion null, top 8) → Task 1.

**Placeholder scan :** aucun TODO/TBD ; tout le code est fourni.

**Type consistency :** `RecentFood { referenceId, name, quantityG }` défini en Task 1, importé tel quel en Task 3. `buildRecents` retourne `Map<MealType, RecentFood[]>`, consommé via `.get(m.type) ?? []` en Task 4. `addRecentFood` signature `(prev: MealState | undefined, formData) => Promise<MealState>` cohérente avec son usage `useActionState` en Task 3. Champs de formulaire (`referenceId`, `mealType`, `quantityG`) identiques entre Task 2 (schéma) et Task 3 (inputs cachés).
