"use client";

import { useData } from "@/lib/store";
import {
  getRisks, topBy, costDistribution, timeDistribution, economicJustification,
} from "@/lib/riskService";
import { PageHeader, Card, PanelHeader, EmptyState, Badge } from "@/components/ui";
import { KpiCard } from "@/components/KpiCard";
import { CategoryBar, RankingBar } from "@/components/charts/Bars";
import { formatCLP, formatCLPCompact, formatDays, formatNumber, truncate } from "@/lib/format";
import { DollarSign, Clock, TrendingUp, CheckCircle2, AlertTriangle, Calculator, ShieldAlert, PiggyBank, Wallet } from "lucide-react";

export default function PertPage() {
  const { data, dataset } = useData();
  if (!data) return null;
  const risks = getRisks(data, dataset);

  const topCost = topBy(risks, (r) => r.costoEvento, 10).map((x) => ({ label: truncate(x.risk.nombre, 34)!, value: x.value }));
  const topPertCost = topBy(risks, (r) => r.pertCosto, 10).map((x) => ({ label: truncate(x.risk.nombre, 34)!, value: x.value }));
  const topPertTime = topBy(risks, (r) => r.pertTiempo, 10).map((x) => ({ label: truncate(x.risk.nombre, 34)!, value: x.value }));
  const costDist = costDistribution(risks);
  const timeDist = timeDistribution(risks);

  const totalPert = risks.reduce((s, r) => s + (r.pertCosto ?? 0), 0);
  const totalEvent = risks.reduce((s, r) => s + (r.costoEvento ?? 0), 0);
  const avgTime = (() => {
    const t = risks.map((r) => r.pertTiempo).filter((v): v is number => v != null && v > 0);
    return t.length ? t.reduce((a, b) => a + b, 0) / t.length : 0;
  })();

  const hasPert = risks.some((r) => r.pertCosto != null);

  // Summary totals scanned from loose cells in the imported workbook. The first
  // two fall back to computed sums when the workbook has no labeled total cell.
  const totals = data.totals;
  const fmtTotal = (n: number | null | undefined) => (n == null ? "—" : formatCLP(n));
  const pertTotalFromFile = totals?.pertTotal != null;
  const riesgoTotalFromFile = totals?.riesgoTotal != null;
  const pertTotalVal = totals?.pertTotal ?? totalPert;
  const riesgoTotalVal = totals?.riesgoTotal ?? totalEvent;

  // Risks to justify: prefer PERT cost, fall back to event cost.
  const toJustify = topBy(risks, (r) => r.pertCosto ?? r.costoEvento, 12);

  return (
    <div>
      <PageHeader
        eyebrow="PERT y justificación económica"
        title="Exposición económica del proyecto"
        description="Cada valor monetario es trazable: estimaciones PERT con la fórmula (O + 4·M + P)/6, costos por evento y tarifas por rol. Sin valores inventados."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard index={0} label="Exposición PERT total" value={formatCLP(totalPert)} icon={DollarSign} accent />
        <KpiCard index={1} label="Costo de eventos total" value={formatCLP(totalEvent)} icon={TrendingUp} />
        <KpiCard index={2} label="Tiempo PERT promedio" value={formatDays(avgTime)} icon={Clock} />
        <KpiCard index={3} label="Riesgos con costo" value={risks.filter((r) => (r.pertCosto ?? r.costoEvento ?? 0) > 0).length} icon={CheckCircle2} sub={`de ${risks.length}`} />
      </div>

      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
          Totales del fondo de contingencia
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            index={0} label="PERT total" value={fmtTotal(pertTotalVal)} icon={Calculator} accent
            sub={pertTotalFromFile ? "Del archivo importado" : "Calculado (suma PERT)"}
          />
          <KpiCard
            index={1} label="Riesgo total" value={fmtTotal(riesgoTotalVal)} icon={ShieldAlert}
            sub={riesgoTotalFromFile ? "Del archivo importado" : "Calculado (suma eventos)"}
          />
          <KpiCard
            index={2} label="Costos fondo de contingencia" value={fmtTotal(totals?.fondoContingencia)} icon={PiggyBank}
            sub={totals?.fondoContingencia != null ? "Del archivo importado" : "No encontrado en el archivo"}
          />
          <KpiCard
            index={3} label="Remanente" value={fmtTotal(totals?.remanente)} icon={Wallet}
            sub={totals?.remanente != null ? "Del archivo importado" : "No encontrado en el archivo"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card className="animate-fadeUp">
          <PanelHeader title="Top Riesgos por Costo de Exposición" subtitle="Riesgo/Evento de Riesgo ($)" />
          <div className="p-4">
            {topCost.length ? <RankingBar data={topCost} valueFormatter={formatCLPCompact} /> : <EmptyState message="Sin costos de evento en este dataset." />}
          </div>
        </Card>
        <Card className="animate-fadeUp">
          <PanelHeader title="Top Riesgos por Costo PERT" subtitle="Estimación (O + 4M + P)/6" />
          <div className="p-4">
            {topPertCost.length ? <RankingBar data={topPertCost} valueFormatter={formatCLPCompact} /> : <EmptyState message="Este dataset no incluye costo PERT." />}
          </div>
        </Card>
        <Card className="animate-fadeUp">
          <PanelHeader title="Top Riesgos por Tiempo PERT" subtitle="Días estimados" />
          <div className="p-4">
            {topPertTime.length ? <RankingBar data={topPertTime} valueFormatter={(v) => formatNumber(v, 1) + " d"} color="#0ea5e9" /> : <EmptyState message="Este dataset no incluye tiempo PERT." />}
          </div>
        </Card>
        <div className="grid grid-rows-2 gap-5">
          <Card className="animate-fadeUp">
            <PanelHeader title="Distribución de Costos" />
            <div className="p-4"><CategoryBar data={costDist} height={150} /></div>
          </Card>
          <Card className="animate-fadeUp">
            <PanelHeader title="Distribución de Tiempos" />
            <div className="p-4">
              {timeDist.length ? <CategoryBar data={timeDist} height={150} colors={["#0ea5e9"]} /> : <EmptyState message="Sin datos de tiempo." />}
            </div>
          </Card>
        </div>
      </div>

      <Card className="animate-fadeUp">
        <PanelHeader
          title="Justificación económica por riesgo"
          subtitle="De dónde proviene cada monto"
          right={!hasPert ? <Badge tone="neutral">Dataset sin PERT</Badge> : undefined}
        />
        <div className="divide-y divide-[#f0f2f6]">
          {toJustify.map(({ risk }) => {
            const ej = economicJustification(risk, data);
            return (
              <div key={risk.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-ink">{risk.nombre}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{risk.id} · {risk.responsable ?? "Sin responsable"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-bold text-ink tnum">{formatCLP(risk.pertCosto ?? risk.costoEvento)}</div>
                    <div className="text-[10px] text-slate-400">{risk.pertCosto != null ? "Costo PERT" : "Costo evento"}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                  {ej.pert && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 shrink-0">Costo PERT</span>
                      <span className="text-slate-700 tnum">
                        ({formatCLP(ej.pert.o)} + 4·{formatCLP(ej.pert.m)} + {formatCLP(ej.pert.p)}) / 6 = <strong>{formatCLP(ej.pert.estimate)}</strong>
                        {ej.pert.matchesWorkbook
                          ? <span className="inline-flex items-center gap-0.5 ml-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />coincide</span>
                          : <span className="inline-flex items-center gap-0.5 ml-1 text-amber-600"><AlertTriangle className="w-3 h-3" />verificar</span>}
                      </span>
                    </div>
                  )}
                  {ej.pertTime && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 shrink-0">Tiempo PERT</span>
                      <span className="text-slate-700 tnum">
                        ({ej.pertTime.o} + 4·{ej.pertTime.m} + {ej.pertTime.p}) / 6 = <strong>{formatDays(ej.pertTime.estimate)}</strong>
                      </span>
                    </div>
                  )}
                  {ej.eventCost != null && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 shrink-0">Costo evento</span>
                      <span className="text-slate-700 tnum">{formatCLP(ej.eventCost)} {ej.clasificacion ? `· ${ej.clasificacion}` : ""}</span>
                    </div>
                  )}
                  {ej.roles.map((role) => (
                    <div key={role.cargo} className="flex items-start gap-2">
                      <span className="text-slate-400 shrink-0">Rol · {truncate(role.cargo, 22)}</span>
                      <span className="text-slate-700 tnum">{formatCLP(role.costoHora)}/h · {formatCLP(role.costoHoraDia)}/día</span>
                    </div>
                  ))}
                  {ej.impliedHours && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 shrink-0">Horas implícitas</span>
                      <span className="text-slate-500 tnum italic">
                        ≈ {formatNumber(ej.impliedHours.hours, 1)} h (estimado: costo ÷ tarifa de {truncate(ej.impliedHours.roleName, 18)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
