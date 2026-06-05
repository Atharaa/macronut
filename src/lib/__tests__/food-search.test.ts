import { describe, it, expect } from "vitest";
import { normalize, findBestMatch } from "@/lib/food-search";

const foods = [
  { name: "Blanc de poulet grillé" },
  { name: "Riz blanc cuit" },
  { name: "Riz basmati cuit" },
  { name: "Banane" },
  { name: "Yaourt nature" },
  { name: "Yaourt grec" },
  { name: "Pomme" },
  { name: "Protéine de soja, réhydratée" },
  { name: "Laitue iceberg, crue" },
  { name: "Salade César au poulet (salade verte, fromage, croûtons, sauce), préemballée" },
  { name: "Jambon de poulet ou Blanc de poulet en tranche" },
  { name: "Couscous au poulet" },
];

describe("normalize", () => {
  it("supprime accents, casse et ponctuation", () => {
    expect(normalize("Yaourt grec, 150g!")).toBe("yaourt grec g");
    expect(normalize("Blanc de POULET grillé")).toBe("blanc de poulet grille");
  });
});

describe("findBestMatch", () => {
  it("trouve le poulet", () => {
    expect(findBestMatch("blanc de poulet grillé", foods)?.name).toBe("Blanc de poulet grillé");
  });
  it("distingue riz basmati de riz blanc", () => {
    expect(findBestMatch("200g de riz basmati", foods)?.name).toBe("Riz basmati cuit");
  });
  it("gère le pluriel (startsWith)", () => {
    expect(findBestMatch("deux bananes", foods)?.name).toBe("Banane");
  });
  it("distingue yaourt grec de yaourt nature", () => {
    expect(findBestMatch("un yaourt grec", foods)?.name).toBe("Yaourt grec");
  });
  it("renvoie null si rien ne correspond", () => {
    expect(findBestMatch("xyz inconnu", foods)).toBeNull();
  });

  it("ne matche pas sur un simple qualificatif générique (skyr nature ≠ thon/yaourt nature)", () => {
    expect(findBestMatch("un skyr nature", foods)).toBeNull();
  });

  it("ne matche pas un produit inconnu sur 'blanc' seul", () => {
    expect(findBestMatch("clear whey protein", foods)).toBeNull();
  });

  it("clear whey protéine ne matche PAS la protéine de soja (mot générique)", () => {
    expect(findBestMatch("shaker clear whey protéine bulk", foods)).toBeNull();
  });

  it("matche encore la protéine de soja sur 'soja' (mot distinctif)", () => {
    expect(findBestMatch("protéine de soja", foods)?.name).toBe("Protéine de soja, réhydratée");
  });

  it("salade iceberg → laitue iceberg, pas la salade César (tokens dédoublonnés + 'salade' générique)", () => {
    expect(findBestMatch("une salade iceberg", foods)?.name).toBe("Laitue iceberg, crue");
  });

  it("le poulet reste un mot distinctif (non pénalisé)", () => {
    expect(findBestMatch("blanc de poulet grillé", foods)?.name).toBe("Blanc de poulet grillé");
  });

  it("'poulet' → blanc de poulet, pas un plat composé (couscous)", () => {
    expect(findBestMatch("150g de poulet", foods)?.name).toBe("Blanc de poulet grillé");
  });

  it("'blanc de poulet en tranches' → produit charcuterie, pas le grillé", () => {
    expect(findBestMatch("blanc de poulet en tranches", foods)?.name).toBe(
      "Jambon de poulet ou Blanc de poulet en tranche",
    );
  });
});
