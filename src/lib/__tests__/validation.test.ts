import { describe, it, expect } from "vitest";
import { numPositive, numMin0, optionalNumPositive } from "@/lib/validation";

describe("validation tolérante à la virgule", () => {
  it("accepte la virgule décimale", () => {
    expect(numPositive.parse("8,9")).toBe(8.9);
    expect(numMin0.parse("0,5")).toBe(0.5);
  });
  it("accepte aussi le point", () => {
    expect(numPositive.parse("8.9")).toBe(8.9);
  });
  it("accepte un nombre déjà typé", () => {
    expect(numPositive.parse(12)).toBe(12);
  });
  it("rejette les valeurs <= 0 pour numPositive", () => {
    expect(numPositive.safeParse("0").success).toBe(false);
    expect(numMin0.parse("0")).toBe(0);
  });
  it("optionalNumPositive : vide → null, virgule → nombre", () => {
    expect(optionalNumPositive.parse("")).toBeNull();
    expect(optionalNumPositive.parse("6,5")).toBe(6.5);
  });
});
