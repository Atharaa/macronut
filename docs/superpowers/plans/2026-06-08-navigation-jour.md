# Navigation par jour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre de consulter et logger n'importe quel jour (pas seulement aujourd'hui) sur les écrans Journée et Activité, via un sélecteur de date dont l'état vit dans l'URL (`?d=YYYY-MM-DD`).

**Architecture:** La date sélectionnée est un searchParam d'URL lu par les pages serveur (Next 15, `searchParams` est un `Promise`). Des helpers date purs gèrent parsing/clamp/format. Un composant client `DaySelector` navigue par `<Link>`/calendrier natif. Les formulaires portent un champ caché `date` et les actions d'ajout le parsent (clamp du futur via `parseDateParam`), avec repli sur aujourd'hui. La barre de navigation propage le `?d` entre Journée et Activité.

**Tech Stack:** Next.js 15 (App Router, server components, server actions), Prisma, Zod, React, Vitest, Tailwind, lucide-react.

---

## File Structure

- `src/lib/date.ts` — **modifier**. Ajouter `parseDateParam`, `toDateParam`, `addDays`, `isToday` (purs, testés).
- `src/lib/__tests__/date.test.ts` — **créer**. Tests des helpers.
- `src/app/(app)/actions.ts` — **modifier**. `addMeal` et `addRecentFood` acceptent un champ `date`.
- `src/app/(app)/activite/actions.ts` — **modifier**. `addActivity` accepte un champ `date`.
- `src/components/DaySelector.tsx` — **créer**. Sélecteur de jour (client).
- `src/components/MealInput.tsx` — **modifier**. Prop `date` + champ caché.
- `src/components/RecentChips.tsx` — **modifier**. Prop `date` + champ caché.
- `src/components/ActivityForm.tsx` — **modifier**. Prop `date` + champ caché.
- `src/app/(app)/page.tsx` — **modifier**. `searchParams`, date sélectionnée, rendu `DaySelector`.
- `src/app/(app)/activite/page.tsx` — **modifier**. Idem + neutraliser les libellés « du jour ».
- `src/components/BottomNav.tsx` — **modifier**. Propager `?d` sur Journée et Activité.

**Note tests :** le projet ne teste que des fonctions pures. Task 1 est en TDD complet. Les autres tasks (actions, composants client, pages serveur) n'ont pas de harnais d'intégration : vérification par `npx tsc --noEmit`, `npm test` (non-régression) et lancement manuel. Chaque task compile indépendamment.

---

## Task 1: Helpers date

**Files:**
- Modify: `src/lib/date.ts`
- Test: `src/lib/__tests__/date.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/lib/__tests__/date.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseDateParam, toDateParam, addDays, isToday, startOfToday } from "@/lib/date";

describe("toDateParam", () => {
  it("formate en YYYY-MM-DD (UTC)", () => {
    expect(toDateParam(new Date("2026-06-05T00:00:00Z"))).toBe("2026-06-05");
    expect(toDateParam(new Date("2026-01-09T00:00:00Z"))).toBe("2026-01-09");
  });
});

describe("addDays", () => {
  it("ajoute et retranche des jours, passage de mois", () => {
    expect(toDateParam(addDays(new Date("2026-01-31T00:00:00Z"), 1))).toBe("2026-02-01");
    expect(toDateParam(addDays(new Date("2026-03-01T00:00:00Z"), -1))).toBe("2026-02-28");
    expect(toDateParam(addDays(new Date("2026-06-30T00:00:00Z"), -30))).toBe("2026-05-31");
  });
});

describe("isToday", () => {
  it("vrai pour aujourd'hui, faux sinon", () => {
    expect(isToday(startOfToday())).toBe(true);
    expect(isToday(new Date("2020-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("parseDateParam", () => {
  it("date passée valide → ce jour", () => {
    expect(toDateParam(parseDateParam("2020-01-01"))).toBe("2020-01-01");
  });
  it("date future → aujourd'hui (clamp)", () => {
    expect(parseDateParam("2999-01-01").getTime()).toBe(startOfToday().getTime());
  });
  it("chaîne invalide → aujourd'hui", () => {
    expect(parseDateParam("pas-une-date").getTime()).toBe(startOfToday().getTime());
  });
  it("undefined → aujourd'hui", () => {
    expect(parseDateParam(undefined).getTime()).toBe(startOfToday().getTime());
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/lib/__tests__/date.test.ts`
Expected: FAIL — `parseDateParam`/`toDateParam`/`addDays`/`isToday` non exportés.

- [ ] **Step 3: Ajouter les helpers**

