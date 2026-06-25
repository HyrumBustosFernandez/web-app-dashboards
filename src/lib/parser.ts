// Excel parser. Converts a SheetJS workbook into the internal RiskDataset.
// It detects header rows and maps columns by *header text* (not fixed letters),
// so it survives minor layout changes between workbook versions.

import * as XLSX from "xlsx";
import type { Risk, PertRecord, RoleSalary, RiskDataset, ProjectMeta, ProjectTotals } from "./types";

type Row = (string | number | Date | boolean | null)[];

const SHEET = {
  negativos: "Riesgos Negativos",
  positivos: "Riesgos Positivos",
  pert: "PERT",
  sueldos: "SUELDOS por ROLES",
};

function norm(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9$]+/g, " ")    // keep '$' so "...($)" stays distinct
    .replace(/\s+/g, " ")
    .trim();
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^0-9,.\-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  return s ? s : null;
}

function toISO(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? toStr(v) : d.toISOString().slice(0, 10);
}

// Build {normalizedHeader -> columnIndex} for a given header row.
function headerMap(row: Row): Map<string, number> {
  const m = new Map<string, number>();
  row.forEach((cell, i) => {
    const key = norm(cell);
    if (key && !m.has(key)) m.set(key, i);
  });
  return m;
}

// Find the row index whose normalized cells contain ALL of the given tokens.
function findHeaderRow(rows: Row[], tokens: string[], scan = 15): number {
  for (let r = 0; r < Math.min(scan, rows.length); r++) {
    const joined = rows[r].map(norm).join(" | ");
    if (tokens.every((t) => joined.includes(t))) return r;
  }
  return -1;
}

// Resolve a column index: exact match first, then "includes" fallback.
function col(map: Map<string, number>, exact: string[], includes: string[] = []): number {
  for (const e of exact) if (map.has(e)) return map.get(e)!;
  for (const inc of includes) {
    for (const [k, idx] of map) if (k.includes(inc)) return idx;
  }
  return -1;
}

function get(row: Row, idx: number): unknown {
  return idx >= 0 && idx < row.length ? row[idx] : null;
}

function sheetRows(wb: XLSX.WorkBook, name: string): Row[] | null {
  const ws = wb.Sheets[name];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, raw: true, blankrows: false });
}

function parseRiskSheet(rows: Row[], prefix: "NEG" | "POS"): Risk[] {
  const hr = findHeaderRow(rows, ["nro", "riesgo evento de riesgo"]);
  if (hr < 0) return [];
  const m = headerMap(rows[hr]);

  const idx = {
    fechaId: col(m, [], ["fecha identificacion", "fecha"]),
    nro: col(m, ["nro"], ["nro"]),
    nombre: col(m, ["riesgo evento de riesgo"]),
    tipo: col(m, ["tipo de riesgo"], ["tipo de riesgo"]),
    categoria: col(m, ["categoria"], ["categoria"]),
    etapa: col(m, ["etapa proyecto"], ["etapa"]),
    ciclo: col(m, ["ciclo de vida sw"], ["ciclo de vida"]),
    fuente: col(m, [], ["fuente", "causa"]),
    impacta: col(m, [], ["impacta"]),
    descripcion: col(m, [], ["descripcion"]),
    prob: col(m, ["probabilidad"], []),
    valorProb: col(m, ["valor de probabilidad"], ["valor de probabilidad"]),
    imp: col(m, ["impacto"], []),
    valorImp: col(m, ["valor impacto"], ["valor impacto"]),
    magnitud: col(m, ["magnitud"], ["magnitud"]),
    pertCosto: col(m, [], ["pert costo"]),
    pertTiempo: col(m, [], ["pert tiempo"]),
    responsable: col(m, [], ["asignado", "responsable"]),
    clasifCosto: col(m, [], ["clasificacion riesgo", "clasificacion"]),
    costoEvento: col(m, ["riesgo evento de riesgo $"], ["riesgo evento de riesgo $", "$"]),
    cuando: col(m, [], ["cuando", "fecha estimada"]),
    mitigacion: col(m, [], ["planes de mitigacion", "mitigacion"]),
    contingencia: col(m, [], ["planes de contingencia", "contingencia"]),
    estado: col(m, ["estado"], ["estado"]),
    respuesta: col(m, ["respuesta al riesgo", "tipo de estrategia"], ["respuesta al riesgo", "tipo de estrategia", "estrategia"]),
    justificacion: col(m, [], ["justif"]),
    compromiso: col(m, [], ["compromiso"]),
    termino: col(m, [], ["termino"]),
  };

  const out: Risk[] = [];
  for (let r = hr + 1; r < rows.length; r++) {
    const row = rows[r];
    const numero = toNum(get(row, idx.nro));
    const nombre = toStr(get(row, idx.nombre));
    if (numero === null || !nombre) continue;
    const magnitud = toStr(get(row, idx.magnitud));
    if (magnitud && /total/i.test(magnitud)) continue; // skip summary rows
    const vp = toNum(get(row, idx.valorProb));
    const vi = toNum(get(row, idx.valorImp));
    out.push({
      id: `${prefix}-${numero}`,
      numero,
      nombre,
      tipo: toStr(get(row, idx.tipo)),
      categoria: toStr(get(row, idx.categoria)),
      etapaProyecto: toStr(get(row, idx.etapa)),
      cicloVidaSW: toStr(get(row, idx.ciclo)),
      fuente: toStr(get(row, idx.fuente)),
      impacta: toStr(get(row, idx.impacta)),
      descripcion: toStr(get(row, idx.descripcion)),
      probabilidad: toStr(get(row, idx.prob)),
      valorProbabilidad: vp,
      impacto: toStr(get(row, idx.imp)),
      valorImpacto: vi,
      magnitud,
      magnitudValor: vp !== null && vi !== null ? vp * vi : null,
      pertCosto: toNum(get(row, idx.pertCosto)),
      pertTiempo: toNum(get(row, idx.pertTiempo)),
      responsable: toStr(get(row, idx.responsable)),
      clasificacionCosto: toStr(get(row, idx.clasifCosto)),
      costoEvento: toNum(get(row, idx.costoEvento)),
      cuando: toStr(get(row, idx.cuando)),
      planMitigacion: toStr(get(row, idx.mitigacion)),
      planContingencia: toStr(get(row, idx.contingencia)),
      estado: toStr(get(row, idx.estado)),
      respuesta: toStr(get(row, idx.respuesta)),
      justificacion: toStr(get(row, idx.justificacion)),
      fechaIdentificacion: toISO(get(row, idx.fechaId)),
      fechaCompromiso: toISO(get(row, idx.compromiso)),
      fechaTermino: toISO(get(row, idx.termino)),
    });
  }
  return out;
}

