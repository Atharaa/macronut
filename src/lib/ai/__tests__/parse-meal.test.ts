import { describe, it, expect, vi } from "vitest";
import { parseMealText, type AnthropicLike } from "@/lib/ai/parse-meal";

function fakeClient(payload: unknown): AnthropicLike {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(payload) }],
      }),
    },
  };
}

describe("parseMealText", () => {
  it("mappe les items renvoyés par l'IA", async () => {
    const client = fakeClient({
      items: [
        { name: "blanc de poulet grillé", quantityG: 150 },
        { name: "riz basmati", quantityG: 200 },
      ],
    });
    const result = await parseMealText("150g de poulet et 200g de riz", client);
    expect(result).toEqual([
      { name: "blanc de poulet grillé", quantityG: 150 },
      { name: "riz basmati", quantityG: 200 },
    ]);
  });

  it("filtre les items invalides (quantité nulle ou champs manquants)", async () => {
    const client = fakeClient({
      items: [
        { name: "banane", quantityG: 120 },
        { name: "vide", quantityG: 0 },
        { name: 42, quantityG: 10 },
      ],
    });
    const result = await parseMealText("une banane", client);
    expect(result).toEqual([{ name: "banane", quantityG: 120 }]);
  });

  it("renvoie un tableau vide si pas de bloc texte", async () => {
    const client: AnthropicLike = {
      messages: { create: vi.fn().mockResolvedValue({ content: [] }) },
    };
    expect(await parseMealText("rien", client)).toEqual([]);
  });
});