Append to `src/lib/date.ts` (after the existing `startOfDay`):

```ts
/** Décale une date d'un nombre de jours (UTC). */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
}

/** Formate une date en "YYYY-MM-DD" (composants UTC). */
export function toDateParam(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Vrai si la date tombe aujourd'hui (comparaison à minuit UTC). */
export function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfToday().getTime();
}

/**
 * Parse un paramètre d'URL en date (minuit UTC). Repli sur aujourd'hui si absent
 * ou invalide ; clampe au jour courant (pas de futur).
 */
export function parseDateParam(value?: string): Date {
  if (!value) return startOfToday();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return startOfToday();
  const day = startOfDay(parsed);
  return day.getTime() > startOfToday().getTime() ? startOfToday() : day;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/lib/__tests__/date.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/date.ts src/lib/__tests__/date.test.ts
git commit -m "feat: helpers date pour la navigation par jour"
```

---

## Task 2: Actions acceptent une date

**Files:**
- Modify: `src/app/(app)/actions.ts`
- Modify: `src/app/(app)/activite/actions.ts`

Les actions lisent un champ caché `date` (format `YYYY-MM-DD`) et le parsent avec `parseDateParam` (clamp du futur + repli aujourd'hui), au lieu d'écrire en dur sur `startOfToday()`.

- [ ] **Step 1: `actions.ts` — remplacer l'import `startOfToday` par `parseDateParam`**

In `src/app/(app)/actions.ts`, change line 8:

```ts
import { startOfToday } from "@/lib/date";
```

to:

```ts
import { parseDateParam } from "@/lib/date";
```

- [ ] **Step 2: `addMeal` — utiliser la date du formulaire**

In `addMeal`, replace this block:

```ts
  const mealType = formData.get("mealType") as MealType | null;
  const text = (formData.get("text") as string | null)?.trim();
  if (!mealType || !MEAL_TYPES.includes(mealType)) return { error: "Repas inconnu." };
  if (!text) return { error: "Saisie vide." };

  try {
    const result = await addFoodsFromText(user.id, startOfToday(), mealType, text);
```

with:

```ts
  const mealType = formData.get("mealType") as MealType | null;
  const text = (formData.get("text") as string | null)?.trim();
  const date = parseDateParam((formData.get("date") as string | null) || undefined);
  if (!mealType || !MEAL_TYPES.includes(mealType)) return { error: "Repas inconnu." };
  if (!text) return { error: "Saisie vide." };

  try {
    const result = await addFoodsFromText(user.id, date, mealType, text);
```

- [ ] **Step 3: `addRecentFood` — utiliser la date du formulaire**

In `addRecentFood`, after the `if (!ref) return ...` line, and replacing the `meal.upsert` block, make it read:

```ts
  const ref = await prisma.foodReference.findUnique({ where: { id: parsed.data.referenceId } });
  if (!ref) return { error: "Aliment introuvable." };

  const date = parseDateParam((formData.get("date") as string | null) || undefined);
  const meal = await prisma.meal.upsert({
    where: {
      userId_date_type: { userId: user.id, date, type: parsed.data.mealType },
    },
    update: {},
    create: { userId: user.id, date, type: parsed.data.mealType },
  });
```

(The two former `date: startOfToday()` occurrences are replaced by `date`.)

- [ ] **Step 4: `activite/actions.ts` — remplacer l'import `startOfToday` par `parseDateParam`**

In `src/app/(app)/activite/actions.ts`, change line 7:

```ts
import { startOfToday } from "@/lib/date";
```

to:

```ts
import { parseDateParam } from "@/lib/date";
```

- [ ] **Step 5: `addActivity` — utiliser la date du formulaire**

In `addActivity`, replace the parse + create section so it reads:

```ts
  const parsed = schema.safeParse({
    type: formData.get("type"),
    value: formData.get("value"),
    sport: formData.get("sport"),
  });
  if (!parsed.success) return { error: "Activité invalide." };

  const date = parseDateParam((formData.get("date") as string | null) || undefined);
  const latest = await getLatestWeight(user.id);
  const weightKg = latest?.weightKg ?? DEFAULT_WEIGHT_KG;
  const isSport = parsed.data.type === "sport";
  const met = isSport ? sportMet(parsed.data.sport) : undefined;
  const estimatedKcal = computeActivityKcal(parsed.data.type, parsed.data.value, weightKg, met);

  await prisma.activityEntry.create({
    data: {
      userId: user.id,
      date,
      type: parsed.data.type,
      name: isSport ? sportLabel(parsed.data.sport) : null,
      value: parsed.data.value,
      estimatedKcal,
    },
  });
```

- [ ] **Step 6: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur (notamment, plus de référence à `startOfToday` dans ces deux fichiers).

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/actions.ts" "src/app/(app)/activite/actions.ts"
git commit -m "feat: les actions d'ajout acceptent une date cible"
```

---

## Task 3: Composant `DaySelector`

**Files:**
- Create: `src/components/DaySelector.tsx`

- [ ] **Step 1: Créer le composant**

Create `src/components/DaySelector.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, toDateParam, isToday, startOfDay, startOfToday } from "@/lib/date";

