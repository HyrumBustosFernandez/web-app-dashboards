"use client";

import React, { useCallback, useRef, useState } from "react";
import { useData } from "@/lib/store";
import { workbookFromBuffer, validateWorkbook, parseWorkbook, ValidationResult } from "@/lib/parser";
import { PageHeader, Card, PanelHeader, Badge } from "@/components/ui";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Trash2, X, Database,
} from "lucide-react";
import type * as XLSXType from "xlsx";
import type { RiskDataset } from "@/lib/types";

interface Staged {
  fileName: string;
  validation: ValidationResult;
  wb: XLSXType.WorkBook;
}

const SHEET_GUIDE: { name: string; required: boolean; powers: string }[] = [
  {
    name: "Riesgos Negativos",
    required: true,
    powers: "Hoja principal. Alimenta el Resumen (KPIs y matriz de riesgo), Análisis, Respuesta y el Explorador.",
  },
  {
    name: "Riesgos Positivos",
    required: false,
    powers: "Habilita el conjunto «Riesgos Positivos» del selector superior, con sus propios gráficos y tablas.",
  },
  {
    name: "PERT",
    required: false,
    powers: "Alimenta los rankings y las distribuciones de costo y tiempo de la página PERT y Costos.",
  },
  {
    name: "SUELDOS por ROLES",
    required: false,
    powers: "Aporta las tarifas por rol (sueldo, costo por hora y por día) usadas en la justificación económica.",
  },
];

