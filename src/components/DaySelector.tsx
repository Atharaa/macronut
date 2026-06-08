"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, toDateParam, isToday, startOfDay, startOfToday } from "@/lib/date";

const arrowCls =
  "flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800";

export function DaySelector({ date, basePath }: { date: string; basePath: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const current = startOfDay(new Date(date));
  const today = isToday(current);
  const todayParam = toDateParam(startOfToday());

  const hrefFor = (d: Date) => {
    const param = toDateParam(d);
    return param === todayParam ? basePath : `${basePath}?d=${param}`;
  };

  const label = today
    ? "Aujourd'hui"
    : new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(current);

  return (
    <div className="relative flex items-center justify-center gap-3 px-1 py-1">
      <Link href={hrefFor(addDays(current, -1))} aria-label="Jour précédent" className={arrowCls}>
        <ChevronLeft size={20} />
      </Link>

      <button
        type="button"
        onClick={() => inputRef.current?.showPicker?.()}
        className="min-w-[9rem] rounded-full px-3 py-1.5 text-center text-sm font-semibold capitalize text-neutral-700 active:bg-neutral-100 dark:text-neutral-200 dark:active:bg-neutral-800"
      >
        {label}
        <input
          ref={inputRef}
          type="date"
          max={todayParam}
          value={toDateParam(current)}
          onChange={(e) => router.push(e.target.value === todayParam ? basePath : `${basePath}?d=${e.target.value}`)}
          className="sr-only"
        />
      </button>

      {today ? (
        <span className="h-9 w-9" />
      ) : (
        <Link href={hrefFor(addDays(current, 1))} aria-label="Jour suivant" className={arrowCls}>
          <ChevronRight size={20} />
        </Link>
      )}

      {!today && (
        <Link
          href={basePath}
          className="absolute right-0 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          Aujourd'hui
        </Link>
      )}
    </div>
  );
}