const arrowCls =
  "flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800";

export function DaySelector({ date, basePath }: { date: string; basePath: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const current = startOfDay(new Date(date));
  const today = isToday(current);
  const todayParam = toDateParam(startOfToday());

  const hrefFor = (d: Date) => {
    const param = toDateParam(d);
    return param === todayParam ? basePath : `${basePath}?d=${param}`;
  };

  const label = today
    ? "Aujourd'hui"
    : new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(current);

  return (
    <div className="relative flex items-center justify-center gap-3 px-1 py-1">
      <Link href={hrefFor(addDays(current, -1))} aria-label="Jour précédent" className={arrowCls}>
        <ChevronLeft size={20} />
      </Link>

      <button
        type="button"
        onClick={() => inputRef.current?.showPicker?.()}
        className="min-w-[9rem] rounded-full px-3 py-1.5 text-center text-sm font-semibold capitalize text-neutral-700 active:bg-neutral-100 dark:text-neutral-200 dark:active:bg-neutral-800"
      >
        {label}
        <input
          ref={inputRef}
          type="date"
          max={todayParam}
          value={toDateParam(current)}
          onChange={(e) => router.push(e.target.value === todayParam ? basePath : `${basePath}?d=${e.target.value}`)}
          className="sr-only"
        />
      </button>

      {today ? (
        <span className="h-9 w-9" />
      ) : (
        <Link href={hrefFor(addDays(current, 1))} aria-label="Jour suivant" className={arrowCls}>
          <ChevronRight size={20} />
        </Link>
      )}

      {!today && (
        <Link
          href={basePath}
          className="absolute right-0 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          Aujourd'hui
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur (le composant n'est pas encore importé ailleurs, c'est normal).

- [ ] **Step 3: Commit**

```bash
git add src/components/DaySelector.tsx
git commit -m "feat: composant DaySelector (navigation par jour)"
```

---

## Task 4: Flux Journée (formulaires + page)

**Files:**
- Modify: `src/components/MealInput.tsx`
- Modify: `src/components/RecentChips.tsx`
- Modify: `src/app/(app)/page.tsx`

- [ ] **Step 1: `MealInput` — prop `date` + champ caché**

In `src/components/MealInput.tsx`, change the signature:

```tsx
export function MealInput({ mealType }: { mealType: string }) {
```

to:

```tsx
export function MealInput({ mealType, date }: { mealType: string; date: string }) {
```

and add the hidden field right after the existing `mealType` hidden input:

```tsx
        <input type="hidden" name="mealType" value={mealType} />
        <input type="hidden" name="date" value={date} />
```

- [ ] **Step 2: `RecentChips` — prop `date` + champ caché**

In `src/components/RecentChips.tsx`, update the public component signature and the chip call:

```tsx
export function RecentChips({ mealType, date, recents }: { mealType: string; date: string; recents: RecentFood[] }) {
  if (recents.length === 0) return null;
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
      {recents.map((food) => (
        <RecentChip key={food.referenceId} mealType={mealType} date={date} food={food} />
      ))}
    </div>
  );
}
```

and update `RecentChip` to accept and emit `date`:

```tsx
function RecentChip({ mealType, date, food }: { mealType: string; date: string; food: RecentFood }) {
  const [, formAction, pending] = useActionState<MealState | undefined, FormData>(
    addRecentFood,
    undefined,
  );
  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="referenceId" value={food.referenceId} />
      <input type="hidden" name="mealType" value={mealType} />
      <input type="hidden" name="date" value={date} />
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

- [ ] **Step 3: `page.tsx` — imports**

In `src/app/(app)/page.tsx`, replace the import line:

```tsx
import { startOfToday } from "@/lib/date";
```

with:

```tsx
import { parseDateParam, toDateParam, addDays } from "@/lib/date";
```

and add, next to the other component imports:

```tsx
import { DaySelector } from "@/components/DaySelector";
```

- [ ] **Step 4: `page.tsx` — signature + date sélectionnée + requêtes**

Change the function signature:

```tsx
export default async function JourneePage() {
```

to:

```tsx
export default async function JourneePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
```

Then replace the data-loading block:

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

with:

```tsx
  const { d } = await searchParams;
  const selectedDate = parseDateParam(d);
  const dateParam = toDateParam(selectedDate);
  const since = addDays(selectedDate, -30);
  const [meals, activities, recentMeals] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: user.id, date: selectedDate },
      include: { items: { include: { reference: true } } },
    }),
    prisma.activityEntry.findMany({ where: { userId: user.id, date: selectedDate } }),
    prisma.meal.findMany({
      where: { userId: user.id, date: { gte: since, lte: selectedDate } },
      include: { items: { include: { reference: true } } },
    }),
  ]);
  const recents = buildRecents(recentMeals);
```

- [ ] **Step 5: `page.tsx` — libellé de date sur le jour sélectionné**

Replace:

```tsx
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
```

with:

```tsx
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selectedDate);
```

- [ ] **Step 6: `page.tsx` — rendre `DaySelector` en haut**

Replace the opening of `<main>`:

```tsx
  return (
    <main className="space-y-4 p-4">
      {/* En-tête dégradé : calories restantes */}
```

with:

```tsx
  return (
    <main className="space-y-4 p-4">
      <DaySelector date={dateParam} basePath="/" />

      {/* En-tête dégradé : calories restantes */}
```

- [ ] **Step 7: `page.tsx` — passer `date` aux formulaires**

Replace:

```tsx
              <MealInput mealType={m.type} />
              <RecentChips mealType={m.type} recents={recents.get(m.type) ?? []} />
```

with:

```tsx
              <MealInput mealType={m.type} date={dateParam} />
              <RecentChips mealType={m.type} date={dateParam} recents={recents.get(m.type) ?? []} />
```

- [ ] **Step 8: Vérifier typecheck + tests**

Run: `npx tsc --noEmit && npm test`
Expected: aucune erreur ; tous les tests passent.

- [ ] **Step 9: Commit**

```bash
git add src/components/MealInput.tsx src/components/RecentChips.tsx "src/app/(app)/page.tsx"
git commit -m "feat: navigation par jour sur la Journée"
```

---

## Task 5: Flux Activité (formulaire + page)

**Files:**
- Modify: `src/components/ActivityForm.tsx`
- Modify: `src/app/(app)/activite/page.tsx`

- [ ] **Step 1: `ActivityForm` — prop `date` + champ caché**

In `src/components/ActivityForm.tsx`, change the signature:

```tsx
export function ActivityForm() {
```

to:

```tsx
export function ActivityForm({ date }: { date: string }) {
```

and add the hidden field as the first child inside the `<form>` (just before `<div className="flex gap-2">`):

```tsx
    <form action={formAction} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <input type="hidden" name="date" value={date} />
      <div className="flex gap-2">
```

- [ ] **Step 2: `activite/page.tsx` — imports**

In `src/app/(app)/activite/page.tsx`, replace:

```tsx
import { startOfToday } from "@/lib/date";
```

with:

```tsx
import { parseDateParam, toDateParam } from "@/lib/date";
import { DaySelector } from "@/components/DaySelector";
```

- [ ] **Step 3: `activite/page.tsx` — signature + date sélectionnée + requête**

Change the signature:

```tsx
export default async function ActivitePage() {
```

to:

```tsx
export default async function ActivitePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
```

Then replace:

```tsx
  const entries = await prisma.activityEntry.findMany({
    where: { userId: user.id, date: startOfToday() },
    orderBy: { id: "desc" },
  });
```

with:

```tsx
  const { d } = await searchParams;
  const selectedDate = parseDateParam(d);
  const dateParam = toDateParam(selectedDate);
  const entries = await prisma.activityEntry.findMany({
    where: { userId: user.id, date: selectedDate },
    orderBy: { id: "desc" },
  });
```

- [ ] **Step 4: `activite/page.tsx` — DaySelector, titre neutre, passer `date`**

Replace this block:

```tsx
    <main className="space-y-4 p-4">
      <h1 className="px-1 text-xl font-bold text-neutral-800 dark:text-neutral-100">Activité du jour</h1>
```

with:

```tsx
    <main className="space-y-4 p-4">
      <DaySelector date={dateParam} basePath="/activite" />
      <h1 className="px-1 text-xl font-bold text-neutral-800 dark:text-neutral-100">Activité</h1>
```

Replace:

```tsx
      <ActivityForm />
```

with:

```tsx
      <ActivityForm date={dateParam} />
```

Replace the empty-state text:

```tsx
            Aucune activité saisie aujourd'hui.
```

with:

```tsx
            Aucune activité saisie.
```

- [ ] **Step 5: Vérifier typecheck + tests**

Run: `npx tsc --noEmit && npm test`
Expected: aucune erreur ; tous les tests passent.

- [ ] **Step 6: Commit**

```bash
git add src/components/ActivityForm.tsx "src/app/(app)/activite/page.tsx"
git commit -m "feat: navigation par jour sur l'Activité"
```

---

## Task 6: Propagation du jour dans la barre de navigation

**Files:**
- Modify: `src/components/BottomNav.tsx`

Quand un jour est sélectionné, les onglets Journée et Activité conservent le `?d` courant ; Poids et Objectif restent des liens nus.

- [ ] **Step 1: Importer `useSearchParams` et propager le param**

In `src/components/BottomNav.tsx`, change the import:

```tsx
import { usePathname } from "next/navigation";
```

to:

```tsx
import { usePathname, useSearchParams } from "next/navigation";
```

Then in `BottomNav`, replace:

```tsx
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-neutral-200/70 bg-white/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/85">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} prefetch className="flex flex-1 justify-center">
          <TabContent active={pathname === href} label={label} Icon={Icon} />
        </Link>
      ))}
    </nav>
  );
}
```

with:

```tsx
export function BottomNav() {
  const pathname = usePathname();
  const d = useSearchParams().get("d");
  const hrefFor = (href: string) =>
    d && (href === "/" || href === "/activite") ? `${href}?d=${d}` : href;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-neutral-200/70 bg-white/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/85">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={hrefFor(href)} prefetch className="flex flex-1 justify-center">
          <TabContent active={pathname === href} label={label} Icon={Icon} />
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Vérification manuelle (toute la feature)**

Lancer `npm run dev`, se connecter. Sur la Journée :
- Le sélecteur affiche « Aujourd'hui ». La flèche suivante est masquée.
- Flèche précédente → l'URL passe à `?d=…`, le libellé devient « lun. 7 juin », les repas/activité affichés sont ceux de ce jour.
- Ajouter un aliment et une activité un jour passé → ils sont enregistrés à cette date (recharger pour confirmer).
- Taper le libellé → calendrier natif, ne propose pas de date future.
- Lien « Aujourd'hui » → retour à l'URL nue.
- Passer à l'onglet Activité : le même jour est conservé (`?d` propagé). Idem retour Journée.

Note : ces pages sont dynamiques (auth/Prisma), donc `useSearchParams` n'impose pas de `Suspense` supplémentaire. Si `npm run build` émettait un avertissement à ce sujet, il serait sans conséquence ici.

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: conserver le jour sélectionné entre Journée et Activité"
```

---

## Self-Review

**Spec coverage :**
- État dans l'URL `?d=` → Task 4/5 (pages lisent `searchParams`).
- Helpers `parseDateParam`/`toDateParam`/`addDays`/`isToday` → Task 1.
- Sélecteur flèches + date cliquable + « Aujourd'hui » + futur masqué → Task 3.
- Futur bloqué (clamp + `max` input + flèche masquée) → Task 1 (`parseDateParam`) + Task 3.
- Date partagée entre onglets → Task 6.
- Écriture rétroactive (`addMeal`, `addRecentFood`, `addActivity`) → Task 2 + champs cachés Task 4/5.
- Actions par id inchangées → non touchées (Task 2 ne les modifie pas).
- Récents fenêtre finissant à `selectedDate` → Task 4 Step 4 (`gte: since, lte: selectedDate`).
- Libellés « du jour » neutralisés sur Activité → Task 5 Step 4.
- Tests des helpers → Task 1.

**Placeholder scan :** aucun TODO/TBD ; tout le code est fourni.

**Type consistency :** `parseDateParam(value?: string): Date`, `toDateParam(date: Date): string`, `addDays(date, n): Date`, `isToday(date): boolean` définis en Task 1, utilisés tels quels en Tasks 2-5. `DaySelector({ date: string, basePath: string })` défini en Task 3, appelé avec `date={dateParam}` (string) en Task 4/5. `dateParam = toDateParam(selectedDate)` (string) passé en prop `date` à `MealInput`/`RecentChips`/`ActivityForm`, qui déclarent tous `date: string`. Champ caché `name="date"` (string `YYYY-MM-DD`) lu par les actions via `parseDateParam`. `MealState` réutilisé en Task 4 inchangé.
