import { Footprints, Dumbbell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfToday } from "@/lib/date";
import { ActivityForm } from "@/components/ActivityForm";

export default async function ActivitePage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const entries = await prisma.activityEntry.findMany({
    where: { userId: user.id, date: startOfToday() },
    orderBy: { id: "desc" },
  });

  const total = entries.reduce((sum, e) => sum + e.estimatedKcal, 0);

  return (
    <main className="space-y-4 p-4">
      <h1 className="px-1 text-xl font-bold text-neutral-800">Activité du jour</h1>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/20">
        <div className="text-xs font-medium uppercase tracking-wide text-white/75">Dépense estimée</div>
        <div className="mt-0.5 text-4xl font-bold">
          +{total} <span className="text-lg font-medium text-white/80">kcal</span>
        </div>
        <div className="mt-1 text-sm text-white/80">s'ajoute à ton budget calorique du jour</div>
      </section>

      <ActivityForm />

      <ul className="space-y-2">
        {entries.map((e) => {
          const isSteps = e.type === "steps";
          const Icon = isSteps ? Footprints : Dumbbell;
          return (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-neutral-100"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className="flex-1 text-sm font-medium text-neutral-700">
                {isSteps ? `${e.value} pas` : `${e.value} min de sport`}
              </span>
              <span className="text-sm font-semibold text-orange-600">+{e.estimatedKcal} kcal</span>
            </li>
          );
        })}
        {entries.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-neutral-100">
            Aucune activité saisie aujourd'hui.
          </li>
        )}
      </ul>
    </main>
  );
}
