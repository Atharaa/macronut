"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useIsDark } from "@/components/WeightChart";

export interface MeasurementPoint {
  date: string;
  chestCm: number | null;
  waistCm: number | null;
  thighCm: number | null;
}

const SERIES = [
  { key: "chestCm", label: "Poitrine", color: "#6366f1" },
  { key: "waistCm", label: "Taille", color: "#f59e0b" },
  { key: "thighCm", label: "Cuisse", color: "#f43f5e" },
] as const;

export function MeasurementChart({ data }: { data: MeasurementPoint[] }) {
  const dark = useIsDark();

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-3xl bg-white text-center text-sm text-neutral-400 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-800">
        Aucune mensuration pour l'instant.
      </div>
    );
  }

  const values = data.flatMap((d) => SERIES.map((s) => d[s.key])).filter((v): v is number => v != null);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max(1, (hi - lo) * 0.1);

  const grid = dark ? "#1f2937" : "#f1f5f9";
  const tick = dark ? "#9ca3af" : "#94a3b8";
  const dotStroke = dark ? "#111418" : "#fff";
  const labels: Record<string, string> = Object.fromEntries(SERIES.map((s) => [s.key, s.label]));

  return (
    <div className="h-64 w-full rounded-3xl bg-white p-4 pr-3 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            domain={[Math.floor(lo - pad), Math.ceil(hi + pad)]}
            tick={{ fontSize: 11, fill: tick }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "none",
              background: dark ? "#111418" : "#ffffff",
              boxShadow: "0 8px 24px rgba(0,0,0,.25)",
              fontSize: 12,
            }}
            labelStyle={{ color: tick, fontWeight: 600 }}
            formatter={(v, name) => [`${v} cm`, labels[String(name)] ?? name]}
          />
          <Legend
            formatter={(name) => labels[String(name)] ?? name}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2.5}
              connectNulls
              dot={{ r: 3, fill: s.color, strokeWidth: 2, stroke: dotStroke }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: dotStroke }}
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
