import { motion } from "framer-motion";
import { Briefcase, Loader2, Mail, RefreshCw, Shield, Star } from "lucide-react";

function StarRow({ value }) {
  const full = Math.floor(value);
  const partial = value - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={16}
          className={
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && partial
                ? "fill-amber-400/50 text-amber-400"
                : "text-slate-600"
          }
          strokeWidth={i < full || (i === full && partial) ? 0 : 1.5}
        />
      ))}
      <span className="ml-2 text-sm font-bold tabular-nums text-[var(--text-bright)]">{value.toFixed(1)}</span>
      <span className="text-xs text-slate-500">/ 5</span>
    </div>
  );
}

export default function ProfileIdentityHero({
  motionCustom,
  fadeUpVariants,
  userLoading,
  initial,
  user,
  greeting,
  onSync,
  rating,
  trustScore,
}) {
  return (
    <motion.section
      custom={motionCustom}
      variants={fadeUpVariants}
      whileHover={{ scale: 1.006, boxShadow: "0 40px 90px -28px rgba(79, 70, 229, 0.25)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-1 shadow-[var(--shadow-premium)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-20%,rgba(99,102,241,0.22),transparent)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/4 rounded-full bg-fuchsia-600/15 blur-3xl" />

      <div className="relative rounded-[1.35rem] p-5 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-[1.5rem] bg-gradient-to-br from-amber-400/30 via-indigo-500/40 to-violet-600/30 opacity-90 blur-lg" aria-hidden />
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-slate-900 shadow-2xl ring-2 ring-white/10 sm:h-32 sm:w-32">
                {userLoading ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-11 w-11 animate-spin text-white/80" />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-black text-white sm:text-5xl">{initial}</div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-lg backdrop-blur-sm">
                <Shield size={18} />
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-sm font-medium text-indigo-300/90">{greeting}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--text-bright)] sm:text-4xl">{user.name || "Gig worker"}</h2>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-glass)] px-3 py-1 text-xs font-bold text-[var(--text-dim)]">
                  <Briefcase size={12} className="text-indigo-400" />
                  {user.platform || "Partner"}
                </span>
                {user.id != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-200">
                    ID {user.id}
                  </span>
                )}
              </div>
              {user.email ? (
                <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/[0.07] bg-[var(--bg-glass)] px-3 py-2 text-sm text-[var(--text-dim)]">
                  <Mail size={15} className="shrink-0 text-indigo-400" />
                  <span className="truncate">{user.email}</span>
                </p>
              ) : null}

              <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Customer rating</p>
                  <div className="mt-1">
                    <StarRow value={rating} />
                  </div>
                </div>
                <div className="hidden h-10 w-px bg-white/10 sm:block" aria-hidden />
                <div className="flex items-center gap-4">
                  <div
                    className="relative grid h-16 w-16 place-items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/5"
                    title="Trust score"
                  >
                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#trustGrad)"
                        strokeWidth="3"
                        strokeDasharray={`${trustScore}, 100`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="trustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="relative text-sm font-black tabular-nums text-[var(--text-bright)]">{trustScore}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Trust score</p>
                    <p className="text-sm font-bold text-emerald-300/95">Excellent band</p>
                    <p className="text-xs text-[var(--text-muted)]">On-time &amp; completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={onSync}
              disabled={userLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:border-indigo-400/40 hover:bg-indigo-500/15 disabled:opacity-45"
            >
              <RefreshCw size={15} className={userLoading ? "animate-spin" : ""} />
              Sync profile
            </button>
            <div className="rounded-2xl border border-white/[0.06] bg-[var(--bg-glass)] px-4 py-3 text-center lg:text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-sm font-bold text-emerald-300 lg:justify-start">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Online · Accepting
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
