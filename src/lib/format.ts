// Locale-aware formatting. The workbook is in Chilean pesos (CLP), formatted
// with '.' thousands separators — we mirror that convention.

export function formatCLP(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return "$" + Math.round(value).toLocaleString("es-CL");
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDays(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return formatNumber(value, value % 1 === 0 ? 0 : 1) + " d";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

// Compact currency for axis ticks ($3,1M etc.)
export function formatCLPCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (Math.abs(value) >= 1_000_000) return "$" + (value / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (Math.abs(value) >= 1_000) return "$" + Math.round(value / 1_000) + "K";
  return "$" + Math.round(value);
}

export function truncate(text: string | null | undefined, n: number): string {
  if (!text) return "—";
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}
