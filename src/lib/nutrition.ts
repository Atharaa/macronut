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

// Part des calories de sport réintégrée au budget du jour. La dépense est déjà
// calculée en NET (MET − 1), donc réaliste : on la reprend en entier.
export const ACTIVITY_REINTEGRATION = 1;

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
  floorKcal: number = KCAL_FLOOR,
): number {
  const base = Math.round(tdee);
  if (goalType === "maintain") return base;
  const delta = dailyAdjustment(weeklyRateKg);
  if (goalType === "gain") return base + delta;
  return Math.max(floorKcal, base - delta);
}

export interface Macros {
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

// Répartition « priorité protéines » : protéines selon la masse sèche si connue
// (2 g/kg), sinon repli sur le poids total (1,8 g/kg) ; lipides ~30 % des kcal ;
// glucides = variable d'ajustement (le reste).
const PROTEIN_G_PER_KG_LEAN = 2.0;
const PROTEIN_G_PER_KG_BODY = 1.8;
const FAT_KCAL_RATIO = 0.3;

export function computeMacros(
  targetKcal: number,
  weightKg: number,
  leanMassKg?: number | null,
): Macros {
  const proteinG = leanMassKg
    ? Math.round(PROTEIN_G_PER_KG_LEAN * leanMassKg)
    : Math.round(PROTEIN_G_PER_KG_BODY * weightKg);
  const fatG = Math.round((FAT_KCAL_RATIO * targetKcal) / 9);
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
const DEFAULT_SPORT_MET = 6;

// Intensités (MET) d'après le Compendium of Physical Activities (approximations).
export const SPORTS: { key: string; label: string; met: number }[] = [
  { key: "muscu", label: "Musculation", met: 5 },
  { key: "velo", label: "Vélo", met: 7.5 },
  { key: "course", label: "Course à pied", met: 9.8 },
  { key: "marche_rapide", label: "Marche rapide", met: 4.3 },
  { key: "natation", label: "Natation", met: 7 },
  { key: "hiit", label: "HIIT", met: 8 },
  { key: "corde", label: "Corde à sauter", met: 11 },
  { key: "elliptique", label: "Elliptique / rameur", met: 5.5 },
];

export function sportMet(key: string | null | undefined): number {
  return SPORTS.find((s) => s.key === key)?.met ?? DEFAULT_SPORT_MET;
}

export function sportLabel(key: string | null | undefined): string {
  return SPORTS.find((s) => s.key === key)?.label ?? "Sport";
}

/**
 * Estime la dépense énergétique NETTE d'une activité (la dépense « en plus » du repos,
 * pour ne pas surestimer).
 * - steps : value = nombre de pas.
 * - sport : value = durée en minutes ; kcal = min × (MET − 1) × 3,5 × poids / 200.
 *   Le « − 1 » retranche le métabolisme de repos déjà compté. Plus on est lourd,
 *   plus on brûle.
 */
export function computeActivityKcal(
  type: ActivityType,
  value: number,
  weightKg: number,
  met: number = DEFAULT_SPORT_MET,
): number {
  if (type === "steps") return Math.round(value * KCAL_PER_STEP);
  const netMet = Math.max(0, met - 1);
  return Math.round((value * netMet * 3.5 * weightKg) / 200);
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
  leanMassKg?: number | null;
}

export interface Targets extends Macros {
  bmr: number;
  tdee: number;
  targetKcal: number;
  weeksToGoal: number | null;
  floorApplied: boolean; // true si le rythme demandé a été bridé par le plancher (métabolisme de base)
}

export function computeTargets(input: TargetsInput): Targets {
  const bmr = computeBmr(input);
  const tdee = computeTdee(bmr, input.activityLevel);
  // Garde-fou : ne jamais descendre sous le métabolisme de base.
  const floorKcal = Math.max(KCAL_FLOOR, Math.round(bmr));
  const targetKcal = computeTargetKcal(tdee, input.goalType, input.weeklyRateKg, floorKcal);
  const uncapped = computeTargetKcal(tdee, input.goalType, input.weeklyRateKg, 0);
  const floorApplied = input.goalType === "loss" && uncapped < targetKcal;

  const macros = computeMacros(targetKcal, input.weightKg, input.leanMassKg);

  // Estimation du temps sur le rythme RÉELLEMENT atteignable (après plancher).
  const effectiveDailyDeficit =
    input.goalType === "loss"
      ? Math.round(tdee) - targetKcal
      : input.goalType === "gain"
        ? targetKcal - Math.round(tdee)
        : 0;
  const effectiveWeeklyRate =
    effectiveDailyDeficit > 0 ? (effectiveDailyDeficit * 7) / KCAL_PER_KG : null;
  const weeksToGoal =
    input.targetKg && effectiveWeeklyRate ? Math.ceil(input.targetKg / effectiveWeeklyRate) : null;

  return { bmr, tdee, targetKcal, ...macros, weeksToGoal, floorApplied };
}
