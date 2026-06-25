"use client";

import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList,
} from "recharts";
import type { CountItem } from "@/lib/types";

const AXIS = { fontSize: 11, fill: "#94a3b8" };

function useAccentHex() {
  // Read the resolved --accent so charts follow the dataset theme.
  if (typeof window !== "undefined") {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    if (v) return v;
  }
  return "#4f46e5";
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
  const accent = useAccentHex();
  if (!data.length) return null;

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category" dataKey="label" width={150} tick={{ fontSize: 11, fill: "#475569" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v: number) => [valueFormatter ? valueFormatter(v) : v, "Cantidad"]} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={16}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors ? colors[i % colors.length] : accent} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "#64748b" }}
              formatter={(v: number) => (valueFormatter ? valueFormatter(v) : v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} angle={data.length > 5 ? -18 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 56 : 28} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
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
  const accent = useAccentHex();
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={valueFormatter} />
        <YAxis type="category" dataKey="label" width={190} tick={{ fontSize: 10.5, fill: "#475569" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v: number) => [valueFormatter(v), "Valor"]} />
        <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={15} fill={color ?? accent}>
          <LabelList dataKey="value" position="right" style={{ fontSize: 10.5, fill: "#64748b" }} formatter={valueFormatter} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
