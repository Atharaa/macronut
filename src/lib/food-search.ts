// Recherche d'aliment par nom — normalisation + matching par tokens.

const STOPWORDS = new Set([
  "de", "du", "des", "la", "le", "les", "l", "au", "aux", "un", "une", "d", "et", "a", "the",
]);

// Mots peu distinctifs : peuvent renforcer un match mais ne suffisent jamais seuls.
const QUALIFIERS = new Set([
  "nature", "naturel", "naturels", "cuit", "cuite", "cuits", "cuites", "cru", "crue",
  "grille", "grillee", "grilles", "grillees", "frais", "fraiche", "fraiches",
  "blanc", "blanche", "complet", "complete", "demi", "ecreme", "ecremee",
  "light", "allege", "allegee", "bio", "entier", "entiere", "sec", "seche",
  // Termes génériques de produits (sinon faux match sur le seul mot commun)
  "proteine", "proteines", "poudre", "poudres", "boisson", "boissons",
  "shaker", "complement", "alimentaire", "rehydrate", "rehydratee",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^a-z\s]/g, " ") // garde lettres + espaces
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  return a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a));
}

export interface NamedFood {
  name: string;
}

/** Retourne l'aliment dont le nom correspond le mieux à la requête, ou null. */
export function findBestMatch<T extends NamedFood>(query: string, foods: T[]): T | null {
  const queryTokens = significantTokens(query);
  if (queryTokens.length === 0) return null;

  let best: T | null = null;
  let bestScore = 0;
  let bestSize = Infinity;

  for (const food of foods) {
    const foodTokens = significantTokens(food.name);
    if (foodTokens.length === 0) continue;
    const matched = foodTokens.filter((ft) =>
      queryTokens.some((qt) => tokensMatch(ft, qt)),
    );
    // Il faut au moins un mot distinctif (non générique) en commun.
    const contentMatched = matched.filter((t) => !QUALIFIERS.has(t)).length;
    if (contentMatched === 0) continue;
    const score = matched.length;
    if (score > bestScore || (score === bestScore && foodTokens.length < bestSize)) {
      best = food;
      bestScore = score;
      bestSize = foodTokens.length;
    }
  }

  return best;
}
