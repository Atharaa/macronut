import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { RecipeEditor, type RecipeDraft } from "@/components/RecipeEditor";

export default async function RecettePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const { id } = await searchParams;
  const dish = id
    ? await prisma.dish.findFirst({
        where: { id, userId: user.id },
        include: { ingredients: { include: { reference: true } } },
      })
    : null;

  const initial: RecipeDraft = dish
    ? {
        id: dish.id,
        name: dish.name,
        servings: String(dish.servings ?? 1),
        lines: dish.ingredients.map((i) => ({
          key: i.id,
          referenceId: i.referenceId,
          name: i.reference.name,
          per100g: i.reference,
          unit: i.pieces != null ? "piece" : "g",
          quantity: String(i.pieces ?? i.quantityG),
          pieceG: i.pieces != null ? String(Math.round((i.quantityG / i.pieces) * 10) / 10) : "",
        })),
      }
    : { name: "", servings: "", lines: [] };

  return (
    <main className="space-y-4 p-4">
      <div className="flex items-center gap-2 px-1">
        <Link
          href="/plats"
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
          {dish ? "Modifier la recette" : "Nouvelle recette"}
        </h1>
      </div>
      <RecipeEditor initial={initial} />
    </main>
  );
}
