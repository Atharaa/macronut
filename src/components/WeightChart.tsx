"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-neutral-100">
        Aucune pesée pour l'instant.
        <br />
        Ajoute ton premier poids ci-dessous.
      </div>
    );
  }
  return (
    <div className="h-64 w-full rounded-2xl bg-white p-4 pr-3 shadow-sm ring-1 ring-neutral-100">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="weightStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            labelStyle={{ color: "#64748b" }}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            name="Poids (kg)"
            stroke="url(#weightStroke)"
            strokeWidth={3}
            dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
