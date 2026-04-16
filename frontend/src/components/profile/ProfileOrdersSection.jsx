import { motion } from "framer-motion";
import { MapPin, Navigation, Package, Zap } from "lucide-react";
import { fmtMoney, ORDER_STATUS_STYLES } from "./gigWorkerData";

export default function ProfileOrdersSection({
  motionCustom,
  fadeUpVariants,
  orders,
  summary,
  hubTitle = "Live + sample ledger",
  hubSubtitle = "Priority orders pulse — pair with real dispatch APIs in production.",
  hubBadge = "Mixed demo",
}) {
  return (
    <motion.section
      custom={motionCustom}
      variants={fadeUpVariants}
      className="overflow-hidden rounded-3xl border border-violet-500/15 bg-gradient-to-b from-[var(--bg-card)] via-[var(--bg-dashboard)]/90 to-[var(--bg-main)] p-1 shadow-[0_24px_60px_-20px_rgba(139,92,246,0.18)]"
    >
      <div className="rounded-[1.35rem] bg-[var(--bg-glass)]/25 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25"
            >
              <Package size={20} strokeWidth={1.75} />
            </motion.div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-400/90">{hubTitle}</h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200/90">
                  {hubBadge}
                </span>
              </div>
              <p className="mt-1 text-lg font-bold text-[var(--text-bright)]">Order stream &amp; shift economics</p>
              <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">{hubSubtitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:max-w-md sm:shrink-0">
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              className="rounded-2xl border border-white/[0.06] bg-[var(--bg-glass)]/30 px-3 py-2.5 text-center"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Done</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-emerald-300">{summary.completed}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              className="rounded-2xl border border-white/[0.06] bg-[var(--bg-glass)]/30 px-3 py-2.5 text-center"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-cyan-300">{summary.live}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              className="rounded-2xl border border-white/[0.06] bg-[var(--bg-glass)]/30 px-3 py-2.5 text-center"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Gross</p>
              <p className="mt-0.5 text-sm font-black tabular-nums text-[var(--text-bright)] leading-tight">{fmtMoney(summary.gross)}</p>
            </motion.div>
          </div>
        </div>

        <ul className="mt-8 space-y-3">
          {orders.map((order, idx) => {
            const st = ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.assigned;
            const priority = Boolean(order.priority);
            return (
              <motion.li
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className={`relative rounded-2xl border bg-gradient-to-r from-[var(--bg-card)]/70 to-[var(--bg-glass)]/35 p-4 sm:p-5 ${
                  priority
                    ? "border-amber-400/40 shadow-[0_0_32px_-8px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/20"
                    : "border-[var(--border)] hover:border-violet-500/30"
                } transition-colors`}
              >
                {priority && (
                  <>
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-400/50"
                      animate={{ opacity: [0.35, 0.9, 0.35], scale: [1, 1.01, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    />
                    <div className="absolute -left-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/40">
                      <Zap size={14} />
                    </div>
                  </>
                )}
                <div className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${priority ? "pl-6" : ""}`}>
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">
                      <span className="text-xs font-black tabular-nums text-[var(--text-bright)]">{idx + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 gap-y-1">
                        <span className="font-mono text-xs font-bold text-[var(--text-muted)]">{order.id}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${st.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        {priority && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200">
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 truncate text-sm font-bold text-[var(--text-bright)] sm:text-base">{order.merchant}</p>
                      <div className="mt-2 flex flex-col gap-1 text-xs text-[var(--text-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                        <span className="inline-flex items-center gap-1.5 text-[var(--text-dim)]">
                          <MapPin size={12} className="shrink-0 text-violet-600 dark:text-violet-400/70" />
                          <span className="truncate">{order.pickup}</span>
                        </span>
                        <span className="hidden text-slate-600 sm:inline" aria-hidden>
                          →
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[var(--text-dim)]">
                          <Navigation size={12} className="shrink-0 text-cyan-600 dark:text-cyan-400/70" />
                          <span className="truncate">{order.dropoff}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[var(--border)] pt-3 lg:w-64 lg:flex-col lg:items-stretch lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="rounded-lg bg-[var(--bg-glass)]/20 px-2 py-1 font-semibold text-[var(--text-dim)]">{order.distanceKm} km</span>
                      <span className="rounded-lg bg-[var(--bg-glass)]/20 px-2 py-1 font-semibold text-[var(--text-dim)]">
                        {order.items} {order.items === 1 ? "item" : "items"}
                      </span>
                      <span className="rounded-lg bg-[var(--bg-glass)]/20 px-2 py-1 font-semibold text-[var(--text-dim)]">{order.minutesAgo}m ago</span>
                    </div>
                    <div className="text-right lg:text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Payout</p>
                      <p className="text-lg font-black tabular-nums text-emerald-300">
                        {fmtMoney(order.fee)}
                        {order.tip > 0 && (
                          <span className="ml-1.5 text-sm font-bold text-amber-200/90">+{fmtMoney(order.tip)} tip</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
