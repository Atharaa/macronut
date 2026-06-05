// Mise à l'échelle des valeurs nutritionnelles (référence pour 100 g → quantité réelle).

export interface Per100g {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

export interface ScaledMacros {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scaleMacros(ref: Per100g, quantityG: number): ScaledMacros {
  const f = quantityG / 100;
  return {
    kcal: round1(ref.kcal * f),
    proteinG: round1(ref.proteinG * f),
    carbG: round1(ref.carbG * f),
    fatG: round1(ref.fatG * f),
    fiberG: round1(ref.fiberG * f),
  };
}
