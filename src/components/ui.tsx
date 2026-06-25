"use client";

import React from "react";
import { useData } from "@/lib/store";

export function useAccentClass() {
  const { dataset } = useData();
  return dataset === "positivos" ? "theme-opp" : "";
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function PanelHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#f0f2f6]">
      <div>
        <h3 className="text-[13px] font-semibold text-ink tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-6 animate-fadeUp">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{eyebrow}</div>
      <h1 className="text-2xl font-bold text-ink tracking-tight mt-1">{title}</h1>
      <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
    </div>
  );
}

const bandStyles: Record<string, string> = {
  Alto: "bg-red-50 text-red-700 ring-red-600/15",
  Medio: "bg-amber-50 text-amber-700 ring-amber-600/15",
  Bajo: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "Alto" | "Medio" | "Bajo" }) {
  const cls =
    tone === "accent"
      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] ring-[var(--accent)]/15"
      : bandStyles[tone] ?? "bg-slate-100 text-slate-600 ring-slate-500/10";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <span className="text-slate-400 text-lg">—</span>
      </div>
      <p className="text-sm text-slate-400 max-w-xs">{message}</p>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-400 text-sm">
      <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-200 border-t-[var(--accent)] animate-spin" />
      {label}
    </div>
  );
}
