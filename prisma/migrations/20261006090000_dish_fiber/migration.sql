-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "fiberG" DOUBLE PRECISION NOT NULL DEFAULT 0;


-- Backfill : fibres par portion des recettes déjà composées
UPDATE "Dish" AS d
SET "fiberG" = ROUND((sub.total / d."servings")::numeric, 1)
FROM (
    SELECT i."dishId", SUM(r."fiberG" * i."quantityG" / 100) AS total
    FROM "DishIngredient" AS i
    JOIN "FoodReference" AS r ON r."id" = i."referenceId"
    GROUP BY i."dishId"
) AS sub
WHERE d."id" = sub."dishId" AND d."servings" IS NOT NULL AND d."servings" > 0;
