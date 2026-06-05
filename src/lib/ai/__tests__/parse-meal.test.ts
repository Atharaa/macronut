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
      { name: "blanc de poulet grillé", quantityG: 150, isGeneric: true },
      { name: "riz basmati", quantityG: 200, isGeneric: true },
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
    expect(result).toEqual([{ name: "banane", quantityG: 120, isGeneric: true }]);
  });

  it("conserve isGeneric=false pour un produit perso/maison", async () => {
    const client = fakeClient({
      items: [{ name: "sauce creamy deluxe", quantityG: 100, isGeneric: false }],
    });
    const result = await parseMealText("100g de ma sauce creamy deluxe", client);
    expect(result).toEqual([{ name: "sauce creamy deluxe", quantityG: 100, isGeneric: false }]);
  });

  it("renvoie un tableau vide si pas de bloc texte", async () => {
    const client: AnthropicLike = {
      messages: { create: vi.fn().mockResolvedValue({ content: [] }) },
    };
    expect(await parseMealText("rien", client)).toEqual([]);
  });
});
