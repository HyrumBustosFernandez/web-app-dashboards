"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { RiskDataset, DatasetKey } from "./types";

const STORAGE_KEY = "sgb-risk-dataset-v1";
const SOURCE_KEY = "sgb-risk-source-v1";

interface DataState {
  data: RiskDataset | null;
  loading: boolean;
  error: string | null;
  dataset: DatasetKey;
  source: string;                 // where current data came from
  setDataset: (k: DatasetKey) => void;
  replaceData: (d: RiskDataset, sourceName: string) => void;
  resetToSeed: () => Promise<void>;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RiskDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDatasetState] = useState<DatasetKey>("negativos");
  const [source, setSource] = useState<string>("Datos del proyecto SGB");

  const loadSeed = useCallback(async () => {
    const res = await fetch("/seed-data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar seed-data.json");
    const json = (await res.json()) as RiskDataset;
    return json;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (stored) {
          const parsed = JSON.parse(stored) as RiskDataset;
          if (!cancelled) {
            setData(parsed);
            setSource(window.localStorage.getItem(SOURCE_KEY) || "Workbook importado");
            setLoading(false);
          }
          return;
        }
        const seed = await loadSeed();
        if (!cancelled) { setData(seed); setLoading(false); }
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : "Error de carga"); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [loadSeed]);

  const setDataset = useCallback((k: DatasetKey) => setDatasetState(k), []);

  const replaceData = useCallback((d: RiskDataset, sourceName: string) => {
    setData(d);
    setSource(sourceName);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      window.localStorage.setItem(SOURCE_KEY, sourceName);
    } catch {
      // localStorage may be full or unavailable; data still lives in memory for this session.
    }
  }, []);

  const resetToSeed = useCallback(async () => {
    setLoading(true);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(SOURCE_KEY);
    } catch { /* ignore */ }
    const seed = await loadSeed();
    setData(seed);
    setSource("Datos del proyecto SGB");
    setLoading(false);
  }, [loadSeed]);

  const value = useMemo<DataState>(() => ({
    data, loading, error, dataset, source, setDataset, replaceData, resetToSeed,
  }), [data, loading, error, dataset, source, setDataset, replaceData, resetToSeed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
