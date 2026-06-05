import { describe, it, expect } from "vitest";
import {
  ageFromBirthDate,
  computeBmr,
  computeTdee,
  computeTargetKcal,
  computeMacros,
  estimateWeeksToGoal,
  computeTargets,
  computeActivityKcal,
} from "@/lib/nutrition";

describe("ageFromBirthDate", () => {
  it("calcule l'âge en années révolues", () => {
    const birth = new Date("1990-06-10");
    expect(ageFromBirthDate(birth, new Date("2026-06-05"))).toBe(35);
    expect(ageFromBirthDate(birth, new Date("2026-06-10"))).toBe(36);
  });
});

describe("computeBmr (Mifflin-St Jeor)", () => {
  it("homme", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(computeBmr({ sex: "male", weightKg: 80, heightCm: 180, ageYears: 30 })).toBe(1780);
  });
  it("femme", () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    expect(computeBmr({ sex: "female", weightKg: 60, heightCm: 165, ageYears: 30 })).toBeCloseTo(1320.25, 2);
  });
});

describe("computeTdee", () => {
  it("applique le facteur d'activité", () => {
    expect(computeTdee(1780, "sedentary")).toBeCloseTo(1780 * 1.2, 2);
    expect(computeTdee(1780, "moderate")).toBeCloseTo(1780 * 1.55, 2);
    expect(computeTdee(1780, "very_active")).toBeCloseTo(1780 * 1.9, 2);
  });
});

describe("computeTargetKcal", () => {
  it("maintien = tdee", () => {
    expect(computeTargetKcal(2200, "maintain", null)).toBe(2200);
  });
  it("perte = tdee - déficit (0,5 kg/sem ≈ 550 kcal/j)", () => {
    // 0.5 * 7700 / 7 = 550
    expect(computeTargetKcal(2200, "loss", 0.5)).toBe(2200 - 550);
  });
  it("prise = tdee + surplus", () => {
    expect(computeTargetKcal(2200, "gain", 0.25)).toBe(2200 + Math.round(0.25 * 7700 / 7));
  });
  it("ne descend jamais sous un plancher de sécurité", () => {
    expect(computeTargetKcal(1300, "loss", 1)).toBeGreaterThanOrEqual(1200);
  });
});

describe("computeMacros", () => {
  it("sans masse sèche : protéines 1,8 g/kg, lipides 30% des kcal, glucides = reste", () => {
    const m = computeMacros(2000, 80);
    expect(m.proteinG).toBe(144); // 1.8*80
    expect(m.fatG).toBe(67); // round(0.30*2000/9)
    expect(m.fiberG).toBe(28); // 14*2
    // (2000 - 144*4 - 67*9)/4 = (2000-576-603)/4 = 205
    expect(m.carbG).toBe(205);
  });

  it("avec masse sèche : protéines 2 g/kg de masse sèche", () => {
    const m = computeMacros(2000, 109, 72);
    expect(m.proteinG).toBe(144); // 2*72
    expect(m.fatG).toBe(67); // round(0.30*2000/9)
    // (2000 - 144*4 - 67*9)/4 = 205
    expect(m.carbG).toBe(205);
  });
  it("ne renvoie pas de glucides négatifs", () => {
    const m = computeMacros(800, 90);
    expect(m.carbG).toBeGreaterThanOrEqual(0);
  });
});

describe("estimateWeeksToGoal", () => {
  it("kg cible / rythme hebdo", () => {
    expect(estimateWeeksToGoal(5, 0.5)).toBe(10);
  });
  it("null si maintien ou rythme nul", () => {
    expect(estimateWeeksToGoal(null, 0.5)).toBeNull();
    expect(estimateWeeksToGoal(5, 0)).toBeNull();
    expect(estimateWeeksToGoal(5, null)).toBeNull();
  });
});

describe("computeActivityKcal", () => {
  it("pas : ~0,04 kcal/pas", () => {
    expect(computeActivityKcal("steps", 10000, 80)).toBe(400);
  });
  it("sport : minutes × MET modéré pondéré par le poids", () => {
    // 30 * (6*3.5*80/200) = 30 * 8.4 = 252
    expect(computeActivityKcal("sport", 30, 80)).toBe(252);
  });
});

describe("computeTargets (intégration)", () => {
  it("renvoie kcal et macros cohérents pour un profil complet", () => {
    const t = computeTargets({
      sex: "male",
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      activityLevel: "moderate",
      goalType: "loss",
      weeklyRateKg: 0.5,
    });
    const tdee = 1780 * 1.55;
    expect(t.tdee).toBeCloseTo(tdee, 0);
    expect(t.targetKcal).toBe(Math.round(tdee) - 550);
    expect(t.proteinG).toBe(144); // 1.8*80
    expect(t.fatG).toBe(Math.round((0.3 * t.targetKcal) / 9));
  });
});
