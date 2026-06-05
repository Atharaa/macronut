// Moteur de calcul nutritionnel — fonctions pures, indépendantes de la base.

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalType = "loss" | "gain" | "maintain";

const KCAL_PER_KG = 7700;
const KCAL_FLOOR = 1200;

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function ageFromBirthDate(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function computeBmr(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const { sex, weightKg, heightCm, ageYears } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? base + 5 : base - 161;
}

export function computeTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

function dailyAdjustment(weeklyRateKg: number | null): number {
  if (!weeklyRateKg) return 0;
  return Math.round((weeklyRateKg * KCAL_PER_KG) / 7);
}

export function computeTargetKcal(
  tdee: number,
  goalType: GoalType,
  weeklyRateKg: number | null,
): number {
  const base = Math.round(tdee);
  if (goalType === "maintain") return base;
  const delta = dailyAdjustment(weeklyRateKg);
  if (goalType === "gain") return base + delta;
  return Math.max(KCAL_FLOOR, base - delta);
}

export interface Macros {
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

export function computeMacros(targetKcal: number, weightKg: number): Macros {
  const proteinG = Math.round(1.8 * weightKg);
  const fatG = Math.round(0.8 * weightKg);
  const fiberG = Math.round((14 * targetKcal) / 1000);
  const remainingKcal = targetKcal - proteinG * 4 - fatG * 9;
  const carbG = Math.max(0, Math.round(remainingKcal / 4));
  return { proteinG, carbG, fatG, fiberG };
}

export function estimateWeeksToGoal(
  targetKg: number | null,
  weeklyRateKg: number | null,
): number | null {
  if (!targetKg || !weeklyRateKg) return null;
  return Math.ceil(targetKg / weeklyRateKg);
}

export type ActivityType = "sport" | "steps";

const KCAL_PER_STEP = 0.04;
const SPORT_MET = 6; // intensité modérée par défaut

/**
 * Estime la dépense énergétique d'une activité.
 * - steps : value = nombre de pas.
 * - sport : value = durée en minutes (utilise le poids et un MET modéré).
 */
export function computeActivityKcal(
  type: ActivityType,
  value: number,
  weightKg: number,
): number {
  if (type === "steps") return Math.round(value * KCAL_PER_STEP);
  const kcalPerMin = (SPORT_MET * 3.5 * weightKg) / 200;
  return Math.round(value * kcalPerMin);
}

export interface TargetsInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  weeklyRateKg: number | null;
  targetKg?: number | null;
}

export interface Targets extends Macros {
  bmr: number;
  tdee: number;
  targetKcal: number;
  weeksToGoal: number | null;
}

export function computeTargets(input: TargetsInput): Targets {
  const bmr = computeBmr(input);
  const tdee = computeTdee(bmr, input.activityLevel);
  const targetKcal = computeTargetKcal(tdee, input.goalType, input.weeklyRateKg);
  const macros = computeMacros(targetKcal, input.weightKg);
  const weeksToGoal = estimateWeeksToGoal(input.targetKg ?? null, input.weeklyRateKg);
  return { bmr, tdee, targetKcal, ...macros, weeksToGoal };
}
