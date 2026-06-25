"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Risk, RiskDataset } from "./types";
import { economicJustification, magnitudeBand, BAND_LABEL } from "./riskService";
import { formatCLP, formatDays, formatNumber } from "./format";

const INK: [number, number, number] = [11, 18, 32];
const ACCENT: [number, number, number] = [79, 70, 229];
const MUTE: [number, number, number] = [100, 116, 139];

export function exportRiskPdf(risk: Risk, ds: RiskDataset) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 0;

  // Header band
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("INFORME DE RIESGO", M, 36);
  doc.setFontSize(17);
  const title = doc.splitTextToSize(risk.nombre, W - M * 2);
  doc.text(title, M, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 190, 205);
  doc.text(
    `${ds.meta.nombreProyecto}  ·  ${risk.id}  ·  Emitido ${new Date().toLocaleDateString("es-CL")}`,
    M, 84,
  );
  y = 124;

  const band = magnitudeBand(risk.magnitudValor, risk.magnitud);
  const bandHex: Record<string, [number, number, number]> = {
    low: [22, 163, 74], med: [217, 119, 6], high: [220, 38, 38],
  };

  // Quick facts row
  const facts: [string, string][] = [
    ["Categoría", risk.categoria ?? "—"],
    ["Responsable", risk.responsable ?? "—"],
    ["Estado", risk.estado ?? "—"],
    ["Respuesta", risk.respuesta ?? "—"],
    ["Magnitud", `${risk.magnitud ?? BAND_LABEL[band]}${risk.magnitudValor ? ` (${risk.magnitudValor})` : ""}`],
  ];
  autoTable(doc, {
    startY: y,
    head: [facts.map((f) => f[0])],
    body: [facts.map((f) => f[1])],
    theme: "grid",
    headStyles: { fillColor: [241, 245, 249], textColor: MUTE, fontStyle: "bold", fontSize: 7.5 },
    bodyStyles: { fontSize: 8.5, textColor: INK },
    margin: { left: M, right: M },
  });
  // @ts-expect-error autotable augments doc.lastAutoTable
  y = doc.lastAutoTable.finalY + 18;

  const section = (label: string) => {
    doc.setFillColor(...ACCENT);
    doc.rect(M, y, 4, 12, "F");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(label, M + 12, y + 10);
    y += 22;
  };

  const para = (text: string | null) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 50, 65);
    const lines = doc.splitTextToSize(text && text.trim() ? text : "—", W - M * 2);
    if (y + lines.length * 12 > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 56; }
    doc.text(lines, M, y);
    y += lines.length * 12 + 10;
  };

  section("Evaluación del riesgo");
  autoTable(doc, {
    startY: y,
    body: [
      ["Probabilidad", `${risk.probabilidad ?? "—"} (${formatNumber(risk.valorProbabilidad)})`],
      ["Impacto", `${risk.impacto ?? "—"} (${formatNumber(risk.valorImpacto)})`],
      ["Magnitud", `${risk.magnitud ?? "—"} (${formatNumber(risk.magnitudValor)})`],
    ],
    theme: "plain",
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 130, textColor: MUTE }, 1: { textColor: INK, fontStyle: "bold" } },
    margin: { left: M, right: M },
  });
  // @ts-expect-error lastAutoTable
  y = doc.lastAutoTable.finalY + 16;

  section("Plan de mitigación");
  para(risk.planMitigacion);
  section("Plan de contingencia");
  para(risk.planContingencia);
  if (risk.justificacion) { section("Justificación de la respuesta"); para(risk.justificacion); }

  // Financials
  const ej = economicJustification(risk, ds);
  section("Justificación económica");
  const finRows: string[][] = [];
  finRows.push(["Costo del evento ($)", formatCLP(risk.costoEvento)]);
  if (risk.clasificacionCosto) finRows.push(["Clasificación de costo", risk.clasificacionCosto]);
  if (ej.pert) {
    finRows.push([
      "PERT Costo  (O + 4M + P) / 6",
      `(${formatCLP(ej.pert.o)} + 4·${formatCLP(ej.pert.m)} + ${formatCLP(ej.pert.p)}) / 6 = ${formatCLP(ej.pert.estimate)}`,
    ]);
  } else if (risk.pertCosto) {
    finRows.push(["PERT Costo", formatCLP(risk.pertCosto)]);
  }
  if (ej.pertTime) {
    finRows.push([
      "PERT Tiempo  (O + 4M + P) / 6",
      `(${ej.pertTime.o} + 4·${ej.pertTime.m} + ${ej.pertTime.p}) / 6 = ${formatDays(ej.pertTime.estimate)}`,
    ]);
  } else if (risk.pertTiempo) {
    finRows.push(["PERT Tiempo", formatDays(risk.pertTiempo)]);
  }
  for (const role of ej.roles) {
    finRows.push([`Rol: ${role.cargo}`, `${formatCLP(role.costoHora)} / hora · ${formatCLP(role.costoHoraDia)} / día`]);
  }
  if (ej.impliedHours) {
    finRows.push([
      "Horas implícitas (estimado)",
      `${formatCLP(risk.pertCosto)} ÷ ${formatCLP(ej.impliedHours.rate)}/h ≈ ${formatNumber(ej.impliedHours.hours, 1)} h`,
    ]);
  }
  autoTable(doc, {
    startY: y,
    body: finRows,
    theme: "striped",
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 200, textColor: MUTE }, 1: { textColor: INK } },
    margin: { left: M, right: M },
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTE);
    doc.text(
      `${ds.meta.nombreProyecto} · Oficina de Gestión de Riesgos`,
      M, doc.internal.pageSize.getHeight() - 24,
    );
    doc.text(`${i} / ${pages}`, W - M, doc.internal.pageSize.getHeight() - 24, { align: "right" });
  }

  const safe = risk.nombre.replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
  doc.save(`Informe_Riesgo_${risk.id}_${safe}.pdf`);
}
