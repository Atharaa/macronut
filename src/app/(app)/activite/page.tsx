import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { parseDateParam, toDateParam } from "@/lib/date";
import { DaySelector } from "@/components/DaySelector";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityItem } from "@/components/ActivityItem";

export default async function ActivitePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const { d } = await searchParams;
  const selectedDate = parseDateParam(d);
  const dateParam = toDateParam(selectedDate);
  const entries = await prisma.activityEntry.findMany({
    where: { userId: user.id, date: selectedDate },
    orderBy: { id: "desc" },
  });

  const total = entries.reduce((sum, e) => sum + e.estimatedKcal, 0);

  return (
    <main className="space-y-4 p-4">
      <DaySelector date={dateParam} basePath="/activite" />
      <h1 className="px-1 text-xl font-bold text-neutral-800 dark:text-neutral-100">Activité</h1>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/20">
        <div className="text-xs font-medium uppercase tracking-wide text-white/75">Dépense estimée</div>
        <div className="mt-0.5 text-4xl font-bold">
          +{total} <span className="text-lg font-medium text-white/80">kcal</span>
        </div>
        <div className="mt-1 text-sm text-white/80">s'ajoute à ton budget calorique du jour</div>
      </section>

      <ActivityForm date={dateParam} />

      <ul className="space-y-2">
        {entries.map((e) => (
          <ActivityItem
            key={e.id}
            id={e.id}
            type={e.type}
            name={e.name}
            value={e.value}
            estimatedKcal={e.estimatedKcal}
          />
        ))}
        {entries.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-800">
            Aucune activité saisie.
          </li>
        )}
      </ul>
    </main>
  );
}
