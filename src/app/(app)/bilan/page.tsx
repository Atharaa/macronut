import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { addDays, parseDateParam, startOfToday, startOfWeek, toDateParam } from "@/lib/date";
import { loadWeekIntakes } from "@/lib/weekly-data";
import { buildWeekRecap, missingDays, type DayIntake } from "@/lib/weekly";
import { MissingDaysForm } from "@/components/MissingDaysForm";
import { completeReview } from "@/app/(app)/bilan/actions";

const r = (n: number) => Math.round(n);
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", timeZone: "UTC" });
const rangeFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const arrowCls =
  "flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800";

export default async function BilanPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <main className="p-4">Non authentifié.</main>;

  // Seules les semaines terminées ont un bilan : au plus tard, la semaine dernière.
  const lastWeek = addDays(startOfWeek(startOfToday()), -7);
  const { w } = await searchParams;
  const requested = w ? startOfWeek(parseDateParam(w)) : lastWeek;
  const weekStart = requested > lastWeek ? lastWeek : requested;

  const [days, review] = await Promise.all([
    loadWeekIntakes(user.id, weekStart, user.goal?.targetKcal ?? null),
    prisma.weeklyReview.findUnique({ where: { userId_weekStart: { userId: user.id, weekStart } } }),
  ]);
  const missing = missingDays(days);
  const isLastWeek = weekStart.getTime() === lastWeek.getTime();

  return (
    <main className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/bilan?w=${toDateParam(addDays(weekStart, -7))}`} aria-label="Semaine précédente" className={arrowCls}>
          <ChevronLeft size={20} />
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Bilan de la semaine</h1>
          <div className="text-xs text-neutral-500">
            du {rangeFmt.format(weekStart)} au {rangeFmt.format(addDays(weekStart, 6))}
          </div>
        </div>
        {isLastWeek ? (
          <span className="h-9 w-9" />
        ) : (
          <Link href={`/bilan?w=${toDateParam(addDays(weekStart, 7))}`} aria-label="Semaine suivante" className={arrowCls}>
            <ChevronRight size={20} />
          </Link>
        )}
      </div>

      {missing.length > 0 ? (
        <MissingDaysForm dates={missing} />
      ) : (
        <WeekRecapView days={days} proteinTarget={user.goal?.targetProteinG ?? null} />
      )}

      {missing.length === 0 &&
        (review ? (
          <p className="flex items-center justify-center gap-1 text-sm text-emerald-600">
            <Check size={15} /> Bilan validé
          </p>
        ) : (
          <form action={completeReview}>
            <input type="hidden" name="weekStart" value={toDateParam(weekStart)} />
            <button type="submit" className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white">
              Valider le bilan
            </button>
          </form>
        ))}
    </main>
  );
}

function WeekRecapView({ days, proteinTarget }: { days: DayIntake[]; proteinTarget: number | null }) {
  const recap = buildWeekRecap(days);
  const under = recap.gapKcal != null && recap.gapKcal <= 0;
  return (
    <>
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
        <div className="text-xs font-medium uppercase tracking-wide text-white/75">Moyenne par jour</div>
        <div className="mt-0.5 text-4xl font-bold">
          {r(recap.avgKcal)} <span className="text-lg font-medium text-white/80">kcal</span>
        </div>
        <div className="mt-2 space-y-0.5 text-sm text-white/90">
          <div>Total : {r(recap.totalKcal)} kcal{recap.totalBudget != null && ` / objectif ${r(recap.totalBudget)}`}</div>
          {recap.gapKcal != null && (
            <div>
              {under ? "Sous l'objectif de" : "Au-dessus de l'objectif de"} {r(Math.abs(recap.gapKcal))} kcal sur la semaine
              {" · "}
              {recap.daysOver} jour{recap.daysOver > 1 ? "s" : ""} au-dessus
            </div>
          )}
          {recap.avgProteinG != null && (
            <div>
              Protéines : {r(recap.avgProteinG)} g/jour{proteinTarget != null && ` (objectif ${proteinTarget} g)`}
            </div>
          )}
        </div>
      </section>

      <ul className="divide-y divide-neutral-100 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-neutral-100 dark:divide-neutral-800 dark:bg-neutral-900 dark:ring-neutral-800">
        {days.map((d) => {
          const over = d.budget != null && (d.kcal ?? 0) > d.budget;
          return (
            <li key={d.date} className="flex items-center justify-between py-2.5 text-sm">
              <Link href={`/?d=${d.date}`} className="capitalize text-neutral-700 dark:text-neutral-200">
                {dayFmt.format(new Date(d.date))}
                {d.manual && <span className="ml-1.5 text-[11px] normal-case text-neutral-400">saisie manuelle</span>}
              </Link>
              <span className={`tabular-nums font-medium ${over ? "text-rose-500" : "text-emerald-600"}`}>
                {r(d.kcal ?? 0)}
                {d.budget != null && <span className="font-normal text-neutral-400"> / {r(d.budget)}</span>} kcal
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
