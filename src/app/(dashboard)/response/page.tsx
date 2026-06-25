"use client";

import { useData } from "@/lib/store";
import { getRisks, countBy } from "@/lib/riskService";
import { PageHeader, Card, PanelHeader, Badge } from "@/components/ui";
import { CategoryBar } from "@/components/charts/Bars";
import { DataTable, Column } from "@/components/DataTable";
import type { Risk } from "@/lib/types";
import { truncate } from "@/lib/format";

// Known strategy colours; any unmapped strategy falls back to the palette.
const STRAT_COLOR: Record<string, string> = {
  mitigar: "#4f46e5", transferir: "#0ea5e9", evitar: "#dc2626", aceptar: "#64748b",
  explotar: "#0d9488", mejorar: "#16a34a", compartir: "#0ea5e9",
};
const FALLBACK = ["#4f46e5", "#0ea5e9", "#d97706", "#0d9488", "#a855f7", "#64748b"];

function colorFor(label: string, i: number) {
  return STRAT_COLOR[label.toLowerCase().trim()] ?? FALLBACK[i % FALLBACK.length];
}

export default function ResponsePage() {
  const { data, dataset } = useData();
  if (!data) return null;
  const risks = getRisks(data, dataset);

  const strategies = countBy(risks, (r) => r.respuesta);
  const stratColors = strategies.map((s, i) => colorFor(s.label, i));
  const statuses = countBy(risks, (r) => r.estado);
  const statusColors = statuses.map((_, i) => FALLBACK[i % FALLBACK.length]);

  const columns: Column<Risk>[] = [
    {
      key: "nombre", header: "Riesgo", width: "40%",
      sortValue: (r) => r.nombre, searchText: (r) => `${r.nombre} ${r.respuesta ?? ""} ${r.responsable ?? ""} ${r.estado ?? ""}`,
      render: (r) => <div className="font-medium text-ink">{truncate(r.nombre, 70)}</div>,
    },
    {
      key: "resp", header: "Estrategia", sortValue: (r) => r.respuesta ?? "",
      render: (r) => r.respuesta ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: colorFor(r.respuesta, 0) }} />
          <span className="text-slate-700">{r.respuesta}</span>
        </span>
      ) : "—",
    },
    { key: "responsable", header: "Responsable", sortValue: (r) => r.responsable ?? "", render: (r) => <span className="text-slate-600">{truncate(r.responsable, 34)}</span> },
    { key: "estado", header: "Estado", sortValue: (r) => r.estado ?? "", render: (r) => <Badge tone="accent">{r.estado ?? "—"}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Gestión de respuesta"
        title="Estrategias de respuesta al riesgo"
        description="Cómo se está respondiendo a cada riesgo y en qué estado se encuentra. El esquema admite nuevos estados (p. ej. Materializado, Incorporado) de forma automática."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        <Card className="lg:col-span-3 animate-fadeUp">
          <PanelHeader title="Distribución de Estrategias" subtitle="Mitigar · Transferir · Evitar · Aceptar (y otras)" />
          <div className="p-4"><CategoryBar data={strategies} colors={stratColors} height={280} /></div>
        </Card>
        <Card className="lg:col-span-2 animate-fadeUp">
          <PanelHeader title="Análisis de Estado" subtitle="Detectado dinámicamente" />
          <div className="p-4"><CategoryBar data={statuses} colors={statusColors} horizontal height={Math.max(180, statuses.length * 44)} /></div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {strategies.map((s, i) => (
          <Card key={s.label} className="p-4 animate-fadeUp" >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: stratColors[i] }} />
              <span className="text-[12px] font-medium text-slate-500">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-ink tnum">{s.value}</div>
            <div className="text-[11px] text-slate-400 tnum">{((s.value / risks.length) * 100).toFixed(0)}% del total</div>
          </Card>
        ))}
      </div>

      <Card className="animate-fadeUp">
        <PanelHeader title="Resumen de Respuestas" subtitle="Ordenable y con búsqueda" />
        <DataTable rows={risks} columns={columns} searchPlaceholder="Buscar por riesgo, estrategia o responsable…" initialSort={{ key: "resp", dir: "asc" }} />
      </Card>
    </div>
  );
}