function ImportGuide() {
  return (
    <Card className="mt-5 animate-fadeUp">
      <PanelHeader title="Guía de importación" subtitle="Qué archivo necesitas y qué alimenta cada hoja" />
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
            <div className="font-semibold text-ink mb-0.5">Tipo de archivo</div>
            <p className="text-slate-500">Excel <strong className="text-slate-700">.xlsx</strong> o <strong className="text-slate-700">.xls</strong>.</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
            <div className="font-semibold text-ink mb-0.5">Columnas</div>
            <p className="text-slate-500">Se detectan por el <strong className="text-slate-700">texto del encabezado</strong>; pueden cambiar de orden o de posición.</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
            <div className="font-semibold text-ink mb-0.5">Hojas faltantes</div>
            <p className="text-slate-500">Puedes importar igual; solo los gráficos de esa hoja quedarán vacíos.</p>
          </div>
        </div>

        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Hojas (pestañas) del workbook</h4>
          <div className="space-y-2">
            {SHEET_GUIDE.map((s) => (
              <div key={s.name} className="flex items-start gap-3 rounded-lg border border-[#f0f2f6] px-3 py-2.5">
                <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent)]" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">{s.name}</span>
                    <Badge tone={s.required ? "accent" : "neutral"}>{s.required ? "Principal" : "Opcional"}</Badge>
                  </div>
                  <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">{s.powers}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/15 px-3 py-3">
          <h4 className="text-[12.5px] font-semibold text-[var(--accent-strong)] mb-1">Totales del fondo de contingencia</h4>
          <p className="text-[12.5px] text-slate-600 leading-relaxed">
            Si tu archivo incluye celdas sueltas como <strong>PERT total</strong>, <strong>Riesgo total</strong>,{" "}
            <strong>Fondo de contingencia</strong> o <strong>Remanente</strong> (debajo de los riesgos, en cualquier
            posición), se detectan por su etiqueta y aparecen como tarjetas en <strong>PERT y Costos</strong>.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminPage() {
  const { data, source, replaceData, clearData } = useData();
  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState<Staged | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null); setDone(null); setStaged(null);
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setError("Formato no soportado. Usa un archivo .xlsx o .xls.");
      return;
    }
    try {
      setBusy(true);
      const buf = await file.arrayBuffer();
      const wb = workbookFromBuffer(buf);
      const validation = validateWorkbook(wb);
      setStaged({ fileName: file.name, validation, wb });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const confirmImport = useCallback(() => {
    if (!staged) return;
    setBusy(true);
    try {
      const ds: RiskDataset = parseWorkbook(staged.wb);
      replaceData(ds, staged.fileName);
      setDone(`Importado: ${staged.fileName}`);
      setStaged(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar.");
    } finally {
      setBusy(false);
    }
  }, [staged, replaceData]);

  const v = staged?.validation;

  return (
    <div>
      <PageHeader
        eyebrow="Gestión de datos"
        title="Importar registro de riesgos"
        description="Actualiza todo el tablero subiendo un nuevo workbook de Excel — sin tocar el código. Los datos se validan, se previsualizan y se conservan tras recargar."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5">
          {/* Dropzone */}
          <Card className="animate-fadeUp">
            <PanelHeader title="Subir workbook" subtitle="Arrastra y suelta o selecciona (.xlsx / .xls)" />
            <div className="p-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragging ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-white shadow-card flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <p className="text-[14px] font-medium text-ink">Arrastra tu archivo Excel aquí</p>
                <p className="text-[12px] text-slate-400 mt-1">o haz clic para buscar en tu equipo</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                />
              </div>
              {busy && <p className="text-[12px] text-slate-400 mt-3">Procesando…</p>}
              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-[12.5px] text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}
              {done && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-[12.5px] text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {done}. El tablero ya refleja los nuevos datos.
                </div>
              )}
            </div>
          </Card>

          {/* Preview / validation */}
          {staged && v && (
            <Card className="animate-fadeUp">
              <PanelHeader
                title="Vista previa del workbook"
                subtitle={staged.fileName}
                right={
                  <button onClick={() => setStaged(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-4 h-4" />
                  </button>
                }
              />
              <div className="p-5">
                {/* Banner: core sheet present or not — informational, never blocking */}
                {v.coreMissing ? (
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-[12.5px] text-amber-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Falta la hoja principal <strong>Riesgos Negativos</strong>. Puedes importar igual, pero
                      las vistas que dependen de ella quedarán vacías.
                    </span>
                  </div>
                ) : (
                  <div className="mb-4 flex items-center gap-2 text-[13px] text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Hoja principal detectada
                  </div>
                )}

                {/* Per-sheet checklist: present (✓) vs not included (✕) */}
                <div className="space-y-2">
                  {v.sheets.map((s) => (
                    <div
                      key={s.name}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
                        s.present
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-amber-50 border-amber-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {s.present
                          ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />}
                        <span className="text-[13px] font-medium text-ink truncate">{s.name}</span>
                        {s.core && <Badge tone="accent">Principal</Badge>}
                      </div>
                      <span className={`text-[12px] tnum shrink-0 ${s.present ? "text-emerald-700" : "text-amber-700"}`}>
                        {s.present ? `${s.count} registro(s)` : "No incluida"}
                      </span>
                    </div>
                  ))}
                </div>

                {v.missing.length > 0 && (
                  <p className="mt-3 text-[12px] text-slate-500">
                    Hojas no incluidas: <strong className="text-slate-700">{v.missing.join(", ")}</strong>.
                    Se importará lo disponible; sus gráficos quedarán vacíos hasta que las agregues.
                  </p>
                )}
                {!v.importable && (
                  <p className="mt-3 text-[12px] text-red-600">
                    El archivo no contiene ninguna de las hojas reconocidas, así que no hay datos para importar.
                  </p>
                )}

                <div className="flex items-center gap-2 mt-5">
                  <button
                    disabled={busy || !v.importable}
                    onClick={confirmImport}
                    className="btn-accent inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirmar e importar
                  </button>
                  <button onClick={() => setStaged(null)} className="px-4 py-2 rounded-lg text-[13px] font-medium border border-slate-200 hover:bg-slate-50 transition">
                    Cancelar
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Side info */}
        <div className="space-y-5">
          <Card className="p-5 animate-fadeUp">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-[13px] font-semibold text-ink">Fuente actual</h3>
            </div>
            <p className="text-[13px] text-slate-600">{source}</p>
            {data && (
              <button
                onClick={() => { setError(null); setDone(null); setStaged(null); clearData(); }}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border border-slate-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Borrar datos importados
              </button>
            )}
          </Card>

          <Card className="p-5 animate-fadeUp">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-[13px] font-semibold text-ink">En resumen</h3>
            </div>
            <ul className="text-[12.5px] text-slate-500 space-y-1.5 leading-relaxed">
              <li>· Archivo Excel <strong className="text-slate-700">.xlsx</strong> o <strong className="text-slate-700">.xls</strong></li>
              <li>· Encabezados detectados por su texto — las columnas pueden moverse</li>
              <li>· Puedes importar aunque falten hojas</li>
            </ul>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Los datos importados se guardan en el navegador (localStorage) y persisten al recargar.
            </p>
          </Card>
        </div>
      </div>

      <ImportGuide />
    </div>
  );
}
