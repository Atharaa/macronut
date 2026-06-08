import { describe, it, expect } from "vitest";
import { buildRecents } from "@/lib/recents";

const d = (iso: string) => new Date(iso);

describe("buildRecents", () => {
  it("déduplique par référence et garde la quantité la plus récente", () => {
    const recents = buildRecents([
      { type: "breakfast", date: d("2026-06-05"), items: [{ referenceId: "yog", name: "Yaourt", quantityG: 100 }] },
      { type: "breakfast", date: d("2026-06-07"), items: [{ referenceId: "yog", name: "Yaourt", quantityG: 125 }] },
    ]);
    const list = recents.get("breakfast")!;
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({ referenceId: "yog", name: "Yaourt", quantityG: 125 });
  });

  it("filtre par type de repas", () => {
    const recents = buildRecents([
      { type: "breakfast", date: d("2026-06-07"), items: [{ referenceId: "yog", name: "Yaourt", quantityG: 125 }] },
      { type: "dinner", date: d("2026-06-07"), items: [{ referenceId: "pasta", name: "Pâtes", quantityG: 200 }] },
    ]);
    expect(recents.get("breakfast")!.map((r) => r.referenceId)).toEqual(["yog"]);
    expect(recents.get("dinner")!.map((r) => r.referenceId)).toEqual(["pasta"]);
  });

  it("ordonne par récence décroissante", () => {
    const recents = buildRecents([
      { type: "lunch", date: d("2026-06-01"), items: [{ referenceId: "a", name: "A", quantityG: 50 }] },
      { type: "lunch", date: d("2026-06-07"), items: [{ referenceId: "b", name: "B", quantityG: 50 }] },
    ]);
    expect(recents.get("lunch")!.map((r) => r.referenceId)).toEqual(["b", "a"]);
  });

  it("exclut les items sans référence (referenceId null)", () => {
    const recents = buildRecents([
      { type: "dinner", date: d("2026-06-07"), items: [{ referenceId: null, name: "Plat maison", quantityG: 300 }] },
    ]);
    expect(recents.get("dinner") ?? []).toEqual([]);
  });

  it("limite à 8 par type de repas", () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ referenceId: `r${i}`, name: `R${i}`, quantityG: 10 }));
    const recents = buildRecents([{ type: "lunch", date: d("2026-06-07"), items }]);
    expect(recents.get("lunch")!).toHaveLength(8);
  });
});
