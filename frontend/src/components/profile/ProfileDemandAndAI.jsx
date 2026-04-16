import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  Area,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Brain, CloudRain, LineChart, Sparkles } from "lucide-react";
import { buildAIInsightCopy } from "./gigWorkerData";

const tooltipContentStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "var(--text-bright)",
};

export default function ProfileDemandAndAI({
  motionCustom,
  fadeUpVariants,
  hourlyDemand,
  city,
  platform,
  scores,
}) {
  const ai = buildAIInsightCopy(city, platform, scores);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFocusIdx((i) => (i + 1) % 3);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  const cards = [
    {
      key: "peak",
      title: ai.peakHours.title,
      body: ai.peakHours.body,
      metric: ai.peakHours.metric,
      icon: Sparkles,
      border: "border-amber-500/20",
      glow: "from-amber-500/10",
      neon: "shadow-[0_0_28px_-6px_rgba(251,191,36,0.35)]",
    },
    {
      key: "risk",
      title: ai.risk.title,
      body: ai.risk.body,
      metric: ai.risk.metric,
      icon: ai.risk.variant === "warn" ? CloudRain : Brain,
      border: ai.risk.variant === "warn" ? "border-orange-500/25" : "border-cyan-500/20",
      glow: ai.risk.variant === "warn" ? "from-orange-500/10" : "from-cyan-500/10",
      neon: "shadow-[0_0_28px_-6px_rgba(34,211,238,0.25)]",
    },
    {
      key: "earn",
      title: ai.earnings.title,
      body: ai.earnings.body,
      metric: ai.earnings.metric,
      icon: LineChart,
      border: "border-emerald-500/20",
      glow: "from-emerald-500/10",
      neon: "shadow-[0_0_28px_-6px_rgba(52,211,153,0.3)]",
    },
  ];

  return (
    <motion.div
      custom={motionCustom}
      variants={fadeUpVariants}
      className="grid gap-6 lg:grid-cols-5 lg:items-stretch"
    >
      <motion.div
        layout
        className="relative flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-1 shadow-xl lg:col-span-3"
        whileHover={{ scale: 1.005 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <div className="rounded-[1.35rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 4, -4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/25"
              >
                <LineChart size={18} />
              </motion.div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Demand radar</h3>
                <p className="text-base font-bold text-[var(--text-bright)]">Demand Forecast Cycle</p>
              </div>
            </div>
            <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-indigo-200/90">
              Live Forecast
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--text-dim)] font-medium">Detailed rolling 24-hour intensity map — updated in real-time.</p>
          <div className="mt-6 h-[220px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <ComposedChart data={hourlyDemand} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="demandBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="short"
                  interval={3}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  formatter={(v) => [`${v} intensity`, "Platform Load"]}
                  labelFormatter={(l) => `Time Window: ${l}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="demand" 
                  stroke="none" 
                  fill="url(#areaGlow)" 
                />
                <Bar
                  dataKey="demand"
                  fill="url(#demandBar)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive
                  animationDuration={1500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        {cards.map((card, idx) => {
          const active = focusIdx === idx;
          return (
            <motion.div
              key={card.key}
              layout
              animate={
                active
                  ? {
                      scale: 1.02,
                      boxShadow: "0 0 32px -4px rgba(99, 102, 241, 0.35)",
                    }
                  : { scale: 1, boxShadow: "0 0 0 transparent" }
              }
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className={`relative overflow-hidden rounded-2xl border ${card.border} bg-[var(--bg-card)]/65 p-4 backdrop-blur-md sm:p-5 ${active ? `${card.neon} ring-1 ring-indigo-400/30` : ""}`}
            >
              <AnimatePresence mode="wait">
                {active && (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-3 top-3 rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-indigo-200"
                  >
                    AI focus
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glow} to-transparent opacity-90`} />
              <motion.div
                className="relative flex gap-3"
                initial={false}
                animate={{ x: active ? 2 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <motion.span
                  animate={active ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 0.6 }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-indigo-200 ring-1 ring-white/10"
                >
                  <card.icon size={18} strokeWidth={1.75} />
                </motion.span>
                <div className="min-w-0 flex-1 pr-14">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-[var(--text-bright)]">{card.title}</h4>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300/90">
                      {card.metric}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-dim)] sm:text-sm">{card.body}</p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
