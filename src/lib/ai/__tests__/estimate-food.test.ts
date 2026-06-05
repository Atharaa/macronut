import { describe, it, expect, vi } from "vitest";
import { estimateFoodMacros } from "@/lib/ai/estimate-food";
import type { AnthropicLike } from "@/lib/ai/parse-meal";

function fakeClient(payload: unknown): AnthropicLike {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(payload) }],
      }),
    },
  };
}

describe("estimateFoodMacros", () => {
  it("renvoie les valeurs estimées par l'IA", async () => {
    const client = fakeClient({ kcal: 63, proteinG: 11, carbG: 4, fatG: 0.2, fiberG: 0 });
    const result = await estimateFoodMacros("skyr nature", client);
    expect(result).toEqual({ kcal: 63, proteinG: 11, carbG: 4, fatG: 0.2, fiberG: 0 });
  });

  it("renvoie null si un champ manque ou est négatif", async () => {
    const client = fakeClient({ kcal: 63, proteinG: -1, carbG: 4, fatG: 0.2, fiberG: 0 });
    expect(await estimateFoodMacros("x", client)).toBeNull();
  });

  it("renvoie null si pas de bloc texte", async () => {
    const client: AnthropicLike = {
      messages: { create: vi.fn().mockResolvedValue({ content: [] }) },
    };
    expect(await estimateFoodMacros("x", client)).toBeNull();
  });
});
