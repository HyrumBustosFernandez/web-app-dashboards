"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, ShieldCheck, Calculator, Search, Database,
  ShieldAlert, TrendingUp, ChevronRight,
} from "lucide-react";
import { useData } from "@/lib/store";
import { ThemeToggle } from "./ThemeToggle";
import { ConfettiButton } from "./ConfettiButton";
import { Spinner } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, hint: "Panorama ejecutivo" },
  { href: "/analysis", label: "Análisis", icon: BarChart3, hint: "Distribución y ranking" },
  { href: "/response", label: "Respuesta", icon: ShieldCheck, hint: "Estrategias y estado" },
  { href: "/pert", label: "PERT y Costos", icon: Calculator, hint: "Justificación económica" },
  { href: "/explorer", label: "Explorador", icon: Search, hint: "Detalle por riesgo" },
  { href: "/admin", label: "Datos", icon: Database, hint: "Importar workbook" },
];

function Sidebar() {
  const path = usePathname();
  const { data } = useData();
  return (
    <aside className="fixed inset-y-0 left-0 w-[244px] bg-ink text-slate-300 flex flex-col z-30">
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
          <ShieldAlert className="w-[18px] h-[18px] text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white tracking-tight">Risk Office</div>
          <div className="text-[10px] text-slate-400">{data?.meta.nombreProyecto ?? "SGB"}</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = path === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[var(--accent)]" : "text-slate-400 group-hover:text-slate-200"}`} />
              <span className="flex-1 font-medium">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="text-[10px] text-slate-500 leading-relaxed">
          Dir. de Proyecto<br />
          <span className="text-slate-300">{data?.meta.director ?? "—"}</span>
        </div>
      </div>
    </aside>
  );
}

function DatasetSelector() {
  const { dataset, setDataset } = useData();
  const options: { key: "negativos" | "positivos"; label: string; icon: React.ElementType }[] = [
    { key: "negativos", label: "Riesgos Negativos", icon: ShieldAlert },
    { key: "positivos", label: "Riesgos Positivos", icon: TrendingUp },
  ];
  return (
    <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/70">
      {options.map((o) => {
        const active = dataset === o.key;
        const Icon = o.icon;
        return (
          <button
            key={o.key}
            onClick={() => setDataset(o.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200 ${
              active ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? "text-[var(--accent)]" : ""}`} />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Topbar() {
  const path = usePathname();
  const { source } = useData();
  const current = NAV.find((n) => n.href === path) ?? NAV[0];
  return (
    <header className="sticky top-0 z-20 h-16 bg-[var(--bg)]/85 backdrop-blur border-b border-slate-200/70 flex items-center justify-between px-7">
      <div>
        <div className="text-[11px] text-slate-400">{current.hint}</div>
        <div className="text-[15px] font-semibold text-ink tracking-tight">{current.label}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5" />
          <span className="max-w-[180px] truncate">{source}</span>
        </div>
        <DatasetSelector />
        <ConfettiButton />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { dataset, loading, error } = useData();
  const themeClass = dataset === "positivos" ? "theme-opp" : "";

  return (
    <div className={themeClass}>
      <Sidebar />
      <div className="pl-[244px]">
        <Topbar />
        <main className="px-7 py-7 min-h-[calc(100vh-4rem)]">
          {loading && (
            <div className="flex items-center justify-center py-32">
              <Spinner label="Cargando datos del registro de riesgos…" />
            </div>
          )}
          {error && !loading && (
            <div className="card p-6 max-w-lg mx-auto mt-16 text-center">
              <p className="text-sm font-semibold text-red-600 mb-1">No se pudieron cargar los datos</p>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          )}
          {!loading && !error && children}
        </main>
      </div>
    </div>
  );
}
