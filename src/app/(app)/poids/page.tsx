import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { WeightChart, type WeightPoint } from "@/components/WeightChart";
import { WeightForm } from "@/components/WeightForm";

export default async function PoidsPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const entries = await prisma.weightEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  const data: WeightPoint[] = entries.map((e) => ({
    date: e.date.toISOString().slice(5, 10),
    weightKg: e.weightKg,
  }));

  const latest = entries.at(-1);
  const first = entries[0];
  const delta = latest && first ? latest.weightKg - first.weightKg : null;

  return (
    <main className="space-y-4 p-4">
      <div className="flex items-end justify-between px-1">
        <h1 className="text-xl font-bold text-neutral-800">Poids</h1>
        {latest && (
          <div className="text-right">
            <div className="text-2xl font-bold text-neutral-800">{latest.weightKg} kg</div>
            {delta != null && delta !== 0 && (
              <div className={`text-xs font-medium ${delta < 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {delta > 0 ? "+" : ""}
                {Math.round(delta * 10) / 10} kg depuis le début
              </div>
            )}
          </div>
        )}
      </div>
      <WeightChart data={data} />
      <WeightForm />
    </main>
  );
}
