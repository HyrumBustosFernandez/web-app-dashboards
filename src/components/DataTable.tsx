"use client";

import React, { useMemo, useState } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { EmptyState } from "./ui";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  searchText?: (row: T) => string;
}

export function DataTable<T>({
  rows, columns, searchPlaceholder = "Buscar…", initialSort, pageSize = 12, onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  onRowClick?: (row: T) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((c) => {
        const text = c.searchText ? c.searchText(row) : String(c.sortValue ? c.sortValue(row) : "");
        return text.toLowerCase().includes(q);
      }),
    );
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const arr = [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "es");
    });
    return sort.dir === "desc" ? arr.reverse() : arr;
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  };

  return (
    <div>
      <div className="px-5 py-3 border-b border-[#f0f2f6] flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 outline-none transition"
          />
        </div>
        <span className="text-[11px] text-slate-400 tnum">{sorted.length} registro(s)</span>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState message="No hay resultados para tu búsqueda." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#f0f2f6]">
                {columns.map((c) => {
                  const isSorted = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      style={{ width: c.width }}
                      className={`px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wide text-slate-400 ${
                        c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {c.sortValue ? (
                        <button
                          onClick={() => toggleSort(c.key)}
                          className={`inline-flex items-center gap-1 hover:text-slate-600 transition ${c.align === "right" ? "flex-row-reverse" : ""}`}
                        >
                          {c.header}
                          {isSorted ? (
                            sort!.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, ri) => (
                <tr
                  key={ri}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-[#f6f7f9] last:border-0 ${onRowClick ? "cursor-pointer hover:bg-slate-50/70" : ""} transition-colors`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-2.5 text-slate-700 ${
                        c.align === "right" ? "text-right tnum" : c.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="px-5 py-3 border-t border-[#f0f2f6] flex items-center justify-between text-[12px] text-slate-500">
          <span>Página {safePage + 1} de {pageCount}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2.5 py-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >Anterior</button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="px-2.5 py-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
