import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { startOfToday } from "@/lib/date";
import { ActivityForm } from "@/components/ActivityForm";

const TYPE_LABEL: Record<string, string> = { steps: "Pas", sport: "Sport (min)" };

export default async function ActivitePage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const entries = await prisma.activityEntry.findMany({
    where: { userId: user.id, date: startOfToday() },
    orderBy: { id: "desc" },
  });

  const total = entries.reduce((sum, e) => sum + e.estimatedKcal, 0);

  return (
    <main className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">Activité du jour</h1>

      <section className="rounded-xl bg-green-600 p-4 text-white">
        <div className="text-xs uppercase tracking-wide opacity-85">Dépense estimée</div>
        <div className="mt-1 text-3xl font-bold">+{total} kcal</div>
      </section>

      <ActivityForm />

      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between rounded-xl border p-3 text-sm"
          >
            <span>
              {TYPE_LABEL[e.type] ?? e.type} : {e.value}
            </span>
            <span className="text-neutral-500">+{e.estimatedKcal} kcal</span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-sm text-neutral-500">Aucune activité saisie aujourd'hui.</li>
        )}
      </ul>
    </main>
  );
}
