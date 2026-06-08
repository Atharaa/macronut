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
