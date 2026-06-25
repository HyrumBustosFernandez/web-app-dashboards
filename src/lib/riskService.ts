// The single analytical layer. Pages and charts call these pure functions —
// they never read the workbook or recompute aggregates themselves.

import type {
  Risk, PertRecord, RoleSalary, RiskDataset, DatasetKey, CountItem, KpiSet,
} from "./types";

export function getRisks(ds: RiskDataset, key: DatasetKey): Risk[] {
  return key === "negativos" ? ds.negativos : ds.positivos;
}

function safeAvg(nums: number[]): number {
  const v = nums.filter((n) => Number.isFinite(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

// ---- Magnitude banding (derived from numeric 1–3 × 1–3 scale) ----
export type Band = "low" | "med" | "high";

export function magnitudeBand(value: number | null, label: string | null): Band {
  // Prefer the workbook's own label when present; fall back to the numeric product.
  if (label) {
    const l = label.toLowerCase();
    if (l.startsWith("alt")) return "high";
    if (l.startsWith("med")) return "med";
    if (l.startsWith("baj")) return "low";
  }
  if (value === null) return "low";
  if (value >= 6) return "high";
  if (value >= 3) return "med";
  return "low";
}

export const BAND_LABEL: Record<Band, string> = { low: "Bajo", med: "Medio", high: "Alto" };
export const BAND_HEX: Record<Band, string> = { low: "#16a34a", med: "#d97706", high: "#dc2626" };

// ---- KPIs ----
export function computeKpis(risks: Risk[]): KpiSet {
  const byStatus = countBy(risks, (r) => r.estado);
  const highMagnitude = risks.filter((r) => magnitudeBand(r.magnitudValor, r.magnitud) === "high").length;
  const exposure = risks.reduce((sum, r) => sum + (r.pertCosto ?? r.costoEvento ?? 0), 0);
  return {
    total: risks.length,
    byStatus,
    highMagnitude,
    avgProbabilidad: safeAvg(risks.map((r) => r.valorProbabilidad ?? NaN)),
    avgImpacto: safeAvg(risks.map((r) => r.valorImpacto ?? NaN)),
    totalExposure: exposure,
  };
}

// Returns status counts but recognises the "vigente / caducado" family for the
// Overview KPI cards while still supporting any future status dynamically.
export function statusBuckets(risks: Risk[]) {
  const all = countBy(risks, (r) => r.estado);
  const find = (kw: string) =>
    all.filter((c) => c.label.toLowerCase().includes(kw)).reduce((s, c) => s + c.value, 0);
  return {
    all,
    vigentes: find("vigente"),
    caducados: find("caducad"),
  };
}

// ---- Generic counter ----
export function countBy(risks: Risk[], selector: (r: Risk) => string | null): CountItem[] {
  const map = new Map<string, number>();
  for (const r of risks) {
    const raw = selector(r);
    const label = raw && raw.trim() ? raw.trim() : "Sin asignar";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// ---- Rankings ----
export function topBy(
  risks: Risk[],
  metric: (r: Risk) => number | null,
  limit = 10,
): { risk: Risk; value: number }[] {
  return risks
    .map((r) => ({ risk: r, value: metric(r) ?? 0 }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// ---- Risk matrix (probability × impact, 1–3) ----
export interface MatrixCell { p: number; i: number; risks: Risk[]; band: Band; }

export function buildMatrix(risks: Risk[]): MatrixCell[] {
  const cells: MatrixCell[] = [];
  for (let p = 3; p >= 1; p--) {
    for (let i = 1; i <= 3; i++) {
      const inCell = risks.filter((r) => r.valorProbabilidad === p && r.valorImpacto === i);
      cells.push({ p, i, risks: inCell, band: magnitudeBand(p * i, null) });
    }
  }
  return cells;
}

// ---- Distributions (buckets) ----
export function bucketize(
  values: number[],
  edges: number[],
  labels: string[],
): CountItem[] {
  const counts = new Array(labels.length).fill(0);
  for (const v of values) {
    let placed = false;
    for (let b = 0; b < edges.length; b++) {
      if (v <= edges[b]) { counts[b]++; placed = true; break; }
    }
    if (!placed) counts[counts.length - 1]++;
  }
  return labels.map((label, i) => ({ label, value: counts[i] }));
}

export function costDistribution(risks: Risk[]): CountItem[] {
  const values = risks.map((r) => r.pertCosto ?? r.costoEvento ?? 0).filter((v) => v > 0);
  return bucketize(
    values,
    [1_000_000, 2_000_000, 3_000_000, Infinity],
    ["< $1M", "$1M–$2M", "$2M–$3M", "> $3M"],
  );
}

export function timeDistribution(risks: Risk[]): CountItem[] {
  const values = risks.map((r) => r.pertTiempo ?? 0).filter((v) => v > 0);
  if (values.length === 0) return [];
  return bucketize(
    values,
    [4, 7, 10, Infinity],
    ["≤ 4 d", "5–7 d", "8–10 d", "> 10 d"],
  );
}

// ---- PERT linkage & economic justification ----
export function pertForRisk(numero: number, pert: PertRecord[]): PertRecord | undefined {
  return pert.find((p) => p.numero === numero);
}

// (O + 4M + P) / 6
export function pertEstimate(o: number, m: number, p: number): number {
  return (o + 4 * m + p) / 6;
}

// Match a risk's "responsable" text to one or more salary roles (fuzzy contains).
export function matchRoles(responsable: string | null, roles: RoleSalary[]): RoleSalary[] {
  if (!responsable) return [];
  const resp = responsable
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hits = roles.filter((role) => {
    const cargo = role.cargo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const token = cargo.split(/[\s/]+/)[0];
    return resp.includes(cargo) || (token.length > 3 && resp.includes(token));
  });
  return hits;
}

export interface EconomicJustification {
  pert?: { o: number; m: number; p: number; estimate: number; matchesWorkbook: boolean };
  pertTime?: { o: number; m: number; p: number; estimate: number };
  roles: RoleSalary[];
  eventCost: number | null;
  clasificacion: string | null;
  // Illustrative hours implied by PERT cost ÷ best role hourly rate. DERIVED, not from workbook.
  impliedHours?: { rate: number; hours: number; roleName: string };
}

export function economicJustification(
  risk: Risk,
  ds: RiskDataset,
): EconomicJustification {
  const roles = matchRoles(risk.responsable, ds.roles);
  const pr = pertForRisk(risk.numero, ds.pert);
  const out: EconomicJustification = {
    roles,
    eventCost: risk.costoEvento,
    clasificacion: risk.clasificacionCosto,
  };
  if (pr && pr.costoOptimista !== null && pr.costoMasProbable !== null && pr.costoPesimista !== null) {
    const estimate = pertEstimate(pr.costoOptimista, pr.costoMasProbable, pr.costoPesimista);
    out.pert = {
      o: pr.costoOptimista, m: pr.costoMasProbable, p: pr.costoPesimista, estimate,
      matchesWorkbook: pr.costoPert !== null && Math.abs(estimate - pr.costoPert) < Math.max(1, pr.costoPert * 0.01),
    };
  }
  if (pr && pr.tiempoOptimista !== null && pr.tiempoMasProbable !== null && pr.tiempoPesimista !== null) {
    out.pertTime = {
      o: pr.tiempoOptimista, m: pr.tiempoMasProbable, p: pr.tiempoPesimista,
      estimate: pertEstimate(pr.tiempoOptimista, pr.tiempoMasProbable, pr.tiempoPesimista),
    };
  }
  const bestRole = roles.find((r) => r.costoHora && r.costoHora > 0);
  if (bestRole?.costoHora && risk.pertCosto) {
    out.impliedHours = {
      rate: bestRole.costoHora,
      hours: risk.pertCosto / bestRole.costoHora,
      roleName: bestRole.cargo,
    };
  }
  return out;
}
