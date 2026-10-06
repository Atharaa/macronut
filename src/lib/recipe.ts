import { scaleMacros, type Per100g, type ScaledMacros } from "@/lib/macros";

export interface PickedFood {
  referenceId: string;
  name: string;
  per100g: Per100g;
  servingG: number | null;
}

export interface RecipeLine {
  per100g: Per100g;
  quantityG: number;
}

export interface PortionMacros {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Somme des macros de tous les ingrédients (quantités réelles). */
export function recipeTotals(lines: RecipeLine[]): ScaledMacros {
  const zero: ScaledMacros = { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 };
  return lines.reduce((acc, l) => {
    const m = scaleMacros(l.per100g, l.quantityG);
    return {
      kcal: acc.kcal + m.kcal,
      proteinG: acc.proteinG + m.proteinG,
      carbG: acc.carbG + m.carbG,
      fatG: acc.fatG + m.fatG,
      fiberG: acc.fiberG + m.fiberG,
    };
  }, zero);
}

/** Macros d'une portion : total de la recette divisé par le nombre de portions. */
export function perServing(lines: RecipeLine[], servings: number): PortionMacros {
  const t = recipeTotals(lines);
  return {
    kcal: round1(t.kcal / servings),
    proteinG: round1(t.proteinG / servings),
    carbG: round1(t.carbG / servings),
    fatG: round1(t.fatG / servings),
    fiberG: round1(t.fiberG / servings),
  };
}
