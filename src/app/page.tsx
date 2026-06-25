"use client";

import { useData } from "@/lib/store";
import { getRisks, computeKpis, statusBuckets, countBy, magnitudeBand, BAND_LABEL } from "@/lib/riskService";
import { formatNumber } from "@/lib/format";
import { PageHeader, Card, PanelHeader } from "@/components/ui";
import { KpiCard } from "@/components/KpiCard";
import { RiskMatrix } from "@/components/charts/RiskMatrix";
import { CategoryBar } from "@/components/charts/Bars";
import {
  Layers, CheckCircle2, XCircle, Flame, Percent, Crosshair,
} from "lucide-react";

const BAND_COLORS = ["#16a34a", "#d97706", "#dc2626"];

export default function OverviewPage() {
  const { data, dataset } = useData();
  if (!data) return null;
  const risks = getRisks(data, dataset);
  const kpi = computeKpis(risks);
  const status = statusBuckets(risks);

  const categoria = countBy(risks, (r) => r.categoria);
  const etapa = countBy(risks, (r) => r.etapaProyecto);
  const ciclo = countBy(risks, (r) => r.cicloVidaSW);
  const magnitud = (["Bajo", "Medio", "Alto"] as const).map((b) => ({
    label: b,
    value: risks.filter((r) => BAND_LABEL[magnitudeBand(r.magnitudValor, r.magnitud)] === b).length,
  }));

  const isNeg = dataset === "negativos";

  return (
    <div>
      <PageHeader
        eyebrow={isNeg ? "Riesgos Negativos" : "Riesgos Positivos"}
        title="Resumen ejecutivo"
        description="Panorama general del registro de riesgos: volumen, concentración, magnitud y distribución por dimensiones clave del proyecto."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard index={0} label="Total Riesgos" value={kpi.total} icon={Layers} accent sub={`${kpi.highMagnitude} de magnitud alta`} />
        <KpiCard index={1} label="Vigentes" value={status.vigentes} icon={CheckCircle2} sub="Estado activo" />
        <KpiCard index={2} label="Caducados" value={status.caducados} icon={XCircle} sub="Cerrados / vencidos" />
        <KpiCard index={3} label="Magnitud Alta" value={kpi.highMagnitude} icon={Flame} sub="Prioridad máxima" />
        <KpiCard index={4} label="Prob. Promedio" value={formatNumber(kpi.avgProbabilidad, 2)} icon={Percent} sub="Escala 1–3" />
        <KpiCard index={5} label="Impacto Promedio" value={formatNumber(kpi.avgImpacto, 2)} icon={Crosshair} sub="Escala 1–3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Card className="lg:col-span-2 animate-fadeUp">
          <PanelHeader title="Matriz de Riesgo" subtitle="Probabilidad × Impacto · número de riesgos por celda" />
          <RiskMatrix risks={risks} />
        </Card>
        <Card className="animate-fadeUp" >
          <PanelHeader title="Distribución por Magnitud" subtitle="Clasificación Bajo / Medio / Alto" />
          <div className="p-4">
            <CategoryBar data={magnitud} colors={BAND_COLORS} height={250} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="animate-fadeUp">
          <PanelHeader title="Por Categoría" subtitle="Naturaleza del riesgo" />
          <div className="p-4"><CategoryBar data={categoria} horizontal height={Math.max(180, categoria.length * 34)} /></div>
        </Card>
        <Card className="animate-fadeUp">
          <PanelHeader title="Por Etapa del Proyecto" subtitle="Momento de ocurrencia" />
          <div className="p-4"><CategoryBar data={etapa} horizontal height={Math.max(180, etapa.length * 34)} /></div>
        </Card>
        <Card className="animate-fadeUp">
          <PanelHeader title="Por Ciclo de Vida SW" subtitle="Fase de desarrollo" />
          <div className="p-4"><CategoryBar data={ciclo} horizontal height={Math.max(180, ciclo.length * 34)} /></div>
        </Card>
      </div>
    </div>
  );
}
