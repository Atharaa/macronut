import { describe, it, expect } from "vitest";
import { scaleMacros } from "@/lib/macros";

describe("scaleMacros", () => {
  const poulet = { kcal: 165, proteinG: 31, carbG: 0, fatG: 3.6, fiberG: 0 };

  it("met à l'échelle pour 150 g", () => {
    const m = scaleMacros(poulet, 150);
    expect(m.kcal).toBe(247.5);
    expect(m.proteinG).toBe(46.5);
    expect(m.fatG).toBe(5.4);
  });

  it("renvoie 0 pour 0 g", () => {
    const m = scaleMacros(poulet, 0);
    expect(m.kcal).toBe(0);
  });
});
