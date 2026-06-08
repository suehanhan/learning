"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function TeacherOverviewCharts({ data }: { data: Array<{ module: string; accuracy: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
        <XAxis dataKey="module" stroke="rgba(255,255,255,0.6)" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }} />
        <YAxis
          stroke="rgba(255,255,255,0.25)"
          tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(2, 6, 23, 0.92)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            color: "white",
          }}
          formatter={(v) => [`${v}%`, "正确率"]}
        />
        <Bar dataKey="accuracy" fill="#38bdf8" radius={[10, 10, 2, 2]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

