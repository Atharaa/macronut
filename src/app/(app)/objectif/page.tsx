import { ObjectifForm, type ObjectifFormValues } from "@/components/ObjectifForm";
import { getCurrentUser, getLatestWeight } from "@/lib/user";
import { estimateWeeksToGoal } from "@/lib/nutrition";

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function ObjectifPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  const latestWeight = await getLatestWeight(user.id);
  const goal = user.goal;

  const initial: ObjectifFormValues = {
    sex: user.sex ?? "male",
    birthDate: toDateInput(user.birthDate),
    heightCm: user.heightCm?.toString() ?? "",
    weightKg: latestWeight?.weightKg.toString() ?? "",
    activityLevel: goal?.activityLevel ?? "sedentary",
    goalType: goal?.type ?? "maintain",
    targetKg: goal?.targetKg?.toString() ?? "",
    weeklyRateKg: goal?.weeklyRateKg?.toString() ?? "",
  };

  const weeks =
    goal != null ? estimateWeeksToGoal(goal.targetKg, goal.weeklyRateKg) : null;

  return (
    <main className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">Objectif</h1>

      {goal?.targetKcal != null && (
        <section className="rounded-xl bg-green-600 p-4 text-white">
          <div className="text-xs uppercase tracking-wide opacity-85">Besoins quotidiens</div>
          <div className="mt-1 text-3xl font-bold">{goal.targetKcal} kcal</div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div className="opacity-85">Prot.</div>
              <div className="font-semibold">{goal.targetProteinG} g</div>
            </div>
            <div>
              <div className="opacity-85">Gluc.</div>
              <div className="font-semibold">{goal.targetCarbG} g</div>
            </div>
            <div>
              <div className="opacity-85">Lip.</div>
              <div className="font-semibold">{goal.targetFatG} g</div>
            </div>
            <div>
              <div className="opacity-85">Fibres</div>
              <div className="font-semibold">{goal.targetFiberG} g</div>
            </div>
          </div>
          {weeks != null && (
            <div className="mt-3 text-sm opacity-90">
              Estimation : ~{weeks} semaine{weeks > 1 ? "s" : ""} pour atteindre l'objectif.
            </div>
          )}
        </section>
      )}

      <ObjectifForm initial={initial} />
    </main>
  );
}