function parsePert(rows: Row[]): PertRecord[] {
  const hr = findHeaderRow(rows, ["valor optimista"]);
  if (hr < 0) return [];
  const m = headerMap(rows[hr]);
  const idx = {
    no: col(m, ["no"], ["no"]),
    nombre: col(m, ["riesgo"], ["riesgo"]),
    cOpt: col(m, [], ["valor optimista"]),
    cPes: col(m, [], ["valor pesimista"]),
    cProb: col(m, [], ["valor mas probable"]),
    tOpt: col(m, [], ["tiempo optimista"]),
    tPes: col(m, [], ["tiempo pesimista"]),
    tProb: col(m, [], ["tiempo mas probable"]),
  };
  // PERT estimate columns: both contain "estimacion pert"; the cost one also says "costo".
  let cPert = -1, tPert = -1;
  for (const [k, i] of m) {
    if (k.includes("estimacion pert")) {
      if (k.includes("costo")) { if (cPert < 0) cPert = i; }
      else if (tPert < 0) tPert = i;
    }
  }

  const out: PertRecord[] = [];
  for (let r = hr + 1; r < rows.length; r++) {
    const row = rows[r];
    const numero = toNum(get(row, idx.no));
    const nombre = toStr(get(row, idx.nombre));
    if (numero === null || !nombre) continue;
    out.push({
      numero,
      nombre,
      costoOptimista: toNum(get(row, idx.cOpt)),
      costoPesimista: toNum(get(row, idx.cPes)),
      costoMasProbable: toNum(get(row, idx.cProb)),
      costoPert: cPert >= 0 ? toNum(get(row, cPert)) : null,
      tiempoOptimista: toNum(get(row, idx.tOpt)),
      tiempoPesimista: toNum(get(row, idx.tPes)),
      tiempoMasProbable: toNum(get(row, idx.tProb)),
      tiempoPert: tPert >= 0 ? toNum(get(row, tPert)) : null,
    });
  }
  return out;
}

function parseSueldos(rows: Row[]): RoleSalary[] {
  const hr = findHeaderRow(rows, ["cargo", "sueldo"]);
  if (hr < 0) return [];
  const m = headerMap(rows[hr]);
  const idx = {
    cargo: col(m, ["cargo"], ["cargo"]),
    sueldo: col(m, ["sueldo"], ["sueldo"]),
    horaDia: col(m, [], ["hora hombre", "hora dia"]),
    hora: col(m, ["x hora"], ["x hora", "por hora"]),
  };
  const out: RoleSalary[] = [];
  for (let r = hr + 1; r < rows.length; r++) {
    const row = rows[r];
    const cargo = toStr(get(row, idx.cargo));
    if (!cargo) continue;
    out.push({
      cargo,
      sueldoMensual: toNum(get(row, idx.sueldo)),
      costoHoraDia: toNum(get(row, idx.horaDia)),
      costoHora: toNum(get(row, idx.hora)),
    });
  }
  return out;
}

// Look for a number to the right of a label cell, then directly below it.
function numberRightOrBelow(rows: Row[], r: number, c: number): number | null {
  for (let j = c + 1; j < rows[r].length; j++) {
    const n = toNum(rows[r][j]);
    if (n !== null) return n;
  }
  for (let i = r + 1; i <= Math.min(r + 2, rows.length - 1); i++) {
    const n = toNum(get(rows[i], c));
    if (n !== null) return n;
  }
  return null;
}

