"use client";

import React from "react";

export function KpiCard({
  label, value, sub, icon: Icon, accent = false, index = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  accent?: boolean;
  index?: number;
}) {
  return (
    <div
      className="card p-4 animate-fadeUp transition-shadow hover:shadow-cardhover"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {Icon && (
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent ? "bg-[var(--accent-soft)]" : "bg-slate-50"}`}>
            <Icon className={`w-4 h-4 ${accent ? "text-[var(--accent)]" : "text-slate-400"}`} />
          </span>
        )}
      </div>
      <div className="mt-2 text-[26px] font-bold text-ink tracking-tight tnum leading-none">{value}</div>
      {sub && <div className="mt-1.5 text-[11.5px] text-slate-400">{sub}</div>}
    </div>
  );
}
