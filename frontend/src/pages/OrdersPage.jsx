import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  IndianRupee,
  LogOut,
  MapPin,
  Package,
  Shield,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api, getAuthHeaders } from "../utils/api";
import LiveBackground from "../components/LiveBackground";
import {
  ProfileAmbientLayer,
  ProfileOrdersSection,
  OrderToastStack,
  buildSyntheticOrders,
  summarizeOrders,
  deriveWorkerScores,
  createStreamOrder,
  buildOrdersDashboardInsights,
  fmtMoney,
  fadeUp,
  staggerWrap,
} from "../components/profile";

function normalizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    city: u.city,
    platform: u.platform,
    weekly_income: Number(u.weekly_income),
    avg_daily_deliveries: u.avg_daily_deliveries ?? 20,
    earnings_per_delivery: u.earnings_per_delivery ?? 40,
  };
}

export default function OrdersPage({ isDashboard = false }) {
  const navigate = useNavigate();
  const cached = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("aegis_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [user, setUser] = useState(() => normalizeUser(cached) || {});
  const streamSeq = useRef(0);
  const [orders, setOrders] = useState(() =>
    buildSyntheticOrders(cached.platform, cached.city, cached.earnings_per_delivery)
  );

  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem("aegis_profile_sound") !== "0";
    } catch {
      return true;
    }
  });

  const [statsPulse, setStatsPulse] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/api/users/me", { headers: getAuthHeaders() });
      const n = normalizeUser(res.data?.user);
      if (n) {
        setUser(n);
        try {
          localStorage.setItem("aegis_user", JSON.stringify(n));
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* keep cache */
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setOrders(buildSyntheticOrders(user.platform, user.city, user.earnings_per_delivery));
  }, [user.platform, user.city, user.earnings_per_delivery]);

  useEffect(() => {
    const id = window.setInterval(() => {
      streamSeq.current += 1;
      setOrders((prev) => {
        const next = [createStreamOrder(user.city, user.earnings_per_delivery, streamSeq.current), ...prev];
        return next.slice(0, 36);
      });
    }, 13000);
    return () => window.clearInterval(id);
  }, [user.city, user.earnings_per_delivery]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOrders((prev) =>
        prev.map((o, i) => {
          const minutesAgo = o.minutesAgo + 1;
          let status = o.status;
          if (o.status === "assigned" && minutesAgo > 2 && i % 4 === 0) status = "picked_up";
          else if (o.status === "picked_up" && minutesAgo > 5) status = "en_route";
          else if (o.status === "en_route" && minutesAgo > 14) status = "delivered";
          return { ...o, minutesAgo, status };
        })
      );
    }, 9000);
    return () => window.clearInterval(id);
  }, []);

  const summary = useMemo(() => summarizeOrders(orders), [orders]);
  const workerScores = useMemo(() => deriveWorkerScores(user.id), [user.id]);

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const successRateLive =
    orders.length > 0 ? Math.round((1000 * deliveredCount) / orders.length) / 10 : workerScores.successRate;

  const sessionGross = summary.gross + statsPulse;

  const ai = useMemo(
    () => buildOrdersDashboardInsights(user.city, user.platform),
    [user.city, user.platform]
  );

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const next = !v;
      try {
        localStorage.setItem("aegis_profile_sound", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const onToastPulse = useCallback((priority) => {
    setStatsPulse((p) => p + (priority ? 45 : 18));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
    navigate("/auth");
  };

  const content = (
    <div className="relative z-10 min-h-screen flex flex-col">
      <OrderToastStack enabled soundEnabled={soundOn} onPulse={onToastPulse} />

      {!isDashboard && (
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-main)]/80 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[var(--bg-main)]/65">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Link
                to="/profile"
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-glass)] to-transparent text-[var(--text-dim)] shadow-lg transition hover:border-indigo-500/40 hover:text-[var(--text-bright)]"
                aria-label="Back to profile"
              >
                <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
              </Link>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/95">Aegis Logistics</p>
                <h1 className="truncate text-lg font-extrabold tracking-tight text-[var(--text-bright)] sm:text-xl">Live orders hub</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-glass)] text-[var(--text-dim)] transition hover:border-violet-400/35 hover:text-[var(--text-bright)]"
                aria-label={soundOn ? "Mute dispatch sounds" : "Enable dispatch sounds"}
              >
                {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-glass)] px-3.5 py-2.5 text-xs font-bold text-[var(--text-main)] transition hover:border-rose-500/35 hover:bg-rose-500/[0.12] hover:text-rose-100"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`mx-auto w-full max-w-7xl flex-1 ${isDashboard ? 'px-0 py-0' : 'px-4 py-6 sm:px-8 sm:py-10'}`}>
          <motion.div initial="hidden" animate="show" variants={staggerWrap} className="space-y-8">
            <motion.div
              custom={0}
              variants={fadeUp}
              className="flex flex-col gap-4 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-dashboard)]/80 to-[var(--bg-main)] p-5 shadow-[0_24px_60px_-24px_rgba(139,92,246,0.25)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30">
                  <Package size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-300/90">Real-time stream</p>
                  <p className="mt-1 text-lg font-bold text-[var(--text-bright)] sm:text-xl">Synthetic + live-style feed</p>
                  <p className="mt-1 max-w-xl text-sm text-[var(--text-dim)]">
                    New rows append on a timer; statuses age automatically. Swap intervals for WebSocket payloads.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  Auto-refresh on
                </span>
              </div>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Orders in view",
                  value: orders.length.toLocaleString("en-IN"),
                  sub: `${summary.live} active · ${summary.completed} done`,
                  icon: Package,
                  accent: "text-violet-600 dark:text-violet-300",
                  ring: "ring-violet-500/25",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Session gross",
                  value: fmtMoney(sessionGross),
                  sub: "Fees + tips (demo)",
                  icon: IndianRupee,
                  accent: "text-emerald-600 dark:text-emerald-300",
                  ring: "ring-emerald-500/25",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Completion rate",
                  value: `${successRateLive.toFixed(1)}%`,
                  sub: "Delivered / total rows",
                  icon: Target,
                  accent: "text-cyan-600 dark:text-cyan-300",
                  ring: "ring-cyan-500/25",
                  bg: "bg-cyan-500/10",
                },
              ].map((card) => (
                <motion.div
                  key={card.label}
                  whileHover={{ scale: 1.03, y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-lg backdrop-blur-md sm:p-5"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)]">{card.label}</p>
                      <p className="mt-2 text-2xl font-black tabular-nums text-[var(--text-bright)] sm:text-3xl">{card.value}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{card.sub}</p>
                    </div>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${card.ring} ${card.bg} ${card.accent}`}>
                      <card.icon size={20} strokeWidth={1.75} />
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div custom={2} variants={fadeUp} className="grid gap-4 md:grid-cols-2">
              {[
                {
                  key: "peak",
                  title: ai.peak.title,
                  body: ai.peak.body,
                  metric: ai.peak.metric,
                  icon: Sparkles,
                  border: "border-amber-500/25",
                  glow: "from-amber-500/12",
                },
                {
                  key: "hot",
                  title: ai.hotspots.title,
                  body: ai.hotspots.body,
                  metric: ai.hotspots.metric,
                  icon: MapPin,
                  border: "border-cyan-500/25",
                  glow: "from-cyan-500/12",
                },
              ].map((c) => (
                <motion.div
                  key={c.key}
                  whileHover={{ scale: 1.01 }}
                  className={`relative overflow-hidden rounded-2xl border ${c.border} bg-[var(--bg-card)]/60 p-5 backdrop-blur-md`}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.glow} to-transparent`} />
                  <div className="relative flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-indigo-200 ring-1 ring-white/10">
                      <c.icon size={18} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--text-bright)]">AI · {c.title}</h3>
                        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-200">
                          {c.metric}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">{c.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <ProfileOrdersSection
              motionCustom={3}
              fadeUpVariants={fadeUp}
              orders={orders}
              summary={summary}
              hubTitle="Live order stream"
              hubSubtitle="Rows update on timers and new synthetic offers — mirror your dispatch socket here."
              hubBadge="Stream + demo"
            />

            <motion.footer
              custom={4}
              variants={fadeUp}
              className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 px-4 py-5 text-center sm:flex-row sm:justify-between sm:text-left"
            >
              <p className="max-w-xl text-xs leading-relaxed text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-dim)]">Demo:</span> Order stream and toasts are simulated. Wire{" "}
                <code className="text-[var(--text-dim)]">/api/orders</code> or websockets for production.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <Shield size={14} className="text-violet-500/60" /> Secure session
              </div>
            </motion.footer>
          </motion.div>
        </main>
      </div>
  );

  if (isDashboard) return content;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-indigo-500/30 relative overflow-x-hidden">
      <LiveBackground />
      <ProfileAmbientLayer />
      {content}
    </div>
  );
}