// Scan loose summary cells by their label text, wherever they sit in the sheet.
// These totals are not part of the risk tables, so they're matched by keyword
// rather than column position. First match across the scanned sheets wins.
function scanTotals(wb: XLSX.WorkBook): ProjectTotals {
  const totals: ProjectTotals = { pertTotal: null, riesgoTotal: null, fondoContingencia: null, remanente: null };
  const sheets = [SHEET.negativos, SHEET.pert, SHEET.positivos];

  for (const name of sheets) {
    const rows = sheetRows(wb, name);
    if (!rows) continue;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const k = norm(row[c]);
        if (!k) continue;
        if (totals.pertTotal === null && k.includes("pert") && k.includes("total")) {
          totals.pertTotal = numberRightOrBelow(rows, r, c);
        }
        if (totals.riesgoTotal === null && k.includes("riesgo") && k.includes("total")) {
          totals.riesgoTotal = numberRightOrBelow(rows, r, c);
        }
        if (totals.fondoContingencia === null && k.includes("contingencia") && (k.includes("fondo") || k.includes("total"))) {
          totals.fondoContingencia = numberRightOrBelow(rows, r, c);
        }
        if (totals.remanente === null && k.includes("remanente")) {
          totals.remanente = numberRightOrBelow(rows, r, c);
        }
      }
    }
  }
  return totals;
}

function parseMeta(wb: XLSX.WorkBook): ProjectMeta {
  const rows = sheetRows(wb, SHEET.negativos) || [];
  let nombreProyecto = "Sistema SGB";
  let director: string | null = null;
  let idProyecto = "SGB";
  for (let r = 0; r < Math.min(6, rows.length); r++) {
    const line = rows[r].map(norm);
    rows[r].forEach((cell, i) => {
      const k = norm(cell);
      const next = toStr(rows[r][i + 1]) ?? toStr(rows[r][i + 2]);
      if (k.includes("nombre del proyecto") && next) nombreProyecto = next;
      if (k.includes("director de proyecto") && next) director = next;
      if (k.includes("id del proyecto") && next) idProyecto = next;
    });
    void line;
  }
  return { idProyecto, nombreProyecto, director };
}

export interface SheetCheck {
  name: string;
  present: boolean;
  core: boolean;       // the main sheet the rest of the app depends on
  count: number;       // rows parsed (0 when absent)
}

export interface ValidationResult {
  importable: boolean;     // at least one recognized sheet is present
  coreMissing: boolean;    // the main "Riesgos Negativos" sheet is absent
  sheets: SheetCheck[];    // status of every expected sheet
  found: string[];
  missing: string[];       // expected sheets that are absent
  summary: { negativos: number; positivos: number; pert: number; roles: number };
}

export function validateWorkbook(wb: XLSX.WorkBook): ValidationResult {
  const names = wb.SheetNames;

  const negRows = sheetRows(wb, SHEET.negativos);
  const posRows = sheetRows(wb, SHEET.positivos);
  const pertRows = sheetRows(wb, SHEET.pert);
  const roleRows = sheetRows(wb, SHEET.sueldos);

  const summary = {
    negativos: negRows ? parseRiskSheet(negRows, "NEG").length : 0,
    positivos: posRows ? parseRiskSheet(posRows, "POS").length : 0,
    pert: pertRows ? parsePert(pertRows).length : 0,
    roles: roleRows ? parseSueldos(roleRows).length : 0,
  };

  const sheets: SheetCheck[] = [
    { name: SHEET.negativos, present: names.includes(SHEET.negativos), core: true, count: summary.negativos },
    { name: SHEET.positivos, present: names.includes(SHEET.positivos), core: false, count: summary.positivos },
    { name: SHEET.pert, present: names.includes(SHEET.pert), core: false, count: summary.pert },
    { name: SHEET.sueldos, present: names.includes(SHEET.sueldos), core: false, count: summary.roles },
  ];

  const found = sheets.filter((s) => s.present).map((s) => s.name);
  const missing = sheets.filter((s) => !s.present).map((s) => s.name);

  return {
    importable: found.length > 0,
    coreMissing: !names.includes(SHEET.negativos),
    sheets,
    found,
    missing,
    summary,
  };
}

export function workbookFromBuffer(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: "array", cellDates: true });
}

export function parseWorkbook(wb: XLSX.WorkBook): RiskDataset {
  const negRows = sheetRows(wb, SHEET.negativos) || [];
  const posRows = sheetRows(wb, SHEET.positivos) || [];
  const pertRows = sheetRows(wb, SHEET.pert) || [];
  const roleRows = sheetRows(wb, SHEET.sueldos) || [];
  return {
    meta: parseMeta(wb),
    negativos: parseRiskSheet(negRows, "NEG"),
    positivos: parseRiskSheet(posRows, "POS"),
    pert: parsePert(pertRows),
    roles: parseSueldos(roleRows),
    totals: scanTotals(wb),
  };
}
