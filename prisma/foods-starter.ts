// Table de départ : aliments courants, valeurs pour 100 g.
// Remplaçable / complétable par l'import du jeu CIQUAL complet (voir prisma/import-ciqual.ts).

export interface FoodSeed {
  ciqualId: string;
  name: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

export const STARTER_FOODS: FoodSeed[] = [
  { ciqualId: "starter-egg", name: "Œuf entier cuit", kcal: 155, proteinG: 13, carbG: 1.1, fatG: 11, fiberG: 0 },
  { ciqualId: "starter-chicken", name: "Blanc de poulet grillé", kcal: 165, proteinG: 31, carbG: 0, fatG: 3.6, fiberG: 0 },
  { ciqualId: "starter-rice", name: "Riz blanc cuit", kcal: 130, proteinG: 2.4, carbG: 28, fatG: 0.3, fiberG: 0.4 },
  { ciqualId: "starter-basmati", name: "Riz basmati cuit", kcal: 120, proteinG: 2.7, carbG: 25, fatG: 0.4, fiberG: 0.5 },
  { ciqualId: "starter-oats", name: "Flocons d'avoine", kcal: 370, proteinG: 13, carbG: 60, fatG: 7, fiberG: 10 },
  { ciqualId: "starter-banana", name: "Banane", kcal: 89, proteinG: 1.1, carbG: 23, fatG: 0.3, fiberG: 2.6 },
  { ciqualId: "starter-apple", name: "Pomme", kcal: 52, proteinG: 0.3, carbG: 14, fatG: 0.2, fiberG: 2.4 },
  { ciqualId: "starter-bread-whole", name: "Pain complet", kcal: 247, proteinG: 9, carbG: 41, fatG: 3.4, fiberG: 7 },
  { ciqualId: "starter-baguette", name: "Baguette pain blanc", kcal: 270, proteinG: 9, carbG: 55, fatG: 1.5, fiberG: 3 },
  { ciqualId: "starter-pasta", name: "Pâtes cuites", kcal: 158, proteinG: 6, carbG: 31, fatG: 0.9, fiberG: 1.8 },
  { ciqualId: "starter-potato", name: "Pomme de terre cuite", kcal: 87, proteinG: 2, carbG: 20, fatG: 0.1, fiberG: 1.8 },
  { ciqualId: "starter-lentils", name: "Lentilles cuites", kcal: 116, proteinG: 9, carbG: 20, fatG: 0.4, fiberG: 8 },
  { ciqualId: "starter-chickpeas", name: "Pois chiches cuits", kcal: 164, proteinG: 9, carbG: 27, fatG: 2.6, fiberG: 8 },
  { ciqualId: "starter-salmon", name: "Saumon", kcal: 208, proteinG: 20, carbG: 0, fatG: 13, fiberG: 0 },
  { ciqualId: "starter-tuna", name: "Thon au naturel", kcal: 116, proteinG: 26, carbG: 0, fatG: 1, fiberG: 0 },
  { ciqualId: "starter-beef-lean", name: "Bœuf haché 5%", kcal: 137, proteinG: 21, carbG: 0, fatG: 5, fiberG: 0 },
  { ciqualId: "starter-steak", name: "Steak de bœuf", kcal: 250, proteinG: 26, carbG: 0, fatG: 15, fiberG: 0 },
  { ciqualId: "starter-ham", name: "Jambon blanc", kcal: 110, proteinG: 18, carbG: 1, fatG: 4, fiberG: 0 },
  { ciqualId: "starter-yogurt", name: "Yaourt nature", kcal: 61, proteinG: 3.5, carbG: 4.7, fatG: 3.3, fiberG: 0 },
  { ciqualId: "starter-greek-yogurt", name: "Yaourt grec", kcal: 97, proteinG: 9, carbG: 4, fatG: 5, fiberG: 0 },
  { ciqualId: "starter-fromage-blanc", name: "Fromage blanc 0%", kcal: 47, proteinG: 8, carbG: 4, fatG: 0.2, fiberG: 0 },
  { ciqualId: "starter-milk", name: "Lait demi-écrémé", kcal: 47, proteinG: 3.3, carbG: 4.8, fatG: 1.6, fiberG: 0 },
  { ciqualId: "starter-emmental", name: "Emmental", kcal: 380, proteinG: 28, carbG: 0, fatG: 30, fiberG: 0 },
  { ciqualId: "starter-almonds", name: "Amandes", kcal: 579, proteinG: 21, carbG: 22, fatG: 50, fiberG: 12 },
  { ciqualId: "starter-peanut-butter", name: "Beurre de cacahuète", kcal: 588, proteinG: 25, carbG: 20, fatG: 50, fiberG: 6 },
  { ciqualId: "starter-olive-oil", name: "Huile d'olive", kcal: 884, proteinG: 0, carbG: 0, fatG: 100, fiberG: 0 },
  { ciqualId: "starter-butter", name: "Beurre", kcal: 717, proteinG: 0.9, carbG: 0.1, fatG: 81, fiberG: 0 },
  { ciqualId: "starter-avocado", name: "Avocat", kcal: 160, proteinG: 2, carbG: 9, fatG: 15, fiberG: 7 },
  { ciqualId: "starter-broccoli", name: "Brocoli", kcal: 34, proteinG: 2.8, carbG: 7, fatG: 0.4, fiberG: 2.6 },
  { ciqualId: "starter-carrot", name: "Carotte", kcal: 41, proteinG: 0.9, carbG: 10, fatG: 0.2, fiberG: 2.8 },
  { ciqualId: "starter-tomato", name: "Tomate", kcal: 18, proteinG: 0.9, carbG: 3.9, fatG: 0.2, fiberG: 1.2 },
  { ciqualId: "starter-spinach", name: "Épinards", kcal: 23, proteinG: 2.9, carbG: 3.6, fatG: 0.4, fiberG: 2.2 },
  { ciqualId: "starter-quinoa", name: "Quinoa cuit", kcal: 120, proteinG: 4.4, carbG: 21, fatG: 1.9, fiberG: 2.8 },
  { ciqualId: "starter-dark-chocolate", name: "Chocolat noir", kcal: 546, proteinG: 5, carbG: 61, fatG: 31, fiberG: 7 },
  { ciqualId: "starter-honey", name: "Miel", kcal: 304, proteinG: 0.3, carbG: 82, fatG: 0, fiberG: 0.2 },
  { ciqualId: "starter-sandwich-bread", name: "Pain de mie", kcal: 280, proteinG: 8, carbG: 50, fatG: 5, fiberG: 3 },
];
