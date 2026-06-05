// Découpage d'un message en langage naturel en aliments + quantités (grammes).
// L'IA ne fait QUE le découpage ; les valeurs nutritionnelles viennent de la base.

import Anthropic from "@anthropic-ai/sdk";

export interface ParsedFood {
  name: string;
  quantityG: number;
  isGeneric: boolean; // false = produit perso / fait maison → valeurs à saisir par l'utilisateur
}

/** Interface minimale du client utilisée — permet d'injecter un faux client en test. */
export interface AnthropicLike {
  messages: {
    create(args: Record<string, unknown>): Promise<{
      content: Array<{ type: string; text?: string }>;
    }>;
  };
}

const MODEL = "claude-haiku-4-5";

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom de l'aliment en français, sans la quantité" },
          quantityG: { type: "number", description: "Quantité estimée en grammes" },
          isGeneric: {
            type: "boolean",
            description:
              "true si c'est un aliment/produit courant dont on peut connaître des valeurs nutritionnelles typiques. false si c'est un produit fait maison, une recette personnelle ou un produit dont l'utilisateur indique qu'il est à lui (ex: « ma sauce », « maison », « perso ») — dans ce cas ses valeurs ne peuvent pas être devinées.",
          },
        },
        required: ["name", "quantityG", "isGeneric"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

const SYSTEM = `Tu extrais d'un message en français la liste des aliments mangés avec leur quantité en grammes.
- Donne un nom d'aliment en français, SANS la quantité chiffrée (ex: "riz basmati", "yaourt grec").
- IMPORTANT : conserve dans le nom les mots qui définissent le PRODUIT ou sa transformation, car ils changent les valeurs nutritionnelles : "en tranches", "fumé", "pané", "cru", "grillé", "rôti", "séché", "en conserve", "allégé"… Ne les supprime pas.
  Exemple : "tranche de blanc de poulet" → nom "blanc de poulet en tranches" (produit de charcuterie), PAS "blanc de poulet grillé".
- "tranche", "filet", "portion", "part" décrivent la FORME du produit, pas une quantité : garde-les dans le nom et estime les grammes à part.
- Convertis toute mesure (portions, cuillères, unités, ml) en une estimation raisonnable en grammes.
- Une banane ≈ 120 g, un œuf ≈ 60 g, une cuillère à soupe d'huile ≈ 14 g, un yaourt ≈ 125 g, une tranche de charcuterie ≈ 30 g.
- Si aucune quantité n'est précisée, estime une portion courante.
- Ne renvoie que les aliments réellement mentionnés.
- Pour chaque aliment, indique isGeneric : false si c'est une préparation maison / personnelle / une recette propre à l'utilisateur (« ma sauce », « maison », « fait maison », « perso »), true sinon.`;

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function parseMealText(
  text: string,
  client?: AnthropicLike,
): Promise<ParsedFood[]> {
  const anthropic: AnthropicLike = client ?? (new Anthropic() as unknown as AnthropicLike);

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: text }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });

  const block = res.content.find((b) => b.type === "text" && b.text);
  if (!block?.text) return [];

  const data = JSON.parse(block.text) as { items?: ParsedFood[] };
  if (!Array.isArray(data.items)) return [];

  return data.items
    .filter((i) => typeof i.name === "string" && typeof i.quantityG === "number" && i.quantityG > 0)
    .map((i) => ({ name: i.name.trim(), quantityG: i.quantityG, isGeneric: i.isGeneric !== false }));
}
