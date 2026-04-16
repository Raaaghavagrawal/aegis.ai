import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Zap } from "lucide-react";
import { playProfileChime } from "./profileChime";

const TOAST_PRESETS = [
  { title: "New offer in queue", sub: "₹72 · 1.8 km · Priority lane", priority: true },
  { title: "Batch matched", sub: "2 stops · +₹35 surge", priority: false },
  { title: "Hot zone opening", sub: "Koramangala · demand +40%", priority: false },
  { title: "Customer nearby", sub: "Pickup ready · 4 min ETA", priority: true },
  { title: "Incentive unlocked", sub: "Complete 3 more for +₹120", priority: false },
];

function randomToast(seed) {
  const i = (seed + Date.now()) % TOAST_PRESETS.length;
  const base = TOAST_PRESETS[Math.abs(i) % TOAST_PRESETS.length];
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...base,
  };
}

export default function OrderToastStack({ enabled, soundEnabled, onPulse }) {
  const [items, setItems] = useState([]);
  const seedRef = useRef(0);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const pushToast = () => {
      seedRef.current += 1;
      const t = randomToast(seedRef.current);
      setItems((prev) => [t, ...prev].slice(0, 4));
      if (soundEnabled) playProfileChime();
      onPulse?.(t.priority);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, 6800);
    };
    const id = window.setInterval(pushToast, 11000);
    const first = window.setTimeout(pushToast, 2400);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [enabled, soundEnabled, onPulse]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(100vw-2rem,340px)] flex-col-reverse gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence mode="popLayout">
        {items.map((t, idx) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 120, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.28 } }}
            transition={{ type: "spring", stiffness: 420, damping: 28, delay: idx * 0.04 }}
            style={{ y: idx * -4 }}
            className="pointer-events-auto"
          >
            <div
              className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${
                t.priority
                  ? "border-amber-400/50 bg-gradient-to-br from-amber-500/20 via-[var(--bg-dashboard)]/90 to-[var(--bg-main)] shadow-[0_0_40px_-8px_rgba(251,191,36,0.45)]"
                  : "border-[var(--border)] bg-[var(--bg-card)]/95 shadow-xl shadow-black/10"
              }`}
            >
              {t.priority && (
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-400/40"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              )}
              <div className="relative flex gap-3 p-3.5 sm:p-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                    t.priority
                      ? "bg-amber-500/25 text-amber-200 ring-amber-400/30"
                      : "bg-indigo-500/15 text-indigo-200 ring-indigo-400/25"
                  }`}
                >
                  {t.priority ? <Zap size={18} /> : <Sparkles size={18} />}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Live dispatch</p>
                    <button
                      type="button"
                      onClick={() => dismiss(t.id)}
                      className="rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-glass)] hover:text-[var(--text-bright)]"
                      aria-label="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[var(--text-bright)]">{t.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-dim)]">{t.sub}</p>
                  {t.priority && (
                    <span className="mt-2 inline-flex rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200">
                      Priority
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
