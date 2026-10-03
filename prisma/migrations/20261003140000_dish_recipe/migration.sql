-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "servings" INTEGER;

-- CreateTable
CREATE TABLE "DishIngredient" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "quantityG" DOUBLE PRECISION NOT NULL,
    "pieces" DOUBLE PRECISION,

    CONSTRAINT "DishIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DishIngredient_dishId_idx" ON "DishIngredient"("dishId");

-- AddForeignKey
ALTER TABLE "DishIngredient" ADD CONSTRAINT "DishIngredient_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishIngredient" ADD CONSTRAINT "DishIngredient_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "FoodReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

