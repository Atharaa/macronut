import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { WeightChart, type WeightPoint } from "@/components/WeightChart";
import { WeightForm } from "@/components/WeightForm";
import { MeasurementChart, type MeasurementPoint } from "@/components/MeasurementChart";
import { MeasurementForm } from "@/components/MeasurementForm";

export default async function PoidsPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const [entries, measurements] = await Promise.all([
    prisma.weightEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    }),
    prisma.bodyMeasurement.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    }),
  ]);

  const data: WeightPoint[] = entries.map((e) => ({
    date: e.date.toISOString().slice(5, 10),
    weightKg: e.weightKg,
  }));

  const measurementData: MeasurementPoint[] = measurements.map((m) => ({
    date: m.date.toISOString().slice(5, 10),
    chestCm: m.chestCm,
    waistCm: m.waistCm,
    thighCm: m.thighCm,
  }));

  const latest = entries.at(-1);
  const first = entries[0];
  const delta = latest && first ? latest.weightKg - first.weightKg : null;

  const goal = user.goal;
  let target: number | null = null;
  if (first && goal?.targetKg) {
    if (goal.type === "loss") target = Math.round((first.weightKg - goal.targetKg) * 10) / 10;
    else if (goal.type === "gain") target = Math.round((first.weightKg + goal.targetKg) * 10) / 10;
  }

  return (
    <main className="space-y-4 p-4">
      <div className="flex items-end justify-between px-1">
        <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Poids</h1>
        {latest && (
          <div className="text-right">
            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{latest.weightKg} kg</div>
            {delta != null && delta !== 0 && (
              <div className={`text-xs font-medium ${delta < 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {delta > 0 ? "+" : ""}
                {Math.round(delta * 10) / 10} kg depuis le début
              </div>
            )}
          </div>
        )}
      </div>
      <WeightChart data={data} target={target} />
      <WeightForm />

      <h2 className="px-1 pt-2 text-lg font-bold text-neutral-800 dark:text-neutral-100">Mensurations</h2>
      <MeasurementChart data={measurementData} />
      <MeasurementForm />
    </main>
  );
}
