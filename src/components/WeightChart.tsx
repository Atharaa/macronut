"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export interface WeightPoint {
  date: string;
  weightKg: number;
}

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function WeightChart({ data, target }: { data: WeightPoint[]; target?: number | null }) {
  const dark = useIsDark();

  if (data.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-3xl bg-white text-center text-sm text-neutral-400 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-800">
        <span className="mb-1 text-3xl">📈</span>
        Aucune pesée pour l'instant.
        <br />
        Ajoute ton premier poids ci-dessous.
      </div>
    );
  }

  const weights = data.map((d) => d.weightKg);
  const lo = Math.min(...weights, ...(target != null ? [target] : []));
  const hi = Math.max(...weights, ...(target != null ? [target] : []));
  const pad = Math.max(0.5, (hi - lo) * 0.15);

  const grid = dark ? "#1f2937" : "#f1f5f9";
  const tick = dark ? "#9ca3af" : "#94a3b8";
  const tooltipBg = dark ? "#111418" : "#ffffff";

  return (
    <div className="h-64 w-full rounded-3xl bg-white p-4 pr-3 shadow-sm ring-1 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="wStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="wFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke={grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: tick }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
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
              background: tooltipBg,
              boxShadow: "0 8px 24px rgba(0,0,0,.25)",
              fontSize: 12,
            }}
            labelStyle={{ color: tick, fontWeight: 600 }}
            itemStyle={{ color: dark ? "#e5e7eb" : "#0f172a" }}
            formatter={(v) => [`${v} kg`, "Poids"]}
          />
          {target != null && (
            <ReferenceLine
              y={target}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{ value: `objectif ${target} kg`, position: "insideTopRight", fontSize: 10, fill: "#d97706" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="weightKg"
            stroke="url(#wStroke)"
            strokeWidth={3}
            fill="url(#wFill)"
            dot={{ r: 3, fill: "#10b981", strokeWidth: 2, stroke: dark ? "#111418" : "#fff" }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: dark ? "#111418" : "#fff" }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
