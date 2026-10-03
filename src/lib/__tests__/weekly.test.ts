import { describe, it, expect } from "vitest";
import { buildWeekRecap, missingDays, type DayIntake } from "@/lib/weekly";
import { startOfWeek, toDateParam } from "@/lib/date";

const day = (date: string, kcal: number | null, extra: Partial<DayIntake> = {}): DayIntake => ({
  date,
  kcal,
  manual: false,
  proteinG: kcal == null ? null : 150,
  budget: 1900,
  ...extra,
});

describe("startOfWeek", () => {
  it("renvoie le lundi de la semaine", () => {
    expect(toDateParam(startOfWeek(new Date("2026-10-05T00:00:00Z")))).toBe("2026-10-05"); // lundi
    expect(toDateParam(startOfWeek(new Date("2026-10-08T00:00:00Z")))).toBe("2026-10-05"); // jeudi
    expect(toDateParam(startOfWeek(new Date("2026-10-11T00:00:00Z")))).toBe("2026-10-05"); // dimanche
  });
});

describe("missingDays", () => {
  it("liste les jours sans apport", () => {
    expect(missingDays([day("2026-09-28", 1800), day("2026-09-29", null)])).toEqual(["2026-09-29"]);
  });
});

describe("buildWeekRecap", () => {
  it("calcule total, moyenne, écart et jours au-dessus", () => {
    const r = buildWeekRecap([
      day("2026-09-28", 1800),
      day("2026-09-29", 2100),
      day("2026-09-30", 2000, { manual: true, proteinG: null }),
    ]);
    expect(r.totalKcal).toBe(5900);
    expect(r.avgKcal).toBeCloseTo(1966.7, 1);
    expect(r.totalBudget).toBe(5700);
    expect(r.gapKcal).toBe(200);
    expect(r.daysOver).toBe(2);
    expect(r.avgProteinG).toBe(150); // la saisie manuelle n'entre pas dans la moyenne
  });
});
