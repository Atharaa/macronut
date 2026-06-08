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
