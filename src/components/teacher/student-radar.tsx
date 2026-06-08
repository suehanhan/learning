"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

export default function StudentRadar({ data }: { data: Array<{ module: string; accuracy: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.12)" />
        <PolarAngleAxis dataKey="module" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }} />
        <Radar dataKey="accuracy" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

