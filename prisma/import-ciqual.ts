// Import de la table CIQUAL complète (ANSES) dans FoodReference.
// Source : fichier Excel officiel téléchargé dans prisma/data/ciqual.xls
//   curl -sL -o prisma/data/ciqual.xls "https://www.data.gouv.fr/api/1/datasets/r/bcdb7fec-875c-42aa-ba6e-460adf97aad3"
// Lancement : npx tsx prisma/import-ciqual.ts

import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FILE = "prisma/data/ciqual.xls";

const COL = {
  code: "alim_code",
  name: "alim_nom_fr",
  kcal: "Energie, Règlement UE N° 1169/2011 (kcal/100 g)",
  protein: "Protéines, N x 6.25 (g/100 g)",
  proteinJones: "Protéines, N x facteur de Jones (g/100 g)",
  carb: "Glucides (g/100 g)",
  fat: "Lipides (g/100 g)",
  fiber: "Fibres alimentaires (g/100 g)",
} as const;

/** Nettoie une valeur CIQUAL ("12,3", "traces", "< 0,5", "-", nombre) en nombre >= 0. */
function num(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value < 0 ? 0 : value;
  let s = String(value).trim().toLowerCase();
  if (s === "" || s === "-") return 0;
  if (s.includes("traces")) return 0;
  s = s.replace("<", "").replace(/\s| /g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function main() {
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  const records = rows
    .filter((r) => r[COL.code] != null && r[COL.name])
    .map((r) => {
      const protein = num(r[COL.protein]) || num(r[COL.proteinJones]);
      return {
        ciqualId: `ciqual-${r[COL.code]}`,
        name: String(r[COL.name]).trim(),
        kcal: num(r[COL.kcal]),
        proteinG: protein,
        carbG: num(r[COL.carb]),
        fatG: num(r[COL.fat]),
        fiberG: num(r[COL.fiber]),
        source: "ciqual" as const,
      };
    });

  // Dédoublonnage par ciqualId (sécurité).
  const byId = new Map(records.map((r) => [r.ciqualId, r]));
  const unique = [...byId.values()];

  // Remplace l'import précédent (n'affecte ni starter- ni ai/manual).
  await prisma.foodReference.deleteMany({ where: { ciqualId: { startsWith: "ciqual-" } } });
  const result = await prisma.foodReference.createMany({ data: unique, skipDuplicates: true });

  console.log(`CIQUAL importé : ${result.count} aliments (sur ${rows.length} lignes).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
