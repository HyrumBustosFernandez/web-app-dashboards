"use client";

import { useData } from "@/lib/store";
import { getRisks, countBy, magnitudeBand, BAND_LABEL } from "@/lib/riskService";
import { PageHeader, Card, PanelHeader, Badge } from "@/components/ui";
import { CategoryBar } from "@/components/charts/Bars";
import { DataTable, Column } from "@/components/DataTable";
import type { Risk } from "@/lib/types";
import { formatNumber, truncate } from "@/lib/format";

export default function AnalysisPage() {
  const { data, dataset } = useData();
  if (!data) return null;
  const risks = getRisks(data, dataset);

  const categoria = countBy(risks, (r) => r.categoria);
  const etapa = countBy(risks, (r) => r.etapaProyecto);
  const ciclo = countBy(risks, (r) => r.cicloVidaSW);
  const responsable = countBy(risks, (r) => r.responsable).slice(0, 10);

  const columns: Column<Risk>[] = [
    {
      key: "nombre", header: "Riesgo", width: "34%",
      sortValue: (r) => r.nombre, searchText: (r) => `${r.nombre} ${r.responsable ?? ""} ${r.categoria ?? ""}`,
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{truncate(r.nombre, 64)}</div>
          <div className="text-[11px] text-slate-400">{r.id}</div>
        </div>
      ),
    },
    { key: "categoria", header: "Categoría", sortValue: (r) => r.categoria ?? "", render: (r) => r.categoria ?? "—" },
    { key: "prob", header: "Prob.", align: "right", sortValue: (r) => r.valorProbabilidad ?? 0, render: (r) => formatNumber(r.valorProbabilidad) },
    { key: "imp", header: "Impacto", align: "right", sortValue: (r) => r.valorImpacto ?? 0, render: (r) => formatNumber(r.valorImpacto) },
    {
      key: "mag", header: "Magnitud", align: "right", sortValue: (r) => r.magnitudValor ?? 0,
      render: (r) => {
        const label = BAND_LABEL[magnitudeBand(r.magnitudValor, r.magnitud)] as "Alto" | "Medio" | "Bajo";
        return <Badge tone={label}>{r.magnitud ?? label} · {formatNumber(r.magnitudValor)}</Badge>;
      },
    },
    { key: "resp", header: "Responsable", sortValue: (r) => r.responsable ?? "", render: (r) => <span className="text-slate-600">{truncate(r.responsable, 30)}</span> },
    { key: "estado", header: "Estado", sortValue: (r) => r.estado ?? "", render: (r) => <Badge tone="accent">{r.estado ?? "—"}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Análisis"
        title="Análisis profundo"
        description="Concentración de riesgos por categoría, etapa, ciclo de vida y responsable, junto al ranking de mayor magnitud."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card className="animate-fadeUp">
          <PanelHeader title="Riesgos por Categoría" />
          <div className="p-4"><CategoryBar data={categoria} horizontal height={Math.max(180, categoria.length * 36)} /></div>
        </Card>
        <Card className="animate-fadeUp">
          <PanelHeader title="Riesgos por Etapa del Proyecto" />
          <div className="p-4"><CategoryBar data={etapa} horizontal height={Math.max(180, etapa.length * 36)} /></div>
        </Card>
        <Card className="animate-fadeUp">
          <PanelHeader title="Riesgos por Ciclo de Vida SW" />
          <div className="p-4"><CategoryBar data={ciclo} horizontal height={Math.max(180, ciclo.length * 36)} /></div>
        </Card>
        <Card className="animate-fadeUp">
          <PanelHeader title="Riesgos por Responsable" subtitle="Top 10 por carga" />
          <div className="p-4"><CategoryBar data={responsable} horizontal height={Math.max(180, responsable.length * 32)} /></div>
        </Card>
      </div>

      <Card className="animate-fadeUp">
        <PanelHeader title="Ranking · Riesgos por Magnitud" subtitle="Ordenable y con búsqueda" />
        <DataTable
          rows={[...risks].sort((a, b) => (b.magnitudValor ?? 0) - (a.magnitudValor ?? 0))}
          columns={columns}
          searchPlaceholder="Buscar por nombre, responsable o categoría…"
          initialSort={{ key: "mag", dir: "desc" }}
        />
      </Card>
    </div>
  );
}
