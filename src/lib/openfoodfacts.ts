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
