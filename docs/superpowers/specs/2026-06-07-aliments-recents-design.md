# Aliments récents — conception

Date : 2026-06-07
Statut : validé (conception)

## Objectif

Réduire la re-saisie quotidienne des repas. Aujourd'hui chaque aliment passe
par la recherche ou l'analyse IA. On veut proposer, sous chaque repas, les
aliments récemment consommés pour les ré-ajouter en **un tap**, avec la
dernière quantité utilisée.

Périmètre de ce chantier : **récents uniquement** (déduits automatiquement de
l'historique). Les favoris (étoile manuelle) sont un chantier ultérieur.

## Décisions

- **Récents seulement**, dérivés de l'historique. Aucun nouveau modèle de données.
- **Quantité = dernière utilisée** pour ce type de repas. Ajustable ensuite via
  l'édition existante (✎).
- **Filtrés par type de repas** : sous « Petit déjeuner » on voit les récents de
  petit-déjeuner, sous « Dîner » ceux du dîner.
- **Emplacement** : rangée de chips sous le `MealInput` de chaque repas.

## Source de données

Pas de nouveau modèle. Les récents se déduisent des `FoodItem` existants :

- Un `FoodItem` matché/estimé porte une `referenceId` (clé de déduplication).
- Les produits perso « à compléter » sont créés avec `referenceId: null` et
  macros à zéro. En clé-ant sur `referenceId`, ils sont **naturellement exclus**.
- `FoodItem` n'a pas de timestamp : la récence se mesure via `Meal.date`
  (granularité jour, suffisant).

## Architecture

### 1. Dérivation des récents (`src/lib/recents.ts`)

Fonction pure testable, séparée de l'accès DB :

```
buildRecents(meals): Record<MealType, RecentFood[]>
```

- Entrée : repas (avec `type`, `date`, `items` incluant `reference`).
- Pour chaque `MealType`, parcourir les items des repas triés par `date`
  décroissante.
- Garder les références uniques (par `referenceId`), première occurrence = plus
  récente. Ignorer les items à `referenceId` null.
- Pour chaque référence : `{ referenceId, name, quantityG }` où `quantityG` est
  la quantité de l'occurrence la plus récente pour ce type de repas.
- Limiter au **top 8** par type de repas.

`RecentFood = { referenceId: string; name: string; quantityG: number }`

### 2. Requête (dans `src/app/(app)/page.tsx`)

- Charger les repas de l'utilisateur des **30 derniers jours**, avec
  `items: { include: { reference: true } }`.
- Appeler `buildRecents(meals)`.
- Passer `recents[mealType]` à chaque section de repas.

### 3. Server action (`src/app/(app)/actions.ts`)

```
addRecentFood(prev, formData): Promise<MealState>
```

- Champs : `referenceId`, `mealType`, `quantityG`.
- Valider : `mealType` ∈ MEAL_TYPES ; `quantityG` via `numPositive` ;
  `referenceId` non vide.
- Charger la `FoodReference` (source de vérité des macros). Si absente →
  erreur « Aliment introuvable. ».
- `upsert` du repas du jour (même logique que `addFoodsFromText`).
- `scaleMacros(reference, quantityG)` pour recalculer les macros.
- Créer le `FoodItem` (`referenceId`, `name` = `reference.name`, `quantityG`,
  macros).
- `revalidatePath("/")`.

### 4. Composant (`src/components/RecentChips.tsx`)

- Client component : `RecentChips({ mealType, recents }: { mealType: string; recents: RecentFood[] })`.
- Si `recents` vide → ne rien rendre.
- Rangée horizontale scrollable de chips. Chaque chip = un `<form>` avec
  `useActionState(addRecentFood)`, champs cachés `referenceId`, `mealType`,
  `quantityG`, bouton portant le `name` de l'aliment.
- État `pending` (spinner / opacité) cohérent avec `MealInput`.
- Rendu dans chaque section de repas de `page.tsx`, juste sous `MealInput`.

## Cas limites

- Aucun récent pour ce repas → pas de rangée.
- Référence orpheline/supprimée → exclue (jointure `reference` null).
- Item déjà présent dans le repas du jour → on ajoute quand même un nouvel
  item (cohérent avec l'analyse IA actuelle, qui n'empêche pas les doublons).
- Items `referenceId: null` (perso non complétés) → exclus.

## Tests (vitest)

`src/lib/__tests__/recents.test.ts` couvrant `buildRecents` :

- Déduplication par référence (une seule entrée par aliment).
- Filtrage par type de repas (un aliment de déjeuner n'apparaît pas au dîner).
- Ordre par récence (`Meal.date` décroissante).
- Exclusion des items `referenceId: null`.
- Dernière quantité correcte (occurrence la plus récente).
- Limite top 8 par type de repas.

`scaleMacros` est déjà testé : pas de nouveau test sur le calcul.

## Hors périmètre

- Favoris (étoile manuelle).
- Classement par fréquence (on s'en tient à la récence).
- Déduplication anti-doublon dans le repas du jour.
