"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanBarcode, Trash2, Loader2 } from "lucide-react";
import { saveRecipe, type RecipeInput } from "@/app/(app)/plats/actions";
import { FoodSearch } from "@/components/FoodSearch";
import { ScanOverlay, ScanView } from "@/components/ScanView";
import { perServing, recipeTotals, type PickedFood } from "@/lib/recipe";
import type { Per100g } from "@/lib/macros";

export interface IngredientLine {
  key: string;
  referenceId: string;
  name: string;
  per100g: Per100g;
  unit: "g" | "piece";
  quantity: string;
  pieceG: string;
}

export interface RecipeDraft {
  id?: string;
  name: string;
  servings: string;
  lines: IngredientLine[];
}

const fieldCls =
  "rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:focus:bg-neutral-900";
const smallCls =
  "w-16 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800";
const r = (n: number) => Math.round(n);

function toNum(v: string): number {
  const n = Number(v.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function gramsOf(line: IngredientLine): number {
  return line.unit === "piece" ? toNum(line.quantity) * toNum(line.pieceG) : toNum(line.quantity);
}

function toInput(draft: RecipeDraft): RecipeInput | null {
  const servings = toNum(draft.servings);
  const valid =
    draft.name.trim() !== "" && Number.isInteger(servings) && draft.lines.length > 0 && draft.lines.every((l) => gramsOf(l) > 0);
  if (!valid) return null;
  return {
    id: draft.id,
    name: draft.name.trim(),
    servings,
    ingredients: draft.lines.map((l) => ({
      referenceId: l.referenceId,
      quantityG: gramsOf(l),
      pieces: l.unit === "piece" ? toNum(l.quantity) : null,
    })),
  };
}

export function RecipeEditor({ initial }: { initial: RecipeDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function addFood(food: PickedFood) {
    const line: IngredientLine = {
      key: crypto.randomUUID(),
      referenceId: food.referenceId,
      name: food.name,
      per100g: food.per100g,
      unit: "g",
      quantity: "",
      pieceG: food.servingG ? String(food.servingG) : "",
    };
    setDraft((d) => ({ ...d, lines: [...d.lines, line] }));
    setScanning(false);
  }

  function updateLine(key: string, patch: Partial<IngredientLine>) {
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  }

  function removeLine(key: string) {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }));
  }

  function save() {
    const input = toInput(draft);
    if (!input) {
      setError("Renseigne le nom, un nombre entier de portions et la quantité de chaque ingrédient.");
      return;
    }
    setError(null);
    startSaving(async () => {
      const res = await saveRecipe(input);
      if (res.ok) router.push("/plats");
      else setError(res.error ?? "Erreur lors de l'enregistrement.");
    });
  }

  const lines = draft.lines.map((l) => ({ per100g: l.per100g, quantityG: gramsOf(l) }));
  const servings = toNum(draft.servings);

  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nom de la recette"
          className={`w-full ${fieldCls}`}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-500">Nombre de portions</label>
          <input
            value={draft.servings}
            onChange={(e) => setDraft({ ...draft, servings: e.target.value })}
            inputMode="numeric"
            className={`w-20 ${fieldCls}`}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
        <div className="font-semibold text-neutral-800 dark:text-neutral-100">Ingrédients</div>
        {draft.lines.length > 0 && (
          <ul className="space-y-3">
            {draft.lines.map((l) => (
              <IngredientRow key={l.key} line={l} onChange={(p) => updateLine(l.key, p)} onRemove={() => removeLine(l.key)} />
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-400 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
        >
          <ScanBarcode size={16} />
          Scanner un ingrédient
        </button>
        <FoodSearch onPick={addFood} />
      </section>

      <RecipeSummary lines={lines} servings={servings} />

      {error && <p className="px-1 text-xs text-rose-600">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Enregistrer la recette
      </button>

      {scanning && (
        <ScanOverlay onClose={() => setScanning(false)}>
          <ScanView onFound={addFood} />
        </ScanOverlay>
      )}
    </div>
  );
}

function IngredientRow({
  line,
  onChange,
  onRemove,
}: {
  line: IngredientLine;
  onChange: (patch: Partial<IngredientLine>) => void;
  onRemove: () => void;
}) {
  const grams = gramsOf(line);
  return (
    <li className="text-sm">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-200">{line.name}</span>
        <span className="shrink-0 tabular-nums text-neutral-500">{r((line.per100g.kcal * grams) / 100)} kcal</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Retirer"
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-rose-500 dark:hover:bg-neutral-800"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          value={line.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          inputMode="decimal"
          placeholder="Qté"
          className={smallCls}
        />
        <select
          value={line.unit}
          onChange={(e) => onChange({ unit: e.target.value as IngredientLine["unit"] })}
          className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="g">g</option>
          <option value="piece">pièce(s)</option>
        </select>
        {line.unit === "piece" && (
          <>
            <span className="text-xs text-neutral-500">de</span>
            <input
              value={line.pieceG}
              onChange={(e) => onChange({ pieceG: e.target.value })}
              inputMode="decimal"
              placeholder="g"
              className={smallCls}
            />
            <span className="text-xs text-neutral-500">g{grams > 0 ? ` = ${r(grams)} g` : ""}</span>
          </>
        )}
      </div>
    </li>
  );
}

function RecipeSummary({ lines, servings }: { lines: { per100g: Per100g; quantityG: number }[]; servings: number }) {
  if (lines.length === 0) return null;
  const total = recipeTotals(lines);
  const portion = servings > 0 ? perServing(lines, servings) : null;
  return (
    <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg shadow-emerald-500/20">
      <div className="text-xs font-medium uppercase tracking-wide text-white/75">Par portion</div>
      {portion ? (
        <>
          <div className="mt-0.5 text-3xl font-bold">{r(portion.kcal)} kcal</div>
          <div className="mt-1 text-sm text-white/90">
            P {r(portion.proteinG)} g · G {r(portion.carbG)} g · L {r(portion.fatG)} g · F {r(portion.fiberG)} g
          </div>
        </>
      ) : (
        <div className="mt-1 text-sm text-white/90">Indique le nombre de portions.</div>
      )}
      <div className="mt-2 text-xs text-white/75">
        Recette entière : {r(total.kcal)} kcal · P {r(total.proteinG)} · G {r(total.carbG)} · L {r(total.fatG)} · F{" "}
        {r(total.fiberG)}
      </div>
    </section>
  );
}
