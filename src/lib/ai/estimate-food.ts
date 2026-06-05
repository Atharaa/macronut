// Estimation des valeurs nutritionnelles (pour 100 g) d'un aliment absent de la base.
// Utilisé en repli quand aucun aliment de référence ne correspond.

import Anthropic from "@anthropic-ai/sdk";
import type { AnthropicLike } from "@/lib/ai/parse-meal";

export interface EstimatedFood {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

const MODEL = "claude-haiku-4-5";

const SCHEMA = {
  type: "object",
  properties: {
    kcal: { type: "number", description: "kcal pour 100 g" },
    proteinG: { type: "number", description: "protéines (g) pour 100 g" },
    carbG: { type: "number", description: "glucides (g) pour 100 g" },
    fatG: { type: "number", description: "lipides (g) pour 100 g" },
    fiberG: { type: "number", description: "fibres (g) pour 100 g" },
  },
  required: ["kcal", "proteinG", "carbG", "fatG", "fiberG"],
  additionalProperties: false,
};

const SYSTEM = `Tu donnes les valeurs nutritionnelles typiques POUR 100 g d'un aliment ou produit alimentaire en français.
Réponds avec des valeurs réalistes (kcal, protéines, glucides, lipides, fibres). Pour un produit de marque, utilise des valeurs typiques de ce type de produit.`;

export async function estimateFoodMacros(
  name: string,
  client?: AnthropicLike,
): Promise<EstimatedFood | null> {
  const anthropic: AnthropicLike = client ?? (new Anthropic() as unknown as AnthropicLike);

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: "user", content: `Valeurs nutritionnelles pour 100 g de : ${name}` }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });

  const block = res.content.find((b) => b.type === "text" && b.text);
  if (!block?.text) return null;

  const d = JSON.parse(block.text) as Partial<EstimatedFood>;
  const fields = ["kcal", "proteinG", "carbG", "fatG", "fiberG"] as const;
  if (fields.some((f) => typeof d[f] !== "number" || d[f]! < 0)) return null;

  return {
    kcal: d.kcal!,
    proteinG: d.proteinG!,
    carbG: d.carbG!,
    fatG: d.fatG!,
    fiberG: d.fiberG!,
  };
}
