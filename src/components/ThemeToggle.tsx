"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";
  return (
    <button
      onClick={toggle}
      suppressHydrationWarning
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200/70 hover:text-[var(--accent)] hover:ring-[var(--accent)]/30 transition-colors ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
