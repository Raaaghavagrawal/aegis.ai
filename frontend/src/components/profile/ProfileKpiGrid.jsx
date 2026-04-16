import { motion } from "framer-motion";
import { IndianRupee, Package, Target, TrendingUp, Wallet } from "lucide-react";
import { fmtMoney } from "./gigWorkerData";
import { useAnimatedInt, useAnimatedScalar } from "./useAnimatedInt";

export default function ProfileKpiGrid({
  motionCustom,
  fadeUpVariants,
  totalDeliveries,
  weekEarnings,
  successRate,
  walletBalance,
  liveOrderCount,
}) {
  const animDeliveries = useAnimatedInt(totalDeliveries, 1);
  const animWeek = useAnimatedInt(weekEarnings, 1.1);
  const animRate = useAnimatedScalar(successRate, 1);
  const walletNum = walletBalance != null && Number.isFinite(Number(walletBalance)) ? Number(walletBalance) : null;
  const animWallet = useAnimatedScalar(walletNum ?? 0, 0.9);

  const items = [
    {
      label: "Lifetime deliveries",
      value: animDeliveries.toLocaleString("en-IN"),
      sub: "All-time completed drops",
      icon: Package,
      accent: "text-violet-600 dark:text-violet-300",
      bg: "bg-violet-500/15 ring-violet-500/25",
      glow: "group-hover:shadow-[0_0_36px_-8px_rgba(167,139,250,0.45)]",
    },
    {
      label: "Session-adjusted week",
      value: fmtMoney(animWeek),
      sub: "Live ticker + account model",
      icon: IndianRupee,
      accent: "text-emerald-600 dark:text-emerald-300",
      bg: "bg-emerald-500/15 ring-emerald-500/25",
      glow: "group-hover:shadow-[0_0_36px_-8px_rgba(52,211,153,0.4)]",
    },
    {
      label: "Success rate",
      value: `${animRate.toFixed(1)}%`,
      sub: "On-time completion",
      icon: Target,
      accent: "text-cyan-600 dark:text-cyan-300",
      bg: "bg-cyan-500/15 ring-cyan-500/25",
      glow: "group-hover:shadow-[0_0_36px_-8px_rgba(34,211,238,0.35)]",
    },
    {
      label: "Wallet",
      value: walletNum != null ? fmtMoney(Math.round(animWallet)) : "—",
      sub: liveOrderCount > 0 ? `${liveOrderCount} live in queue` : "Open Orders hub for live queue",
      icon: Wallet,
      accent: "text-indigo-600 dark:text-indigo-300",
      bg: "bg-indigo-500/15 ring-indigo-500/25",
      glow: "group-hover:shadow-[0_0_36px_-8px_rgba(129,140,248,0.45)]",
    },
  ];

  return (
    <motion.div custom={motionCustom} variants={fadeUpVariants} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <motion.div
          key={item.label}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-lg shadow-black/10 backdrop-blur-md transition-colors duration-300 hover:border-indigo-400/30 sm:p-5 ${item.glow}`}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/15 blur-2xl transition-opacity group-hover:opacity-100 opacity-50"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-[var(--text-bright)] sm:text-3xl">{item.value}</p>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <TrendingUp size={12} className="text-emerald-500/80" />
                {item.sub}
              </p>
            </div>
            <motion.span
              whileHover={{ rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.45 }}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${item.bg} ${item.accent}`}
            >
              <item.icon size={20} strokeWidth={1.75} />
            </motion.span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
