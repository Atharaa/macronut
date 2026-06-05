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
    leanMassKg: user.leanMassKg?.toString() ?? "",
  };

  const weeks = goal != null ? estimateWeeksToGoal(goal.targetKg, goal.weeklyRateKg) : null;

  const chips =
    goal?.targetKcal != null
      ? [
          { label: "Protéines", value: goal.targetProteinG, cls: "bg-indigo-50 text-indigo-700" },
          { label: "Glucides", value: goal.targetCarbG, cls: "bg-amber-50 text-amber-700" },
          { label: "Lipides", value: goal.targetFatG, cls: "bg-rose-50 text-rose-700" },
          { label: "Fibres", value: goal.targetFiberG, cls: "bg-emerald-50 text-emerald-700" },
        ]
      : [];

  return (
    <main className="space-y-4 p-4">
      <h1 className="px-1 text-xl font-bold text-neutral-800">Objectif</h1>

      {goal?.targetKcal != null && (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="text-xs font-medium uppercase tracking-wide text-white/75">Besoins quotidiens</div>
          <div className="mt-0.5 text-4xl font-bold">
            {goal.targetKcal} <span className="text-lg font-medium text-white/80">kcal</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {chips.map((c) => (
              <div key={c.label} className={`rounded-xl ${c.cls} px-1 py-2 text-center`}>
                <div className="text-sm font-bold">{c.value} g</div>
                <div className="text-[10px] font-medium opacity-80">{c.label}</div>
              </div>
            ))}
          </div>
          {weeks != null && (
            <div className="mt-4 rounded-xl bg-white/15 px-3 py-2 text-sm">
              ⏱️ Environ <b>{weeks} semaine{weeks > 1 ? "s" : ""}</b> pour atteindre l'objectif.
            </div>
          )}
        </section>
      )}

      <ObjectifForm initial={initial} />
    </main>
  );
}
