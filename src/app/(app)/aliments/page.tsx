import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { AlimentsView } from "@/components/AlimentsView";

export default async function AlimentsPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const scanned = await prisma.foodReference.findMany({
    where: { source: "openfoodfacts" },
    orderBy: { name: "asc" },
  });

  return (
    <main className="space-y-4 p-4">
      <h1 className="px-1 text-xl font-bold text-neutral-800 dark:text-neutral-100">Aliments</h1>
      <AlimentsView
        scanned={scanned.map((r) => ({
          referenceId: r.id,
          name: r.name,
          per100g: { kcal: r.kcal, proteinG: r.proteinG, carbG: r.carbG, fatG: r.fatG, fiberG: r.fiberG },
          servingG: null,
        }))}
      />
    </main>
  );
}
