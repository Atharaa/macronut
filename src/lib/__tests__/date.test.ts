import { describe, it, expect } from "vitest";
import { parseDateParam, toDateParam, addDays, isToday, startOfToday } from "@/lib/date";

describe("toDateParam", () => {
  it("formate en YYYY-MM-DD (UTC)", () => {
    expect(toDateParam(new Date("2026-06-05T00:00:00Z"))).toBe("2026-06-05");
    expect(toDateParam(new Date("2026-01-09T00:00:00Z"))).toBe("2026-01-09");
  });
});

describe("addDays", () => {
  it("ajoute et retranche des jours, passage de mois", () => {
    expect(toDateParam(addDays(new Date("2026-01-31T00:00:00Z"), 1))).toBe("2026-02-01");
    expect(toDateParam(addDays(new Date("2026-03-01T00:00:00Z"), -1))).toBe("2026-02-28");
    expect(toDateParam(addDays(new Date("2026-06-30T00:00:00Z"), -30))).toBe("2026-05-31");
  });
});

describe("isToday", () => {
  it("vrai pour aujourd'hui, faux sinon", () => {
    expect(isToday(startOfToday())).toBe(true);
    expect(isToday(new Date("2020-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("parseDateParam", () => {
  it("date passée valide → ce jour", () => {
    expect(toDateParam(parseDateParam("2020-01-01"))).toBe("2020-01-01");
  });
  it("date future → aujourd'hui (clamp)", () => {
    expect(parseDateParam("2999-01-01").getTime()).toBe(startOfToday().getTime());
  });
  it("chaîne invalide → aujourd'hui", () => {
    expect(parseDateParam("pas-une-date").getTime()).toBe(startOfToday().getTime());
  });
  it("undefined → aujourd'hui", () => {
    expect(parseDateParam(undefined).getTime()).toBe(startOfToday().getTime());
  });
});
