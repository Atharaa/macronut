import { describe, it, expect } from "vitest";
import { recipeTotals, perServing } from "@/lib/recipe";

const rice = { kcal: 350, proteinG: 7, carbG: 77, fatG: 1, fiberG: 1 };
const chicken = { kcal: 120, proteinG: 23, carbG: 0, fatG: 2.5, fiberG: 0 };

describe("recipeTotals", () => {
  it("additionne les macros à l'échelle des quantités", () => {
    const t = recipeTotals([
      { per100g: rice, quantityG: 1000 },
      { per100g: chicken, quantityG: 600 },
    ]);
    expect(t.kcal).toBe(4220);
    expect(t.proteinG).toBe(208);
    expect(t.carbG).toBe(770);
    expect(t.fatG).toBe(25);
  });
});

describe("perServing", () => {
  it("divise le total par le nombre de portions", () => {
    const p = perServing(
      [
        { per100g: rice, quantityG: 1000 },
        { per100g: chicken, quantityG: 600 },
      ],
      15,
    );
    expect(p).toEqual({ kcal: 281.3, proteinG: 13.9, carbG: 51.3, fatG: 1.7 });
  });
});
