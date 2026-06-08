/** Date du jour normalisée à minuit UTC (clé de regroupement journalier). */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Normalise une date à minuit UTC. */
export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Décale une date d'un nombre de jours (UTC). */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
}

/** Formate une date en "YYYY-MM-DD" (composants UTC). */
export function toDateParam(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Vrai si la date tombe aujourd'hui (comparaison à minuit UTC). */
export function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfToday().getTime();
}

/**
 * Parse un paramètre d'URL en date (minuit UTC). Repli sur aujourd'hui si absent
 * ou invalide ; clampe au jour courant (pas de futur).
 */
export function parseDateParam(value?: string): Date {
  if (!value) return startOfToday();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return startOfToday();
  const day = startOfDay(parsed);
  return day.getTime() > startOfToday().getTime() ? startOfToday() : day;
}
