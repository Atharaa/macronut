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
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border p-6 text-center text-sm text-neutral-500">
        Aucune pesée pour l'instant. Ajoute ton premier poids ci-dessous.
      </p>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="weightKg"
            name="Poids (kg)"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
