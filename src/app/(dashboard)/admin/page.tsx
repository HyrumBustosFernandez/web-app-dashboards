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
                {/* Required-sheet validation */}
                <div className="mb-4">
                  {v.ok ? (
                    <div className="flex items-center gap-2 text-[13px] text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" /> Hojas requeridas presentes
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-[12.5px] text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Faltan hojas obligatorias: <strong>{v.missing.join(", ")}</strong>. No se puede importar.</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {v.found.map((s) => <Badge key={s} tone="accent">{s}</Badge>)}
                  </div>
                </div>

                {/* Summary counts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ["Riesgos Negativos", v.summary.negativos],
                    ["Riesgos Positivos", v.summary.positivos],
                    ["Registros PERT", v.summary.pert],
                    ["Roles / Sueldos", v.summary.roles],
                  ].map(([label, n]) => (
                    <div key={label as string} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                      <div className="text-2xl font-bold text-ink tnum">{n as number}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{label as string}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <button
                    disabled={!v.ok || busy}
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
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-[13px] font-semibold text-ink">Formato esperado</h3>
            </div>
            <ul className="text-[12.5px] text-slate-500 space-y-1.5 leading-relaxed">
              <li>· Hoja obligatoria: <strong className="text-slate-700">Riesgos Negativos</strong></li>
              <li>· Hojas opcionales: Riesgos Positivos, PERT, SUELDOS por ROLES</li>
              <li>· Encabezados detectados automáticamente por su texto</li>
              <li>· Las columnas pueden moverse: el lector las busca por nombre</li>
            </ul>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Los datos importados se guardan en el navegador (localStorage) y persisten al recargar. Consulta el README
              para migrar a almacenamiento en servidor (Vercel Blob).
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
