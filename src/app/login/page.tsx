"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfettiButton } from "@/components/ConfettiButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // No backend: any input (or none) is accepted and lands on the dashboard.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { window.localStorage.setItem("sgb-auth-v1", "1"); } catch { /* ignore */ }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <ShieldAlert className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink tracking-tight">Risk Office</div>
            <div className="text-[10px] text-slate-400">Sistema SGB</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ConfettiButton />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm animate-fadeUp">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-[13px] text-slate-500 mt-1.5">Ingresa tus credenciales para acceder al panel.</p>
          </div>

          <form onSubmit={submit} className="card p-6 space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tú@empresa.com"
                  className="w-full pl-9 pr-3 py-2.5 text-[14px] rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-[14px] rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg btn-accent px-4 py-2.5 text-[14px] font-medium transition-colors disabled:opacity-70"
            >
              {loading ? "Entrando…" : "Iniciar sesión"} <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-400 text-center pt-1">
              Demo sin autenticación — cualquier dato te deja entrar.
            </p>
          </form>

          <div className="text-center mt-5">
            <Link href="/" className="text-[13px] text-slate-500 hover:text-[var(--accent)] transition">← Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
