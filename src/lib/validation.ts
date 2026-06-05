import { z } from "zod";

// Convertit une saisie en nombre, en acceptant la virgule décimale (clavier FR).
function toNumber(v: unknown): unknown {
  if (typeof v === "string") {
    const s = v.trim().replace(",", ".");
    return s === "" ? undefined : Number(s);
  }
  return v;
}

export const numPositive = z.preprocess(toNumber, z.number().positive());
export const numMin0 = z.preprocess(toNumber, z.number().min(0));
export const optionalNumPositive = z.preprocess(
  (v) => {
    const n = toNumber(v);
    return n === undefined ? null : n;
  },
  z.number().positive().nullable(),
);
