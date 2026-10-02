import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { DishForm } from "@/components/DishForm";
import { deleteDish } from "@/app/(app)/plats/actions";

const r = (n: number) => Math.round(n);

export default async function PlatsPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const dishes = await prisma.dish.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <main className="space-y-4 p-4">
      <h1 className="px-1 text-xl font-bold text-neutral-800 dark:text-neutral-100">Mes plats</h1>

      <DishForm />

      <ul className="space-y-2">
        {dishes.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-2 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">{d.name}</div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                P {r(d.proteinG)} · G {r(d.carbG)} · L {r(d.fatG)}
              </div>
            </div>
            <span className="mr-1 text-sm font-semibold text-neutral-600 dark:text-neutral-300">{r(d.kcal)} kcal</span>
            <form action={deleteDish} className="flex">
              <input type="hidden" name="id" value={d.id} />
              <button
                type="submit"
                aria-label="Supprimer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-rose-500 active:bg-neutral-200 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-rose-400"
              >
                <Trash2 size={17} />
              </button>
            </form>
          </li>
        ))}
        {dishes.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-800">
            Aucun plat enregistré.
          </li>
        )}
      </ul>
    </main>
  );
}
