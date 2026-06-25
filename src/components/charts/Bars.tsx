"use client";

import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList,
} from "recharts";
import type { CountItem } from "@/lib/types";
import { useTheme } from "@/lib/theme";

function cssVar(name: string, fallback: string) {
  if (typeof window !== "undefined") {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) return v;
  }
  return fallback;
}

// Reads the resolved theme tokens so charts follow both the dataset accent and
// the light/dark mode. Subscribing to useTheme forces a re-read on toggle.
function useChartColors() {
  useTheme();
  return {
    accent: cssVar("--accent", "#4f46e5"),
    grid: cssVar("--chart-grid", "#eceff4"),
    axis: cssVar("--chart-axis", "#94a3b8"),
    axisStrong: cssVar("--chart-axis-strong", "#475569"),
    label: cssVar("--chart-label", "#64748b"),
  };
}

export function CategoryBar({
  data, horizontal = false, height = 260, colors, valueFormatter,
}: {
  data: CountItem[];
  horizontal?: boolean;
  height?: number;
  colors?: string[];
  valueFormatter?: (n: number) => string;
}) {
  const { accent, grid, axis, axisStrong, label } = useChartColors();
  if (!data.length) return null;

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={grid} />
          <XAxis type="number" tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category" dataKey="label" width={150} tick={{ fontSize: 11, fill: axisStrong }}
            axisLine={false} tickLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v: number) => [valueFormatter ? valueFormatter(v) : v, "Cantidad"]} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={16}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors ? colors[i % colors.length] : accent} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: label }}
              formatter={(v: number) => (valueFormatter ? valueFormatter(v) : v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: label }} axisLine={false} tickLine={false} interval={0} angle={data.length > 5 ? -18 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 56 : 28} />
        <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
        <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v: number) => [valueFormatter ? valueFormatter(v) : v, "Cantidad"]} />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={34}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors ? colors[i % colors.length] : accent} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Horizontal bar specialised for currency / numeric rankings keyed by risk name.
export function RankingBar({
  data, height = 320, valueFormatter, color,
}: {
  data: { label: string; value: number }[];
  height?: number;
  valueFormatter: (n: number) => string;
  color?: string;
}) {
  const { accent, grid, axis, axisStrong, label } = useChartColors();
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={grid} />
        <XAxis type="number" tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} />
        <YAxis type="category" dataKey="label" width={190} tick={{ fontSize: 10.5, fill: axisStrong }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v: number) => [valueFormatter(v), "Valor"]} />
        <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={15} fill={color ?? accent}>
          <LabelList dataKey="value" position="right" style={{ fontSize: 10.5, fill: label }} formatter={valueFormatter} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
