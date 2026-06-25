"use client";

import React, { useState } from "react";
import type { Risk } from "@/lib/types";
import { buildMatrix, magnitudeBand, BAND_HEX } from "@/lib/riskService";
import { truncate } from "@/lib/format";

const P_LABELS: Record<number, string> = { 3: "Alta", 2: "Media", 1: "Baja" };
const I_LABELS: Record<number, string> = { 1: "Bajo", 2: "Medio", 3: "Alto" };

const cellTint: Record<string, string> = {
  low: "bg-emerald-50/70 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20",
  med: "bg-amber-50/70 hover:bg-amber-50 dark:bg-amber-500/10 dark:hover:bg-amber-500/20",
  high: "bg-red-50/70 hover:bg-red-50 dark:bg-red-500/10 dark:hover:bg-red-500/20",
};
const cellRing: Record<string, string> = {
  low: "ring-emerald-200 dark:ring-emerald-500/25",
  med: "ring-amber-200 dark:ring-amber-500/25",
  high: "ring-red-200 dark:ring-red-500/25",
};

export function RiskMatrix({ risks }: { risks: Risk[] }) {
  const cells = buildMatrix(risks);
  const [hover, setHover] = useState<{ p: number; i: number } | null>(null);
  const hovered = hover ? cells.find((c) => c.p === hover.p && c.i === hover.i) : null;

  return (
    <div className="p-5">
      <div className="flex gap-3">
        {/* Y axis label */}
        <div className="flex items-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 -rotate-90 whitespace-nowrap">
            Probabilidad
          </span>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-1.5">
            {[3, 2, 1].map((p) => (
              <React.Fragment key={p}>
                <div className="flex items-center justify-end pr-2 w-14">
                  <span className="text-[11px] font-medium text-slate-500">{P_LABELS[p]}</span>
                </div>
                {[1, 2, 3].map((i) => {
                  const cell = cells.find((c) => c.p === p && c.i === i)!;
                  const band = magnitudeBand(p * i, null);
                  const count = cell.risks.length;
                  const isHover = hover?.p === p && hover?.i === i;
                  return (
                    <button
                      key={`${p}-${i}`}
                      onMouseEnter={() => setHover({ p, i })}
                      onMouseLeave={() => setHover(null)}
                      className={`relative aspect-[1.6/1] rounded-lg ring-1 ring-inset transition-all duration-200 ${cellTint[band]} ${cellRing[band]} ${
                        isHover ? "scale-[1.03] shadow-cardhover z-10" : ""
                      }`}
                    >
                      <span
                        className="absolute inset-0 flex items-center justify-center text-xl font-bold tnum"
                        style={{ color: count ? BAND_HEX[band] : "#cbd5e1" }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
            {/* X axis labels */}
            <div />
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center pt-1">
                <span className="text-[11px] font-medium text-slate-500">{I_LABELS[i]}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Impacto</span>
          </div>
        </div>
      </div>

      {/* Legend + hover detail */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {(["low", "med", "high"] as const).map((b) => (
            <div key={b} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BAND_HEX[b] }} />
              <span className="text-[11px] text-slate-500">
                {b === "low" ? "Bajo" : b === "med" ? "Medio" : "Alto"}
              </span>
            </div>
          ))}
        </div>
        <div className="text-right min-h-[34px] flex-1">
          {hovered && hovered.risks.length > 0 ? (
            <div className="animate-fadeUp">
              <div className="text-[11px] text-slate-400 mb-0.5">
                P {P_LABELS[hovered.p]} × I {I_LABELS[hovered.i]} · {hovered.risks.length} riesgo(s)
              </div>
              <div className="text-[11.5px] text-slate-600 leading-snug">
                {truncate(hovered.risks.map((r) => r.nombre).join(" · "), 110)}
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-300">Pasa el cursor sobre una celda para ver los riesgos</span>
          )}
        </div>
      </div>
    </div>
  );
}
