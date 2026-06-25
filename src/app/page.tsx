"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ChevronLeft, ChevronRight, ArrowRight, BarChart3, ShieldCheck, Calculator } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfettiButton } from "@/components/ConfettiButton";

const SLIDES = [
  { src: "/screenshots/overview.png", title: "Resumen ejecutivo", caption: "KPIs, matriz de riesgo y distribución en un vistazo." },
  { src: "/screenshots/analysis.png", title: "Análisis profundo", caption: "Concentración por categoría, etapa y responsable." },
  { src: "/screenshots/response.png", title: "Estrategias de respuesta", caption: "Mitigar, transferir, evitar — estado y avance." },
  { src: "/screenshots/pert.png", title: "PERT y costos", caption: "Justificación económica y estimación de tiempos." },
  { src: "/screenshots/explorer.png", title: "Explorador de riesgos", caption: "Ficha detallada de cada riesgo y export a PDF." },
];

const FEATURES = [
  { icon: BarChart3, title: "Análisis visual", desc: "Gráficos y matrices que revelan la concentración del riesgo." },
  { icon: ShieldCheck, title: "Respuesta clara", desc: "Estrategias y estado de cada riesgo, siempre a la vista." },
  { icon: Calculator, title: "PERT y costos", desc: "Sustento económico para priorizar y decidir." },
];

function Carousel() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(id);
  }, [n]);

  return (
    <div className="relative">
      {/* browser-chrome framed viewport */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 h-9 border-b border-[#f0f2f6] bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-[11px] text-slate-400 truncate">riskoffice.app{SLIDES[i].src.replace("/screenshots", "").replace(".png", "")}</span>
        </div>
        <div className="relative aspect-[1440/900] bg-slate-50">
          {SLIDES.map((s, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.src}
              src={s.src}
              alt={s.title}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
      </div>

      {/* caption */}
      <div className="mt-4 text-center min-h-[44px]">
        <div className="text-[15px] font-semibold text-ink tracking-tight">{SLIDES[i].title}</div>
        <div className="text-[13px] text-slate-500 mt-0.5">{SLIDES[i].caption}</div>
      </div>

      {/* controls */}
      <button
        onClick={() => go(-1)}
        aria-label="Anterior"
        className="absolute top-[42%] -left-3 md:-left-5 -translate-y-1/2 w-10 h-10 rounded-full card flex items-center justify-center text-slate-500 hover:text-[var(--accent)] hover:-translate-y-1/2 hover:scale-105 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Siguiente"
        className="absolute top-[42%] -right-3 md:-right-5 -translate-y-1/2 w-10 h-10 rounded-full card flex items-center justify-center text-slate-500 hover:text-[var(--accent)] hover:-translate-y-1/2 hover:scale-105 transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Ir a la diapositiva ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* nav */}
      <header className="sticky top-0 z-20 h-16 bg-[var(--bg)]/85 backdrop-blur border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <ShieldAlert className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold text-ink tracking-tight">Risk Office</div>
              <div className="text-[10px] text-slate-400">Sistema SGB</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConfettiButton />
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg btn-accent px-4 py-2 text-[13px] font-medium transition-colors"
            >
              Iniciar sesión <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {/* hero */}
        <section className="pt-16 pb-10 text-center animate-fadeUp">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] ring-1 ring-inset ring-[var(--accent)]/15 px-3 py-1 text-[12px] font-medium">
            Gestión de riesgos · Proyecto SGB
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-bold text-ink tracking-tight leading-[1.1]">
            Visualiza y controla el riesgo
            <br className="hidden md:block" /> de tu proyecto
          </h1>
          <p className="mt-4 text-[15px] md:text-base text-slate-500 max-w-xl mx-auto">
            Una plataforma para analizar, responder y justificar las decisiones sobre los riesgos
            del Sistema de Gestión de Biblioteca — todo en un solo lugar.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg btn-accent px-5 py-2.5 text-[14px] font-medium transition-colors">
              Iniciar sesión <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center rounded-lg card px-5 py-2.5 text-[14px] font-medium text-ink hover:border-[var(--accent)]/30 hover:-translate-y-0.5 transition">
              Explorar demo
            </Link>
          </div>
        </section>

        {/* carousel */}
        <section className="pb-14 max-w-4xl mx-auto animate-fadeUp" style={{ animationDelay: "80ms" }}>
          <Carousel />
        </section>

        {/* features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card card-kpi p-5 animate-fadeUp hover:-translate-y-0.5 hover:shadow-cardhover transition" style={{ animationDelay: `${120 + idx * 60}ms` }}>
                <span className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px] text-[var(--accent)]" />
                </span>
                <div className="mt-3 text-[14px] font-semibold text-ink">{f.title}</div>
                <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6 py-6 text-[12px] text-slate-400">
          Risk Office · Sistema SGB — Plataforma de gestión de riesgos.
        </div>
      </footer>
    </div>
  );
}
