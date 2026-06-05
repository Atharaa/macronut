export interface MacroBarProps {
  label: string;
  consumed: number;
  target: number | null | undefined;
  barClass: string;
  trackClass: string;
}

const r = (n: number) => Math.round(n);

export function MacroBar({ label, consumed, target, barClass, trackClass }: MacroBarProps) {
  const pct = target && target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-neutral-700 dark:text-neutral-200">{label}</span>
        <span className="text-neutral-400 dark:text-neutral-500">
          {r(consumed)} / {target != null ? r(target) : "—"} g
        </span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${trackClass}`}>
        <div
          className={`h-full rounded-full ${barClass} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
