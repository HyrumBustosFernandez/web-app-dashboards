"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { RiskDataset, DatasetKey } from "./types";

const STORAGE_KEY = "sgb-risk-dataset-v1";
const SOURCE_KEY = "sgb-risk-source-v1";

const NO_DATA_SOURCE = "Sin datos importados";

interface DataState {
  data: RiskDataset | null;
  loading: boolean;
  error: string | null;
  dataset: DatasetKey;
  source: string;                 // where current data came from
  setDataset: (k: DatasetKey) => void;
  replaceData: (d: RiskDataset, sourceName: string) => void;
  clearData: () => void;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RiskDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDatasetState] = useState<DatasetKey>("negativos");
  const [source, setSource] = useState<string>(NO_DATA_SOURCE);

  // No seed/base data: the tablero starts empty and only shows what the user
  // imports. A previously imported workbook is restored from localStorage.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored) as RiskDataset);
        setSource(window.localStorage.getItem(SOURCE_KEY) || "Workbook importado");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de carga");
    } finally {
      setLoading(false);
    }
  }, []);

  const setDataset = useCallback((k: DatasetKey) => setDatasetState(k), []);

  const replaceData = useCallback((d: RiskDataset, sourceName: string) => {
    setData(d);
    setSource(sourceName);
    setError(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      window.localStorage.setItem(SOURCE_KEY, sourceName);
    } catch {
      // localStorage may be full or unavailable; data still lives in memory for this session.
    }
  }, []);

  const clearData = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(SOURCE_KEY);
    } catch { /* ignore */ }
    setData(null);
    setSource(NO_DATA_SOURCE);
    setError(null);
  }, []);

  const value = useMemo<DataState>(() => ({
    data, loading, error, dataset, source, setDataset, replaceData, clearData,
  }), [data, loading, error, dataset, source, setDataset, replaceData, clearData]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
