import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CloudRain,
  Gauge,
  IndianRupee,
  LineChart as LineIcon,
  LogOut,
  MapPin,
  Newspaper,
  Search,
  RefreshCcw,
  Shield,
  TrendingUp,
  Wallet as WalletIcon,
  Wind,
  Zap,
  Menu,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, getAuthHeaders } from "../utils/api";
import {
  buildExplainableInsights,
  buildSyncedAnalysisFromEnvSnapshot,
  getAqiLabel,
  buildTenMinuteSlotSeries,
  describeRiskWindowTrend,
  buildExtendedPolicyRecommendation,
  systemLogMatchesCity,
} from "../utils/insights";

/** Bucket width for overview + AI risk env charts (wall-clock aligned). */
const SLOT_INTERVAL_MINUTES = 20;
const ENV_CHART_SLOTS = 8;

function formatTime(time) {
  if (!time) return "—";
  const d = new Date(time);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString();
}

function formatTenMinAxis(bucketKeyMs) {
  return new Date(Number(bucketKeyMs)).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("gigshield_user") || "{}");
  const [city, setCity] = useState(user.city || "Delhi");
  const [income, setIncome] = useState(user.weekly_income || 5000);
  const [sideQuery, setSideQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [systemData, setSystemData] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);

  /** Time-series points (oldest → newest): rainfall, aqi, risk_score, loss, timestamp */
  const [envData, setEnvData] = useState([]);
  /** Latest unified snapshot from GET /api/environment/:city (AI + live) */
  const [envSnapshot, setEnvSnapshot] = useState(null);
  /** Bumps on each 20‑minute wall-clock boundary so line + bar series refresh together. */
  const [chartVarianceTick, setChartVarianceTick] = useState(0);

  useEffect(() => {
    const ms = SLOT_INTERVAL_MINUTES * 60 * 1000;
    const msUntilNextBoundary = ms - (Date.now() % ms);
    let intervalId;
    const timeoutId = setTimeout(() => {
      setChartVarianceTick((n) => n + 1);
      intervalId = setInterval(() => setChartVarianceTick((n) => n + 1), ms);
    }, msUntilNextBoundary);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const [forecast, setForecast] = useState(null);

  const fetchForecast = useCallback(() => {
    if (!user?.id) return;
    fetch(`/api/ai/forecast/${user.id}`)
      .then(res => res.json())
      .then(data => {
        console.log("ML FORECAST:", data);
        setForecast(data);
      })
      .catch(err => console.error("Forecast Error:", err));
  }, [user?.id]);

  useEffect(() => {
    fetchForecast();
    const intervalId = setInterval(fetchForecast, 10000);
    return () => clearInterval(intervalId);
  }, [fetchForecast]);

  const chartData = useMemo(() => {
    return buildTenMinuteSlotSeries(envData, envSnapshot, ENV_CHART_SLOTS, {
      varianceTick: chartVarianceTick,
      slotMinutes: SLOT_INTERVAL_MINUTES,
    }).map(({ bucketKey, risk, loss }) => ({ 
      bucketKey, 
      risk, 
      loss,
      predicted_loss: forecast ? forecast.loss_percentage : loss
    }));
  }, [envData, envSnapshot, chartVarianceTick, forecast]);

  const explainableInsights = useMemo(
    () => buildExplainableInsights(analysis),
    [analysis]
  );

  const riskWindowTrend = useMemo(
    () => describeRiskWindowTrend(chartData),
    [chartData]
  );

  const extendedPolicyText = useMemo(
    () => buildExtendedPolicyRecommendation(analysis),
    [analysis]
  );

  const signalLogsForCity = useMemo(() => {
    const c = String(city ?? "").trim();
    if (!c) return systemLogs;
    return systemLogs.filter((log) => systemLogMatchesCity(log.message, c));
  }, [systemLogs, city]);

  const envLoadMeters = useMemo(() => {
    const aq = Number(analysis?.weather?.aqi ?? envSnapshot?.aqi ?? 0);
    const rf = Number(analysis?.weather?.rainfall ?? envSnapshot?.rainfall ?? 0);
    const cond = analysis?.weather?.condition || envSnapshot?.condition || "—";
    return {
      aq,
      rf,
      cond,
      aqiPct: Math.min(100, Math.round((aq / 300) * 100)),
      rainPct: Math.min(100, Math.round((rf / 50) * 100)),
      nearRainTrigger: rf > 35,
      nearAqiTrigger: aq > 200,
      cityLabel: analysis?.city || envSnapshot?.city || city,
    };
  }, [analysis, envSnapshot, city]);

  const factorAssessmentExtras = useMemo(() => {
    const aq = Number(analysis?.weather?.aqi ?? envSnapshot?.aqi);
    const rf = Number(analysis?.weather?.rainfall ?? envSnapshot?.rainfall);
    const atmosphericBuffer =
      Number.isFinite(aq) && aq >= 0
        ? Math.max(0, Math.min(100, Math.round(100 - (aq / 300) * 100)))
        : null;
    const hydricLoad =
      Number.isFinite(rf) && rf >= 0
        ? Math.max(0, Math.min(100, Math.round((rf / 50) * 100)))
        : null;

    let aiEnsembleTrust = null;
    const conf = envSnapshot?.confidence;
    if (conf != null && conf !== "") {
      const c = Number(conf);
      if (Number.isFinite(c)) {
        aiEnsembleTrust = Math.round(c <= 1 ? c * 100 : Math.min(100, c));
      }
    }

    const ev = Number(systemData?.events_today) || 0;
    const po = Number(systemData?.payouts_today) || 0;
    const clusterPulse =
      systemData != null
        ? Math.min(100, Math.round(22 + ev * 12 + po * 20))
        : null;

    const temp = Number(envSnapshot?.temperature);
    const thermalStability = Number.isFinite(temp)
      ? Math.max(0, Math.min(100, Math.round(100 - (Math.abs(temp - 26) / 18) * 100)))
      : null;

    const exposureLoad =
      analysis?.expected_loss_pct != null && Number.isFinite(Number(analysis.expected_loss_pct))
        ? Math.max(0, Math.min(100, Math.round(Number(analysis.expected_loss_pct))))
        : null;

    return {
      atmosphericBuffer,
      hydricLoad,
      aiEnsembleTrust,
      clusterPulse,
      thermalStability,
      exposureLoad,
    };
  }, [analysis, envSnapshot, systemData]);

  const loadWallet = async () => {
    if (!user?.id) return;
    try {
      const balanceRes = await api.get(`/wallet/${user.id}`, {
        headers: getAuthHeaders(),
      });
      const payoutsRes = await api.get(`/payouts/${user.id}`, {
        headers: getAuthHeaders(),
      });
      setWallet({
        wallet_balance: balanceRes.data.balance,
        payouts: payoutsRes.data
      });
    } catch (e) {
      console.error("Wallet Fetch Error:", e);
      setWallet(null);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const [theme, setTheme] = useState("dark");
  const [stats, setStats] = useState({ totalUsers: 0, totalPayouts: 0, protectedIncome: 0 });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/stats/dashboard", { headers: getAuthHeaders() });
      const d = res.data || {};
      
      // Update global system metrics
      setStats({
        totalUsers: d.system_stats?.total_users || 0,
        totalPayouts: d.system_stats?.total_payouts || 0,
        activeUsers: d.system_stats?.active_users || 0,
        protectedIncome: d.system_stats?.protected_income || 0,
      });

      // Update personalized AI environment metrics
      if (d.environment) {
        setEnvSnapshot({
          ...d.environment,
          risk_score: d.ai_metrics?.risk_score,
          risk_level: d.ai_metrics?.risk_level,
          confidence: d.ai_metrics?.confidence,
          explanation: d.ai_metrics?.explanation
        });
      }

      // Update wallet balance from the unified response
      if (d.user) {
        setWallet(prev => ({
          ...prev,
          wallet_balance: d.user.wallet_balance
        }));
      }

    } catch (e) {
      console.error("Unified Statistics Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh unified stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchEnvData = async (targetCity) => {
    try {
      const t = Date.now();
      const [res, historyRes] = await Promise.all([
        api.get(`/api/environment/${targetCity}`, { headers: getAuthHeaders() }),
        api.get(`/api/environment/${targetCity}/history?t=${t}`, { headers: getAuthHeaders() }),
      ]);
      const raw = Array.isArray(historyRes.data) ? historyRes.data : [];
      const series = [...raw].reverse();
      console.log("TIME SERIES:", series);
      setEnvData(series);
      setEnvSnapshot(res.data);
    } catch (e) {
      console.error("Fetch Data Error:", e);
    }
  };

  const fetchSystemData = async () => {
    try {
      const statusRes = await api.get("/api/system/status", { headers: getAuthHeaders() });
      setSystemData(statusRes.data);
      const logsRes = await api.get("/api/system/logs", { headers: getAuthHeaders() });
      const list = Array.isArray(logsRes.data) ? logsRes.data : [];
      const uniqueLogs = Array.from(new Map(list.map((item) => [item.message, item])).values());
      setSystemLogs(uniqueLogs);
    } catch (e) {
      console.error("System Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  /** Same 20‑minute X grid as AI Risk (aligned wall‑clock buckets). */
  const barData = useMemo(() => {
    return buildTenMinuteSlotSeries(envData, envSnapshot, ENV_CHART_SLOTS, {
      varianceTick: chartVarianceTick,
      slotMinutes: SLOT_INTERVAL_MINUTES,
    }).map(({ bucketKey, rainfall, aqi }) => ({ bucketKey, rainfall, aqi }));
  }, [envData, envSnapshot, chartVarianceTick]);

  /** Four risk channels, normalized to ~100% so every slice stays visible and color-distinct. */
  const pieData = useMemo(() => {
    if (!envSnapshot) return [];

    const aq = Math.max(0, Number(envSnapshot.aqi) || 0);
    const rf = Math.max(0, Number(envSnapshot.rainfall) || 0);
    const tempRaw = Number(envSnapshot.temperature);
    const tempN = Number.isFinite(tempRaw) ? tempRaw : 26;
    const riskScr = Math.max(
      0,
      Math.min(
        100,
        Number(
          envSnapshot.risk_score ??
            analysis?.risk?.risk_score ??
            0
        )
      )
    );

    const wAtmos = 6 + (aq / 300) * 94;
    const wHydro = 6 + Math.min(1, rf / 50) * 94;
    const wThermal = 6 + (Math.min(Math.abs(tempN - 26), 22) / 22) * 94;
    const wSystem = 6 + (riskScr / 100) * 94;

    const total = wAtmos + wHydro + wThermal + wSystem || 1;

    const toPct = (w) => Math.round((w / total) * 1000) / 10;
    const slices = [
      {
        name: "Atmospheric",
        color: "#6366f1",
        value: toPct(wAtmos),
        detail: `AQI ${aq} · ${envSnapshot.pollution_level || "—"}`,
      },
      {
        name: "Precipitation",
        color: "#a78bfa",
        value: toPct(wHydro),
        detail: `${rf} mm vs 50 mm gate`,
      },
      {
        name: "Thermal",
        color: "#14b8a6",
        value: toPct(wThermal),
        detail: `${tempN.toFixed(1)}°C vs 26°C baseline`,
      },
      {
        name: "Systemic",
        color: "#f59e0b",
        value: toPct(wSystem),
        detail: `Risk score ${riskScr}/100`,
      },
    ];

    let sum = slices.reduce((s, x) => s + x.value, 0);
    if (Math.abs(sum - 100) > 0.05 && slices.length) {
      slices[slices.length - 1] = {
        ...slices[slices.length - 1],
        value: Math.round((slices[slices.length - 1].value + (100 - sum)) * 10) / 10,
      };
    }

    return slices;
  }, [envSnapshot, analysis]);

  /** Real cumulative payouts from ledger, or indicative accrual curve when no events yet. */
  const financialMomentumChart = useMemo(() => {
    const payouts = wallet?.payouts;
    if (Array.isArray(payouts) && payouts.length > 0) {
      const sorted = [...payouts].sort(
        (a, b) => new Date(a.event_date) - new Date(b.event_date)
      );
      let cumulative = 0;
      const series = sorted.map((p) => {
        cumulative += Number(p.amount);
        return {
          name: new Date(p.event_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          val: cumulative,
        };
      });
      return { series, isReal: true };
    }

    const weekly = Math.max(Number(income) || 0, 1);
    const step = Math.max(weekly * 0.05, 75);
    const series = [];
    let cum = 0;
    for (let i = 0; i < 8; i++) {
      const wobble = Math.sin(i * 1.17 + chartVarianceTick * 0.25) * (weekly * 0.015);
      cum += Math.max(0, step + wobble);
      series.push({ name: `Wk ${i + 1}`, val: Math.round(cum) });
    }
    return { series, isReal: false };
  }, [wallet, income, chartVarianceTick]);

  useEffect(() => {
    fetchEnvData(city);
    const interval = setInterval(() => fetchEnvData(city), 5000);
    return () => clearInterval(interval);
  }, [city]);

  useEffect(() => {
    const next = buildSyncedAnalysisFromEnvSnapshot(envSnapshot, { income, city });
    if (next) setAnalysis(next);
  }, [envSnapshot, income, city]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      await fetchEnvData(city);
      await loadWallet();
    } catch (err) {
      setError("Environmental update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gigshield_token");
    localStorage.removeItem("gigshield_user");
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 fixed h-full bg-[#0B0F19] border-r border-gray-800 hidden md:flex flex-col z-50 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 transition-transform duration-300 hover:scale-[1.02]">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.2)]">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">GigShield.AI</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">Parametric Net</p>
            </div>
          </div>

          <div className="relative mb-8 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-indigo-400" size={14} />
            <input
              value={sideQuery}
              onChange={(e) => setSideQuery(e.target.value)}
              placeholder="Search engine..."
              className="w-full bg-[#111827] border border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-indigo-600 focus:bg-indigo-950/20 transition-all"
            />
          </div>

          <nav className="space-y-1.5">
            <NavItem
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={<TrendingUp size={18} />}
              label="Overview"
            />
            <NavItem
              active={activeTab === "risk"}
              onClick={() => setActiveTab("risk")}
              icon={<Gauge size={18} />}
              label="AI Risk Matrix"
            />
            <NavItem
              active={activeTab === "wallet"}
              onClick={() => setActiveTab("wallet")}
              icon={<WalletIcon size={18} />}
              label="Payout Ledger"
            />
            <NavItem
              active={activeTab === "news"}
              onClick={() => setActiveTab("news")}
              icon={<Newspaper size={18} />}
              label="Live Updates"
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-800/60">
          <div className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20 shadow-inner">
                {user.name?.[0] || 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-white uppercase tracking-wide">{user.name || "Gig Worker"}</p>
                <p className="text-[10px] text-gray-500 truncate leading-tight mt-0.5">{user.platform || "Platform Partner"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-black/30 px-2 py-1.5 rounded-lg border border-white/5">
              <MapPin size={10} className="text-indigo-400" /> {user.city || city}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="md:ml-64 flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#0B0F19]/90 backdrop-blur-xl sticky top-0 z-40 transition-all">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-gray-400 hover:text-white transition">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold tracking-tight text-white leading-none">
              {activeTab === "overview" && "Unified Dashboard"}
              {activeTab === "risk" && "Intelligence Engine"}
              {activeTab === "wallet" && "Financial Ledger"}
              {activeTab === "news" && "System Updates"}
            </h2>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></div>
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.1em]">Signal Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/5 rounded-xl transition-all duration-300"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-gray-800 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 text-xs font-bold rounded-xl transition-all duration-300 group hover:scale-[1.02]"
            >
              <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" /> Sign Out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6 flex-1 bg-[#0B0F19]">
          {activeTab === "overview" && (
            <>
              {/* Top Section - 2:1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 hover:shadow-xl transition-all duration-300 group h-full flex flex-col items-center justify-center text-center">
                  <div className="flex flex-col items-center mb-8 w-full">
                    <div className="text-center">
                      <p className="text-sm text-gray-400 font-medium tracking-wide">Net Protected Forecast</p>
                      <h3 className="text-4xl font-bold mt-2 text-white tracking-tighter">
                        {forecast?.net_protected_forecast ? `₹${forecast.net_protected_forecast}` : "Forecast unavailable"}
                      </h3>
                      {forecast && (
                        <div className="mt-4 flex flex-wrap justify-center items-center gap-6 text-sm">
                          <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Weekly Income</span>
                            <span className="text-white font-bold">₹{forecast.weekly_income}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Estimated Loss</span>
                            <span className="text-rose-400 font-bold drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]">₹{forecast.estimated_loss}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">AI Confidence</span>
                            <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{Math.round((forecast.confidence || 0) * 100)}%</span>
                          </div>
                        </div>
                      )}
                      {!forecast && (
                        <div className="flex justify-center mt-3">
                          <p className={`flex items-center gap-1.5 text-[11px] font-black w-fit px-3 py-1 rounded border ${(analysis?.risk?.risk_level ?? envSnapshot?.risk_level) === 'High' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>
                            {(analysis?.risk?.risk_level ?? envSnapshot?.risk_level) === 'High' ? <Zap size={10} /> : <TrendingUp size={10} />}
                            {(analysis?.risk?.risk_level ?? envSnapshot?.risk_level) === 'High' ? "CRITICAL RISK DETECTED" : "STABLE OPERATIONS"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-64 w-full min-h-[256px]">
                    {barData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        No live data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                          <XAxis
                            dataKey="bucketKey"
                            type="category"
                            tickFormatter={formatTenMinAxis}
                            stroke="#374151"
                            fontSize={9}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            minTickGap={4}
                            height={52}
                            angle={-18}
                            textAnchor="end"
                            tick={{ fill: "#6b7280" }}
                          />
                          <YAxis
                            yAxisId="rain"
                            stroke="#6366f1"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                            domain={[0, "auto"]}
                            tick={{ fill: "#818cf8" }}
                            label={{ value: "mm", position: "insideTopLeft", fill: "#6366f1", fontSize: 10 }}
                          />
                          <YAxis
                            yAxisId="aqi"
                            orientation="right"
                            stroke="#a78bfa"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                            domain={[0, "auto"]}
                            tick={{ fill: "#c4b5fd" }}
                            label={{ value: "AQI", position: "insideTopRight", fill: "#a78bfa", fontSize: 10 }}
                          />
                          <Tooltip
                            labelFormatter={(label) => formatTenMinAxis(label)}
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value, name) => [value, name === "rainfall" ? "Rainfall (mm)" : "AQI"]}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                            formatter={(value) => (value === "rainfall" ? "Rainfall (mm)" : "AQI")}
                          />
                          <Bar
                            yAxisId="rain"
                            dataKey="rainfall"
                            name="rainfall"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                          <Bar
                            yAxisId="aqi"
                            dataKey="aqi"
                            name="aqi"
                            fill="#a78bfa"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition-all duration-300 h-full">
                  <h4 className="text-sm font-semibold tracking-wide">Risk Allocation</h4>
                  <p className="text-[10px] text-gray-500 mt-1 mb-6 leading-snug">
                    Four channels (air, rain, heat, systemic) weighted from live telemetry—shares sum to 100%.
                  </p>
                  <div className="h-48 w-full relative min-h-[192px]">
                    {pieData && pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            innerRadius={68}
                            outerRadius={80}
                            paddingAngle={10}
                            dataKey="value"
                            stroke="none"
                            nameKey="name"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`slice-${entry.name}-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111827",
                              border: "1px solid #1f2937",
                              borderRadius: "12px",
                              fontSize: "11px",
                            }}
                            formatter={(value, name, item) => {
                              const detail = item?.payload?.detail;
                              return [
                                detail ? `${value}% — ${detail}` : `${value}%`,
                                name,
                              ];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-xs italic opacity-50">
                        Not enough data
                      </div>
                    )}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{envSnapshot ? "LIVE" : "WAITING"}</p>
                       <p className="text-lg font-black text-white">{envSnapshot?.aqi != null ? envSnapshot.aqi : "-"}</p>
                    </div>
                  </div>
                  <div className="mt-8 space-y-4">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-start justify-between gap-3 group">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full shadow-lg shrink-0 mt-1"
                            style={{ backgroundColor: d.color }}
                          />
                          <div className="min-w-0">
                            <span className="text-xs text-gray-400 font-medium group-hover:text-gray-200 transition-colors uppercase tracking-wider block">
                              {d.name}
                            </span>
                            {d.detail && (
                              <p className="text-[10px] text-gray-600 mt-0.5 leading-snug line-clamp-2">
                                {d.detail}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-black text-white px-2 py-0.5 bg-gray-900 rounded tabular-nums shrink-0">
                          {d.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row - 1:1:1:1 style */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Factor Assessment">
                  <p className="text-[10px] text-gray-500 leading-snug -mt-2 mb-2">
                    Composite view from live environment, AI run, and cluster telemetry.
                  </p>
                  <div className="space-y-3 mt-4 max-h-[min(520px,70vh)] overflow-y-auto pr-1">
                    <RatingPill
                      label="Reliability Index"
                      value={systemData ? `${systemData.system_health === "Healthy" ? 99 : 85}%` : "--"}
                      color="indigo"
                    />
                    <RatingPill
                      label="Risk Score"
                      value={analysis ? `${100 - (analysis.risk?.risk_score || 0)}%` : "--"}
                      color="amber"
                    />
                    <RatingPill
                      label="Model Confidence"
                      value={analysis ? `${Math.round((1 - (analysis.disruption_probability || 0)) * 100)}%` : "--"}
                      color="cyan"
                    />
                    <RatingPill
                      label="Atmospheric buffer"
                      value={
                        factorAssessmentExtras.atmosphericBuffer != null
                          ? `${factorAssessmentExtras.atmosphericBuffer}%`
                          : "--"
                      }
                      color="emerald"
                    />
                    <RatingPill
                      label="Hydric load"
                      value={
                        factorAssessmentExtras.hydricLoad != null
                          ? `${factorAssessmentExtras.hydricLoad}%`
                          : "--"
                      }
                      color="violet"
                    />
                    <RatingPill
                      label="AI ensemble trust"
                      value={
                        factorAssessmentExtras.aiEnsembleTrust != null
                          ? `${factorAssessmentExtras.aiEnsembleTrust}%`
                          : "--"
                      }
                      color="rose"
                    />
                    <RatingPill
                      label="Cluster pulse"
                      value={
                        factorAssessmentExtras.clusterPulse != null
                          ? `${factorAssessmentExtras.clusterPulse}%`
                          : "--"
                      }
                      color="sky"
                    />
                    <RatingPill
                      label="Thermal stability"
                      value={
                        factorAssessmentExtras.thermalStability != null
                          ? `${factorAssessmentExtras.thermalStability}%`
                          : "--"
                      }
                      color="fuchsia"
                    />
                    <RatingPill
                      label="Exposure load"
                      value={
                        factorAssessmentExtras.exposureLoad != null
                          ? `${factorAssessmentExtras.exposureLoad}%`
                          : "--"
                      }
                      color="orange"
                    />
                  </div>
                </Card>

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 flex flex-col h-full hover:border-gray-700 transition-all duration-300">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h4 className="text-sm font-semibold tracking-wide">Signal Log</h4>
                    <span className="text-[9px] font-bold text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg uppercase tracking-wide shrink-0 max-w-[10rem] truncate" title={city}>
                      {city || "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-4 -mt-2">
                    Filtered to your deployment city (same as environment pulls and AI Risk Matrix).
                  </p>
                  <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 min-h-[120px]">
                    {signalLogsForCity.length > 0 ? (
                      signalLogsForCity.map((log, index) => (
                        <div
                          key={log.id ?? `${log.message}-${index}`}
                          className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-950/40 border border-gray-800/40 hover:bg-gray-900/40 transition-colors"
                        >
                          <div
                            className={`p-2.5 rounded-xl ${log.level === "warning" || log.level === "error" ? "text-amber-400 bg-amber-500/10 border border-amber-500/15" : "text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 shadow-[0_0_15px_rgba(79,70,229,0.1)]"}`}
                          >
                            {log.level === "warning" || log.level === "error" ? (
                              <Zap size={14} />
                            ) : (
                              <Activity size={14} />
                            )}
                          </div>
                          <SignalLogHoverDetail log={log} formatTimeFn={formatTime}>
                            <p className="text-xs font-bold text-white line-clamp-2 leading-snug">{log.message}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              <span>{(log.event_type || "system").replace(/_/g, " ")}</span>
                              <span className="mx-1">•</span>
                              <span>{formatTime(log.created_at)}</span>
                            </p>
                          </SignalLogHoverDetail>
                          <span
                            className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${log.level === "success" ? "text-emerald-400 bg-emerald-500/10" : log.level === "error" ? "text-amber-400 bg-amber-500/10" : "text-gray-500 bg-gray-500/10"}`}
                          >
                            {log.level === "success" ? "OK" : log.level === "error" ? "ALERT" : "INFO"}
                          </span>
                        </div>
                      ))
                    ) : systemLogs.length > 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 text-gray-500 text-xs leading-relaxed">
                        <p className="font-medium text-gray-400">No signals for this city yet</p>
                        <p className="mt-2 text-[11px] text-gray-600">
                          Logs exist for other locations. Set <span className="text-gray-400 font-semibold">Deployment City</span>{" "}
                          under <span className="text-gray-400 font-semibold">AI Risk Matrix</span>, or wait for the next fetch for{" "}
                          <span className="text-gray-400 font-semibold">{city}</span>.
                        </p>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-xs italic opacity-50">
                        No signal logs available
                      </div>
                    )}
                  </div>
                </div>

                <Card title="Financial Momentum">
                  <div className="mt-4 flex flex-col flex-1 min-h-0">
                    <p className="text-3xl font-bold tracking-tight text-white leading-none">
                      ₹ {(stats?.totalPayouts || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest">
                      Total Disbursed
                    </p>
                    {!financialMomentumChart.isReal && (
                      <p className="text-[10px] text-indigo-300/80 font-bold uppercase tracking-wider mt-2">
                        Preview curve · no ledger events yet
                      </p>
                    )}
                    <div className="w-full mt-4 h-[176px] min-h-[176px]">
                      {financialMomentumChart.series.length > 0 ? (
                        <ResponsiveContainer width="100%" height={176}>
                          <AreaChart
                            data={financialMomentumChart.series}
                            margin={{ top: 6, right: 6, left: -6, bottom: 4 }}
                          >
                            <defs>
                              <linearGradient id="glowPurple" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.22} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="name"
                              stroke="#374151"
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              interval="preserveStartEnd"
                              tick={{ fill: "#6b7280" }}
                            />
                            <YAxis
                              stroke="#374151"
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              width={40}
                              tick={{ fill: "#6b7280" }}
                              tickFormatter={(v) =>
                                v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`
                              }
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#111827",
                                border: "1px solid #1f2937",
                                borderRadius: "12px",
                                fontSize: "11px",
                              }}
                              formatter={(value) => [
                                `₹${Number(value).toLocaleString("en-IN")}`,
                                financialMomentumChart.isReal
                                  ? "Cumulative disbursed"
                                  : "Indicative accrual",
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="val"
                              stroke="#8b5cf6"
                              strokeWidth={2.5}
                              fill="url(#glowPurple)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : null}
                    </div>
                    {!financialMomentumChart.isReal && (
                      <p className="text-[10px] text-gray-500 leading-relaxed mt-3 border-t border-gray-800/80 pt-3">
                        Based on your weekly income and a low-risk coverage band (~5% / week), with small
                        variation so the chart is not flat. After your first parametric payout posts, this
                        switches to your real cumulative ledger curve.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === "risk" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
              <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition shrink-0">
                  <h4 className="text-sm font-semibold mb-6">Execution Config</h4>
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Deployment City</label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-indigo-600 focus:bg-indigo-950/10 transition-all font-medium text-white"
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Target Income (₹/wk)</label>
                      <input
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-indigo-600 focus:bg-indigo-950/10 transition-all font-medium text-white"
                      />
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-100 shadow-xl shadow-indigo-600/20 disabled:opacity-50 uppercase tracking-widest mt-2"
                    >
                      {loading ? "Crunching Env Logic..." : "Compute Risk Vectors"}
                    </button>
                    {error && <p className="text-[11px] text-red-500 bg-red-500/5 p-3 rounded-lg border border-red-500/10 font-bold">{error}</p>}
                  </div>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm shrink-0">
                  <h4 className="text-sm font-semibold mb-6">Real-Time Core (AI Mode)</h4>
                  <div className="space-y-3">
                    <SignalRow label="Model Status" value="ACTIVE (ML)" color="emerald" />
                    <SignalRow label="Disruption Prob." value={`${Math.round((analysis?.disruption_probability || 0) * 100)}%`} />
                    <SignalRow label="Risk Threshold" value={analysis?.risk?.risk_level || "—"} />
                    <SignalRow label="Expected Loss" value={`${analysis?.expected_loss_pct || 0}%`} />
                    <SignalRow label="Value at Risk" value={`₹${Math.round(analysis?.estimated_loss_val || 0)}`} />
                  </div>
                </div>

                <div className="flex-1 min-h-[280px] flex flex-col bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                        <Gauge size={14} className="text-cyan-400" /> Environmental load
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                        Same 20‑min buckets as the main risk chart
                      </p>
                    </div>
                    {envLoadMeters.cityLabel && (
                      <span className="text-[10px] font-bold text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg uppercase tracking-wide shrink-0">
                        {envLoadMeters.cityLabel}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Wind size={11} className="text-indigo-400" /> AQI vs 300 cap
                        </span>
                        <span className="text-gray-400">
                          {envLoadMeters.aq}{" "}
                          <span className="text-gray-600">({getAqiLabel(envLoadMeters.aq)})</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-950 border border-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${envLoadMeters.nearAqiTrigger ? "bg-amber-500/90" : "bg-indigo-500/85"}`}
                          style={{ width: `${envLoadMeters.aqiPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <CloudRain size={11} className="text-indigo-400" /> Rain vs 50mm trigger
                        </span>
                        <span className="text-gray-400">{envLoadMeters.rf} mm</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-950 border border-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${envLoadMeters.nearRainTrigger ? "bg-sky-500/90" : "bg-cyan-600/75"}`}
                          style={{ width: `${envLoadMeters.rainPct}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Sky state: <span className="text-gray-300">{envLoadMeters.cond}</span>.
                      {envLoadMeters.nearAqiTrigger || envLoadMeters.nearRainTrigger ? (
                        <span className="text-amber-200/90">
                          {" "}
                          One or more drivers are approaching parametric thresholds—keep an eye on the next refresh.
                        </span>
                      ) : (
                        <span> Drivers sit comfortably below automated payout gates.</span>
                      )}
                    </p>
                    <div className="mt-auto pt-4 border-t border-gray-800/80 flex-1 flex flex-col min-h-[140px]">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <LineIcon size={12} className="text-emerald-400/90" />
                        Risk pulse (this window)
                      </p>
                      {chartData && chartData.length > 0 ? (
                        <div className="flex-1 w-full min-h-[120px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                              <defs>
                                <linearGradient id="riskPulseFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="bucketKey"
                                type="category"
                                tickFormatter={formatTenMinAxis}
                                stroke="#374151"
                                fontSize={9}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                                tick={{ fill: "#6b7280" }}
                              />
                              <Tooltip
                                labelFormatter={(label) => formatTenMinAxis(label)}
                                contentStyle={{
                                  backgroundColor: "#111827",
                                  border: "1px solid #1f2937",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="risk"
                                name="Risk"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#riskPulseFill)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600 text-[11px] italic">
                          Fetch environment data to plot the pulse
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition">
                   <div className="flex justify-between items-center mb-8">
                    <div>
                      <h4 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                        <Activity size={14} className="text-indigo-400" /> AI Risk Mapping
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Hedge Analytics • Bayesian Logic Applied</p>
                    </div>
                    {analysis && (
                       <div className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/5">
                        {analysis.risk.risk_level} VECTOR
                      </div>
                    )}
                  </div>
                  <div className="h-72 w-full min-h-[288px]">
                    {chartData && chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                          <defs>
                            <linearGradient id="riskCyan" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="bucketKey"
                            type="category"
                            tickFormatter={formatTenMinAxis}
                            stroke="#374151"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            minTickGap={4}
                            height={52}
                            angle={-18}
                            textAnchor="end"
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis stroke="#374151" fontSize={10} axisLine={false} tickLine={false} domain={[0, "auto"]} />
                          <Tooltip 
                            labelFormatter={(label) => formatTenMinAxis(label)}
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px' }}
                            cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                          />
                          <Area type="monotone" dataKey="risk" name="Risk score" stroke="#10b981" strokeWidth={3} fill="url(#riskCyan)" />
                          <Line type="monotone" dataKey="predicted_loss" name="Predicted Loss" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-xs italic opacity-50">
                        Insufficient environmental vectors for mapping
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-800/80">
                    <MetricMini label="Rainfall" value={`${analysis?.weather?.rainfall ?? 0}mm`} sub={analysis?.weather?.condition || "Unknown"} icon={<CloudRain size={12} className="text-indigo-400" />} />
                    <MetricMini label="AQI INDEX" value={analysis?.weather?.aqi ?? 0} sub={getAqiLabel(analysis?.weather?.aqi ?? envSnapshot?.aqi)} icon={<Wind size={12} className="text-indigo-400" />} />
                    <MetricMini label="Threat" value={analysis?.risk?.risk_level || "Low"} sub={`VAL: ${analysis?.risk?.risk_score ?? 0}`} icon={<Activity size={12} className="text-indigo-400" />} />
                    <MetricMini label="Net Credit" value={`₹${Math.round(analysis?.risk?.suggested_payout ?? 0).toLocaleString()}`} sub="Current Calculation" icon={<IndianRupee size={12} className="text-indigo-400" />} />
                  </div>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition">
                  <h4 className="text-sm font-semibold mb-4 tracking-wide flex items-center gap-2">
                    <Shield size={14} className="text-emerald-400" /> AI Intelligence Insights
                  </h4>
                  <div className="space-y-4">
                    {analysis?.ai_insight ? (
                      <>
                        <div className="flex gap-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 shadow-inner">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <div className="space-y-2 min-w-0 flex-1">
                            <p className="text-[12px] font-semibold leading-relaxed text-emerald-100/95">
                              {analysis.ai_insight}
                            </p>
                            {riskWindowTrend && (
                              <p className="text-[11px] leading-relaxed text-emerald-200/65 border-t border-emerald-500/10 pt-2">
                                {riskWindowTrend}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="rounded-lg bg-gray-950/50 border border-gray-800/80 px-3 py-2.5">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Disruption prob.</p>
                            <p className="text-sm font-bold text-white mt-0.5">
                              {Math.round((analysis.disruption_probability || 0) * 100)}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-950/50 border border-gray-800/80 px-3 py-2.5">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Expected loss</p>
                            <p className="text-sm font-bold text-white mt-0.5">{analysis.expected_loss_pct ?? 0}%</p>
                          </div>
                          <div className="rounded-lg bg-gray-950/50 border border-gray-800/80 px-3 py-2.5 col-span-2 sm:col-span-1">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Value at risk</p>
                            <p className="text-sm font-bold text-indigo-200 mt-0.5">
                              ₹{Math.round(analysis.estimated_loss_val ?? 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-950/50 border border-gray-800/80 px-3 py-2.5">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Rainfall</p>
                            <p className="text-sm font-bold text-gray-200 mt-0.5">
                              {analysis?.weather?.rainfall ?? 0} mm
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-950/50 border border-gray-800/80 px-3 py-2.5">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">AQI</p>
                            <p className="text-sm font-bold text-gray-200 mt-0.5">
                              {analysis?.weather?.aqi ?? "—"}{" "}
                              <span className="text-[10px] font-medium text-gray-500">
                                ({getAqiLabel(analysis?.weather?.aqi)})
                              </span>
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-950/50 border border-gray-800/80 px-3 py-2.5 col-span-2 sm:col-span-1">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Threat</p>
                            <p className="text-sm font-bold text-gray-200 mt-0.5">
                              {analysis?.risk?.risk_level ?? "—"}{" "}
                              <span className="text-[10px] font-medium text-gray-500">
                                (score {analysis?.risk?.risk_score ?? 0})
                              </span>
                            </p>
                          </div>
                        </div>

                        {explainableInsights.length > 0 && (
                          <div className="rounded-xl border border-gray-800/80 bg-[#0B0F19]/40 p-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">
                              How this assessment was built
                            </p>
                            <ul className="space-y-2 text-[11px] leading-relaxed text-gray-400 list-disc pl-4 marker:text-indigo-500/80">
                              {explainableInsights.map((line, i) => (
                                <li key={i}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                            Policy recommendation
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                            {extendedPolicyText ||
                              (analysis?.risk?.risk_level === "High"
                                ? "Critical risk detected. We recommend staying offline during peak hours to avoid uncompensated earnings loss."
                                : "Stable data conditions. Safe for active delivery nodes.")}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-4 p-4 bg-gray-950/40 rounded-xl border border-gray-800/40 text-[11px] leading-relaxed text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-gray-700 mt-1 shrink-0" />
                        <span>
                          Run <strong className="text-gray-300">Compute Risk Vectors</strong> to load environmental
                          signals, disruption probability, and a full narrative for this city and income.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="space-y-6">
            <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden shadow-xl hover:border-gray-700 transition-all duration-300">
               <div className="p-8 border-b border-gray-800 flex flex-wrap gap-6 justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">Disbursement Ledger</h4>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium uppercase tracking-[0.1em]">Verified environmental payouts</p>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 px-6 py-3 rounded-2xl border border-indigo-500/20 flex flex-col items-end shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Liquid Balance</span>
                  <span className="text-2xl font-black text-white mt-1">₹{wallet?.wallet_balance?.toLocaleString?.() ?? "0"}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0B0F19]/60 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                      <th className="px-8 py-5">Event Stamp</th>
                      <th className="px-8 py-5">Location</th>
                      <th className="px-8 py-5">Audit Status</th>
                      <th className="px-8 py-5 text-right">Credit Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40 font-medium">
                    {Array.isArray(wallet?.payouts) && wallet.payouts.map((p) => (
                      <tr key={p.id} className="text-[12px] hover:bg-indigo-600/[0.03] transition-all group">
                        <td className="px-8 py-5 font-bold text-gray-300 group-hover:text-indigo-400">{String(p.event_date || "").slice(0, 10)}</td>
                        <td className="px-8 py-5 text-gray-500 group-hover:text-gray-300">{p.city}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.flagged ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                            {p.flagged ? "Flagged" : "Settled"}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-white text-sm">₹{Number(p.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!Array.isArray(wallet?.payouts) || wallet.payouts.length === 0) && (
                  <div className="py-24 text-center px-4 text-gray-400 text-sm font-medium">
                    No payouts yet. The system is actively monitoring environmental conditions. Once disruption is detected, payouts will be triggered automatically.
                  </div>
                )}
              </div>
            </div>
              <InsuranceInfo />
            </div>
          )}

          {activeTab === "news" && (
            <div className="max-w-4xl mx-auto space-y-8 mt-6">
              <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden group hover:border-indigo-600/30 transition-all duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={120} className="text-indigo-400" />
                </div>
                
                <div className="flex items-center gap-6 mb-8 relative">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl group-hover:scale-105 transition-transform">
                    <Shield size={28} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white tracking-tight">System Status</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{systemData?.data_flow || 'CONNECTING'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Uptime</p>
                    <p className="text-xl font-black text-white">{systemData?.uptime || '--'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Nodes</p>
                    <p className="text-xl font-black text-white">{systemData?.active_nodes || '--'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Events (24h)</p>
                    <p className="text-xl font-black text-white">{systemData?.events_today ?? '--'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Disbursed (24h)</p>
                    <p className="text-xl font-black text-white">{systemData?.payouts_today ?? '--'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-800/80">
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">
                    Cluster is monitoring <span className="text-white font-bold">{systemData?.active_cities?.join(", ") || 'primary zones'}</span>. External integrations for Weather (OpenWeather) and Air Quality (AQICN) are currently <span className="text-emerald-400 uppercase font-black text-[10px] px-2 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-sm ml-1">Operational</span>.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h5 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Newspaper size={14} className="text-indigo-400" /> Real-Time Activity Feed
                  </h5>
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Live Updates • 5s Polling</span>
                </div>
                
                <div className="space-y-3">
                  {signalLogsForCity.length > 0 ? (
                    signalLogsForCity.map((log) => (
                      <div
                        key={log.id}
                        className="bg-[#111827] rounded-2xl p-4 border border-gray-800/60 hover:bg-gray-900/40 transition-colors group flex items-start gap-4"
                      >
                        <div
                          className={`mt-1 p-1.5 rounded-lg border ${
                            log.level === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : log.level === "warning"
                                ? "bg-amber-500/10 text-amber-500 border-amber-600/20"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          }`}
                        >
                          <Zap size={12} />
                        </div>
                        <SignalLogHoverDetail log={log} formatTimeFn={formatTime}>
                          <p className="text-xs text-gray-300 font-medium leading-relaxed line-clamp-3 group-hover:text-white transition-colors">
                            {log.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                              {(log.event_type || "system").replace(/_/g, " ")}
                            </span>
                            <span className="text-[9px] font-medium text-gray-700">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                            <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-tighter">
                              {city}
                            </span>
                          </div>
                        </SignalLogHoverDetail>
                      </div>
                    ))
                  ) : systemLogs.length > 0 ? (
                    <div className="py-12 border-2 border-dashed border-gray-800/50 rounded-3xl text-center px-4">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                        No activity for {city}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-2">
                        The feed matches your <span className="text-gray-400 font-semibold">Deployment city</span> (AI Risk Matrix).
                        Change it there to tail another node.
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 border-2 border-dashed border-gray-800/50 rounded-3xl text-center">
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest font-sans italic">
                        Awaiting System Broadcast...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/** Full log text + meta in a fixed portal tooltip (avoids clipping inside overflow scroll areas). */
function SignalLogHoverDetail({ log, formatTimeFn, children }) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, maxW: 320 });
  const hideTimer = useRef(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const scheduleClose = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setOpen(false), 140);
  }, [clearHideTimer]);

  const openTip = useCallback(() => {
    clearHideTimer();
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxW = Math.min(380, window.innerWidth - 16);
    let left = Math.min(r.left, window.innerWidth - maxW - 8);
    left = Math.max(8, left);
    const estH = 160;
    let top = r.bottom + 8;
    if (top + estH > window.innerHeight - 8) {
      top = Math.max(8, r.top - estH - 8);
    }
    setCoords({ top, left, maxW });
    setOpen(true);
  }, [clearHideTimer]);

  const created =
    log.created_at != null ? new Date(log.created_at).toLocaleString() : "—";

  return (
    <>
      <div
        ref={anchorRef}
        className="flex-1 min-w-0 cursor-default"
        onMouseEnter={openTip}
        onMouseLeave={scheduleClose}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[10000] rounded-xl border border-gray-600/90 bg-[#151a27] px-3.5 py-3 shadow-2xl ring-1 ring-black/40 pointer-events-auto"
            style={{ top: coords.top, left: coords.left, maxWidth: coords.maxW }}
            onMouseEnter={clearHideTimer}
            onMouseLeave={scheduleClose}
          >
            <p className="text-[12px] font-semibold text-white whitespace-pre-wrap break-words leading-relaxed">
              {log.message}
            </p>
            <dl className="mt-3 pt-2.5 border-t border-gray-700/80 grid gap-y-1.5 text-[10px] text-gray-400">
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="font-black uppercase tracking-wider text-gray-500 shrink-0">Signal</dt>
                <dd className="text-indigo-200/90 font-medium">
                  {(log.event_type || "system").replace(/_/g, " ")}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="font-black uppercase tracking-wider text-gray-500 shrink-0">Level</dt>
                <dd className="text-gray-200 capitalize">{log.level || "info"}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="font-black uppercase tracking-wider text-gray-500 shrink-0">Logged</dt>
                <dd className="text-gray-300">{formatTimeFn(log.created_at)}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="font-black uppercase tracking-wider text-gray-500 shrink-0">Full stamp</dt>
                <dd className="text-gray-400 text-[9px] leading-snug">{created}</dd>
              </div>
            </dl>
          </div>,
          document.body
        )}
    </>
  );
}

// UI Pieces
function NavItem({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 transform active:scale-[0.98] ${
        active
          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 shadow-lg shadow-indigo-600/5 ring-1 ring-indigo-600/20"
          : "text-gray-500 hover:text-indigo-300 hover:bg-indigo-600/5 border border-transparent"
      }`}
    >
      <div className={`${active ? 'text-indigo-400' : 'text-gray-500 group-hover:text-indigo-400'} transition-colors`}>{icon}</div>
      <span className="tracking-wide uppercase text-[10px]">{label}</span>
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 hover:shadow-xl transition-all duration-300 h-full flex flex-col group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-0 bg-indigo-600 group-hover:h-full transition-all duration-300"></div>
      <h4 className="text-sm font-semibold text-gray-400 mb-6 group-hover:text-white transition-colors tracking-wide uppercase text-[10px]">{title}</h4>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function RatingPill({ label, value, color }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-600/20 hover:bg-indigo-600/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-600/20 hover:bg-amber-600/20",
    cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-600/20 hover:bg-cyan-600/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-600/20 hover:bg-emerald-600/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-600/20 hover:bg-violet-600/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-600/20 hover:bg-rose-600/20",
    sky: "bg-sky-500/10 text-sky-400 border-sky-600/20 hover:bg-sky-600/20",
    fuchsia: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-600/20 hover:bg-fuchsia-600/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-600/20 hover:bg-orange-600/20",
  };
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${colors[color]}`}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
      <span className="text-2xl font-black">{value}</span>
    </div>
  );
}

function SignalRow({ label, value }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-950/40 border border-gray-800/60 hover:border-gray-700 transition-colors group">
      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest group-hover:text-gray-400 transition-colors">{label}</span>
      <span className="text-xs font-black text-gray-200 group-hover:text-white transition-colors">{value}</span>
    </div>
  );
}

function MetricMini({ label, value, sub, icon }) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
        {icon} {label}
      </div>
      <p className="text-2xl font-black text-white tracking-tighter transition-transform group-hover:translate-x-1 duration-300">{value}</p>
      <p className="text-[10px] text-gray-500 font-medium leading-none truncate opacity-80">{sub}</p>
    </div>
  );
}

function InsuranceInfo() {
  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h4 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
             <Shield size={18} className="text-indigo-400" /> How Insurance Payouts Work
          </h4>
          <span className="w-fit text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 shadow-sm">
            AI VERIFIED PAYOUT SYSTEM
          </span>
        </div>
        
        <p className="text-sm text-gray-400 mb-8 leading-relaxed max-w-3xl">
          Your earnings are protected through our <strong className="text-indigo-300 font-semibold">AI-powered</strong> parametric insurance system. Payouts are <strong className="text-indigo-300 font-semibold">automatically</strong> triggered based on <strong className="text-indigo-300 font-semibold">real-time</strong> environmental conditions—no claims required.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-950/40 border border-gray-800/60 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20 shadow-inner">
              <Activity size={16} />
            </div>
            <h5 className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-1.5">1. Live Monitoring</h5>
            <p className="text-[11px] text-gray-500 leading-relaxed">We track rainfall, AQI, and temperature in your city</p>
          </div>
          
          <div className="bg-gray-950/40 border border-gray-800/60 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20 shadow-inner">
              <Gauge size={16} />
            </div>
            <h5 className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-1.5">2. AI Risk Analysis</h5>
            <p className="text-[11px] text-gray-500 leading-relaxed">Our AI predicts how these conditions impact your delivery earnings</p>
          </div>
          
          <div className="bg-gray-950/40 border border-gray-800/60 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20 shadow-inner">
              <Zap size={16} />
            </div>
            <h5 className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-1.5">3. Automatic Trigger</h5>
            <p className="text-[11px] text-gray-500 leading-relaxed">If disruption crosses threshold, payout is triggered instantly</p>
          </div>
          
          <div className="bg-gray-950/40 border border-gray-800/60 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20 shadow-inner">
              <WalletIcon size={16} />
            </div>
            <h5 className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-1.5">4. Direct Credit</h5>
            <p className="text-[11px] text-gray-500 leading-relaxed">Money is credited directly to your wallet</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-400/90 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          ⚡ Fully automated system — no claims, no paperwork required
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
