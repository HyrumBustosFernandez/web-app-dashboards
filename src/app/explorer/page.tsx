"use client";

import React, { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { getRisks, economicJustification, magnitudeBand, BAND_LABEL } from "@/lib/riskService";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { exportRiskPdf } from "@/lib/pdf";
import { formatCLP, formatDays, formatNumber, formatDate, truncate } from "@/lib/format";
import type { Risk } from "@/lib/types";
import {
  Search, FileDown, User, Tag, Activity, ShieldCheck, Wallet, GitBranch, ChevronDown,
} from "lucide-react";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-[13px] text-ink mt-0.5">{value || "—"}</div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="animate-fadeUp">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[#f0f2f6]">
        <span className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[var(--accent)]" />
        </span>
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export default function ExplorerPage() {
  const { data, dataset } = useData();
  const risks = useMemo(() => (data ? getRisks(data, dataset) : []), [data, dataset]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Reset selection when dataset changes and id no longer exists.
  const selected = risks.find((r) => r.id === selectedId) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? risks.filter((r) => r.nombre.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) : risks;
    return base.slice(0, 50);
  }, [risks, query]);

  if (!data) return null;

  const ej = selected ? economicJustification(selected, data) : null;
  const band = selected ? magnitudeBand(selected.magnitudValor, selected.magnitud) : "low";
  const bandLabel = (selected?.magnitud ?? BAND_LABEL[band]) as "Alto" | "Medio" | "Bajo";

  return (
    <div>
      <PageHeader
        eyebrow="Explorador"
        title="Explorador de riesgos"
        description="Inspecciona cualquier riesgo en detalle sin abrir Excel. Busca, selecciona y exporta un informe profesional en PDF."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Selector column */}
        <div className="space-y-4">
          <Card className="p-4 animate-fadeUp">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar riesgo…"
                className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 outline-none transition"
              />
            </div>

            {/* Dropdown selector */}
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition"
              >
                <span className={selected ? "text-ink truncate" : "text-slate-400"}>
                  {selected ? truncate(selected.nombre, 32) : "Seleccionar riesgo…"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              {open && (
                <div className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white shadow-cardhover py-1 animate-pop">
                  {matches.length === 0 && <div className="px-3 py-2 text-[12px] text-slate-400">Sin coincidencias</div>}
                  {matches.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedId(r.id); setOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-slate-50 transition ${selectedId === r.id ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-slate-700"}`}
                    >
                      <div className="truncate">{r.nombre}</div>
                      <div className="text-[10px] text-slate-400">{r.id} · {r.categoria ?? "—"}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Quick list */}
          <Card className="animate-fadeUp overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#f0f2f6] text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {risks.length} riesgos
            </div>
            <div className="max-h-[420px] overflow-auto">
              {matches.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left px-4 py-2.5 border-b border-[#f6f7f9] last:border-0 transition ${selectedId === r.id ? "bg-[var(--accent-soft)]" : "hover:bg-slate-50/70"}`}
                >
                  <div className="text-[12.5px] font-medium text-ink truncate">{truncate(r.nombre, 36)}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{r.id}</span>
                    <Badge tone={(r.magnitud as "Alto" | "Medio" | "Bajo") ?? "Bajo"}>{r.magnitud ?? "—"}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Detail column */}
        <div className="space-y-5">
          {!selected ? (
            <Card className="animate-fadeUp">
              <EmptyState message="Selecciona un riesgo desde el buscador o la lista para ver su ficha completa." />
            </Card>
          ) : (
            <>
              <Card className="p-5 animate-fadeUp">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="accent">{selected.id}</Badge>
                      <Badge tone={bandLabel}>{selected.magnitud ?? bandLabel} · {formatNumber(selected.magnitudValor)}</Badge>
                    </div>
                    <h2 className="text-xl font-bold text-ink tracking-tight">{selected.nombre}</h2>
                    <p className="text-[13px] text-slate-500 mt-1 max-w-2xl">{selected.descripcion ?? "Sin descripción registrada."}</p>
                  </div>
                  <button
                    onClick={() => exportRiskPdf(selected, data)}
                    className="btn-accent inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium shadow-sm transition shrink-0"
                  >
                    <FileDown className="w-4 h-4" /> Exportar informe PDF
                  </button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Section icon={Tag} title="Información general">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Categoría" value={selected.categoria} />
                    <Field label="Tipo" value={selected.tipo} />
                    <Field label="Estado" value={selected.estado ? <Badge tone="accent">{selected.estado}</Badge> : "—"} />
                    <Field label="Responsable" value={selected.responsable} />
                    <Field label="Fuente / Causa" value={truncate(selected.fuente, 120)} />
                    <Field label="Impacta a" value={truncate(selected.impacta, 120)} />
                  </div>
                </Section>

                <Section icon={Activity} title="Evaluación del riesgo">
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Probabilidad" value={<span>{selected.probabilidad ?? "—"}<span className="text-slate-400"> ({formatNumber(selected.valorProbabilidad)})</span></span>} />
                    <Field label="Impacto" value={<span>{selected.impacto ?? "—"}<span className="text-slate-400"> ({formatNumber(selected.valorImpacto)})</span></span>} />
                    <Field label="Magnitud" value={<Badge tone={bandLabel}>{selected.magnitud ?? bandLabel}</Badge>} />
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#f0f2f6]">
                    <Field label="Fecha estimada de ocurrencia" value={selected.cuando} />
                  </div>
                </Section>

                <Section icon={ShieldCheck} title="Gestión del riesgo">
                  <div className="space-y-4">
                    <Field label="Estrategia de respuesta" value={selected.respuesta ? <Badge tone="accent">{selected.respuesta}</Badge> : "—"} />
                    <Field label="Plan de mitigación" value={selected.planMitigacion} />
                    <Field label="Plan de contingencia" value={selected.planContingencia} />
                    <Field label="Justificación" value={selected.justificacion} />
                  </div>
                </Section>

                <Section icon={Wallet} title="Información financiera">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Costo del evento" value={<span className="tnum font-semibold">{formatCLP(selected.costoEvento)}</span>} />
                    <Field label="Clasificación" value={selected.clasificacionCosto} />
                    <Field label="Costo PERT" value={<span className="tnum font-semibold">{formatCLP(selected.pertCosto)}</span>} />
                    <Field label="Tiempo PERT" value={<span className="tnum">{formatDays(selected.pertTiempo)}</span>} />
                  </div>
                  {ej && (ej.pert || ej.roles.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-[#f0f2f6] space-y-1.5 text-[12px]">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">Desglose de costo</div>
                      {ej.pert && (
                        <div className="text-slate-600 tnum">
                          PERT: ({formatCLP(ej.pert.o)} + 4·{formatCLP(ej.pert.m)} + {formatCLP(ej.pert.p)}) / 6 = <strong>{formatCLP(ej.pert.estimate)}</strong>
                        </div>
                      )}
                      {ej.roles.map((role) => (
                        <div key={role.cargo} className="text-slate-600 tnum">
                          {truncate(role.cargo, 28)}: {formatCLP(role.costoHora)}/h · {formatCLP(role.costoHoraDia)}/día
                        </div>
                      ))}
                      {ej.impliedHours && (
                        <div className="text-slate-400 italic tnum">
                          ≈ {formatNumber(ej.impliedHours.hours, 1)} h implícitas (estimado: costo ÷ tarifa)
                        </div>
                      )}
                    </div>
                  )}
                </Section>

                <Section icon={GitBranch} title="Información del proyecto">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Etapa del proyecto" value={selected.etapaProyecto} />
                    <Field label="Ciclo de vida SW" value={selected.cicloVidaSW} />
                    <Field label="Fecha identificación" value={formatDate(selected.fechaIdentificacion)} />
                    <Field label="Fecha compromiso" value={formatDate(selected.fechaCompromiso)} />
                    <Field label="Fecha término" value={formatDate(selected.fechaTermino)} />
                    <Field label="Nº de registro" value={`#${selected.numero}`} />
                  </div>
                </Section>

                <Section icon={User} title="Comentarios y detalle">
                  <Field label="Descripción y comentarios" value={selected.descripcion} />
                </Section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
