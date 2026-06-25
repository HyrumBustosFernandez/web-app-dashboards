"use client";

import React from "react";
import { PartyPopper } from "lucide-react";

const COLORS = ["#4f46e5", "#0d9488", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#ec4899", "#a855f7"];

type Particle = {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; rot: number; vr: number;
  life: number; maxLife: number; shape: number;
};

// Full-page confetti/fireworks burst, rendered on a throwaway canvas overlay.
function fireConfetti() {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  const resize = () => {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const parts: Particle[] = [];
  const burst = (cx: number, cy: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 5 + Math.random() * 7,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        shape: (Math.random() * 2) | 0,
      });
    }
  };

  // Kick off with a center pop, then a few fireworks around the page.
  const totalBursts = 6;
  let fired = 1;
  burst(w * 0.5, h * 0.42, 90);
  const burstTimer = window.setInterval(() => {
    burst(w * (0.15 + Math.random() * 0.7), h * (0.18 + Math.random() * 0.4), 60);
    fired++;
    if (fired >= totalBursts) window.clearInterval(burstTimer);
  }, 220);

  const gravity = 0.13;
  let raf = 0;
  let stopped = false;

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.clearInterval(burstTimer);
    window.removeEventListener("resize", resize);
    canvas.remove();
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++;
      p.vy += gravity;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      const t = p.life / p.maxLife;
      const alpha = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3);
      if (p.life >= p.maxLife || p.y > h + 40) { parts.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 0) {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (parts.length > 0 || fired < totalBursts) {
      raf = requestAnimationFrame(tick);
    } else {
      cleanup();
    }
  };
  raf = requestAnimationFrame(tick);

  // Safety net in case the tab was backgrounded mid-animation.
  window.setTimeout(cleanup, 7000);
}

export function ConfettiButton({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={fireConfetti}
      aria-label="Lanzar confeti"
      title="¡Celebrar!"
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200/70 hover:text-[var(--accent)] hover:ring-[var(--accent)]/30 active:scale-95 transition ${className}`}
    >
      <PartyPopper className="w-4 h-4" />
    </button>
  );
}
