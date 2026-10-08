"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchFoodReferences } from "@/app/(app)/aliments/actions";
import type { PickedFood } from "@/lib/recipe";

export function FoodSearch({
  onPick,
  placeholder = "Rechercher un aliment (riz, poulet…)",
}: {
  onPick: (food: PickedFood) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedFood[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const found = await searchFoodReferences(query);
      if (!cancelled) {
        setResults(found);
        setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function pick(food: PickedFood) {
    onPick(food);
    setQuery("");
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-800">
        {loading ? <Loader2 size={16} className="animate-spin text-neutral-400" /> : <Search size={16} className="text-neutral-400" />}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
        />
      </div>
      {results.length > 0 && (
        <ul className="mt-1 max-h-60 overflow-y-auto rounded-xl ring-1 ring-neutral-100 dark:ring-neutral-800">
          {results.map((f) => (
            <li key={f.referenceId}>
              <button
                type="button"
                onClick={() => pick(f)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <span className="min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-200">{f.name}</span>
                <span className="shrink-0 text-xs text-neutral-400">{Math.round(f.per100g.kcal)} kcal/100 g</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
