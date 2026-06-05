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
    date: e.date.toISOString().slice(5, 10), // MM-DD
    weightKg: e.weightKg,
  }));

  return (
    <main className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">Poids</h1>
      <WeightChart data={data} />
      <WeightForm />
    </main>
  );
}
