import { useEffect, useMemo, useState } from "react";
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
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, getAuthHeaders } from "../utils/api";
import { buildExplainableInsights } from "../utils/insights";

const chartTemplate = [
  { t: "09:00", risk: 18 },
  { t: "10:00", risk: 24 },
  { t: "11:00", risk: 33 },
  { t: "12:00", risk: 48 },
  { t: "13:00", risk: 61 },
  { t: "14:00", risk: 56 },
];

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

  const chartData = useMemo(() => {
    if (!analysis) return chartTemplate;
    return chartTemplate.map((x, i) => ({
      ...x,
      risk: Math.max(8, Math.min(100, analysis.risk.risk_score - 20 + i * 7)),
    }));
  }, [analysis]);

  const explainableInsights = useMemo(
    () => buildExplainableInsights(analysis),
    [analysis]
  );

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
      const res = await api.get("/stats/dashboard", getAuthHeaders());
      setStats(res.data || {});
    } catch (e) {
      console.error("Fetch Stats Error:", e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const [envData, setEnvData] = useState(null);

  const fetchEnvData = async (targetCity) => {
    try {
      const res = await api.get(`/api/environment/${targetCity}`, {
        headers: getAuthHeaders(),
      });
      setEnvData(res.data);
      setAnalysis({
         weather: {
           rainfall: res.data.rainfall,
           aqi: res.data.aqi,
           condition: res.data.condition,
         },
         risk: {
           risk_level: res.data.risk_level,
           risk_score: res.data.risk_score,
           suggested_payout: (Number(income) * (res.data.risk_level === 'High' ? 0.3 : 0.05)),
           auto_payout: res.data.risk_level === 'High'
         }
      });
    } catch (e) {
      console.error("Fetch Data Error:", e);
    }
  };

  const fetchSystemData = async () => {
    try {
      const statusRes = await api.get("/api/system/status", { headers: getAuthHeaders() });
      setSystemData(statusRes.data);
      const logsRes = await api.get("/api/system/logs", { headers: getAuthHeaders() });
      setSystemLogs(logsRes.data);
    } catch (e) {
      console.error("System Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const barData = useMemo(() => {
    const base = envData?.rainfall || 10;
    return Array.from({ length: 10 }, (_, i) => ({
      name: `T-${i}`,
      val: Math.max(10, base + (Math.random() * 20 - 10))
    }));
  }, [envData]);

  const pieData = useMemo(() => [
    { name: "Atmospheric", value: envData?.aqi || 50, color: "#6366f1" },
    { name: "Precipitation", value: (envData?.rainfall || 0) * 2, color: "#a78bfa" },
    { name: "Baseline", value: 40, color: "#c4b5fd" },
  ], [envData]);

  const lineData = useMemo(() => {
    const base = stats?.totalPayouts || 1000;
    return Array.from({ length: 6 }, (_, i) => ({
      name: `P-${i}`,
      val: base + (i * 200) + (Math.random() * 100)
    }));
  }, [stats]);

  useEffect(() => {
    fetchEnvData(city);
    const interval = setInterval(() => fetchEnvData(city), 60000);
    return () => clearInterval(interval);
  }, [city]);

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
                <div className="lg:col-span-2 bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 hover:shadow-xl transition-all duration-300 group h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-sm text-gray-400 font-medium tracking-wide">Net Protected Forecast</p>
                      <h3 className="text-2xl font-bold mt-1 text-white tracking-tighter">₹ {(stats?.protectedIncome || 0).toLocaleString()}</h3>
                      <p className={`flex items-center gap-1.5 text-[11px] font-black mt-2 w-fit px-2 py-0.5 rounded border ${envData?.risk_level === 'High' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>
                        {envData?.risk_level === 'High' ? <Zap size={10} /> : <TrendingUp size={10} />}
                        {envData?.risk_level === 'High' ? "CRITICAL RISK DETECTED" : "STABLE OPERATIONS"}
                      </p>
                    </div>
                    <button className="px-4 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-[10px] font-black text-gray-300 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-600 transition-all uppercase tracking-widest">
                      Analytics Pack
                    </button>
                  </div>
                  <div className="h-64 w-full min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                        <XAxis dataKey="name" stroke="#374151" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#374151" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="val" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition-all duration-300 h-full">
                  <h4 className="text-sm font-semibold mb-8 tracking-wide">Risk Allocation</h4>
                  <div className="h-48 w-full relative min-h-[192px]">
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
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global</p>
                       <p className="text-lg font-black text-white">NORM</p>
                    </div>
                  </div>
                  <div className="mt-8 space-y-4">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: d.color }}></div>
                          <span className="text-xs text-gray-400 font-medium group-hover:text-gray-200 transition-colors uppercase tracking-wider">{d.name}</span>
                        </div>
                        <span className="text-xs font-black text-white px-2 py-0.5 bg-gray-900 rounded">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row - 1:1:1:1 style */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Factor Assessment">
                  <div className="space-y-4 mt-6">
                    <RatingPill label="Reliability Index" value="92" color="indigo" />
                    <RatingPill label="Throughput" value="85" color="amber" />
                    <RatingPill label="User Logic" value="85" color="cyan" />
                  </div>
                </Card>

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 flex flex-col h-full hover:border-gray-700 transition-all duration-300">
                  <h4 className="text-sm font-semibold mb-6 tracking-wide">Signal Log</h4>
                  <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                    {[
                      { name: `${envData?.condition || 'Analyzing'} Current`, city: city, triggered: envData?.risk_level === 'High', time: "Live" },
                      { name: "Heavy Rainfall", city: "Mumbai", triggered: true, time: "2h ago" },
                      { name: "AQI Critical", city: "Delhi", triggered: true, time: "5h ago" },
                    ].map((ev, i) => (
                      <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-950/40 border border-gray-800/40 hover:bg-gray-900/40 transition-colors">
                        <div className={`p-2.5 rounded-xl ${ev.triggered ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'text-gray-500 bg-gray-500/5'}`}>
                          {ev.triggered ? <Zap size={14} /> : <Activity size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-white">{ev.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{ev.city} • {ev.time}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${ev.triggered ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-gray-500/10'}`}>
                          {ev.triggered ? 'CREDIT' : 'WATCH'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Card title="Financial Momentum">
                  <div className="mt-4">
                    <p className="text-3xl font-bold tracking-tight text-white leading-none">₹ {((stats && stats.totalPayouts) || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest">Total Disbursed</p>
                    <div className="h-24 w-full mt-6 min-h-[96px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lineData}>
                          <defs>
                            <linearGradient id="glowPurple" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={3} fill="url(#glowPurple)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === "risk" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition">
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

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm">
                  <h4 className="text-sm font-semibold mb-6">Real-Time Core</h4>
                  <div className="space-y-3">
                    <SignalRow label="Aggregated Risk" value={analysis?.risk?.risk_level || "—"} />
                    <SignalRow label="Vector Score" value={analysis?.risk?.risk_score ?? "—"} />
                    <SignalRow label="Auto-Trigger" value={analysis?.risk?.auto_payout ? "ENABLED" : "NULL"} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm hover:border-gray-700 transition">
                   <div className="flex justify-between items-center mb-8">
                    <div>
                      <h4 className="text-sm font-semibold tracking-wide">Environmental Risk Mapping</h4>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Dynamic Synthetic Signals • High Fidelity</p>
                    </div>
                    {analysis && (
                       <div className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/5">
                        {analysis.risk.risk_level} VECTOR
                      </div>
                    )}
                  </div>
                  <div className="h-72 w-full min-h-[288px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="riskCyan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="t" stroke="#374151" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#374151" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px' }}
                          cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="risk" stroke="#10b981" strokeWidth={3} fill="url(#riskCyan)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-800/80">
                    <MetricMini label="Rainfall" value={`${analysis?.weather?.rainfall ?? 0}mm`} sub={analysis?.weather?.condition || "Unknown"} icon={<CloudRain size={12} className="text-indigo-400" />} />
                    <MetricMini label="AQI INDEX" value={analysis?.weather?.aqi ?? 0} sub={envData?.pollution_level || "Unknown"} icon={<Wind size={12} className="text-indigo-400" />} />
                    <MetricMini label="Threat" value={analysis?.risk?.risk_level || "Low"} sub={`VAL: ${analysis?.risk?.risk_score ?? 0}`} icon={<Activity size={12} className="text-indigo-400" />} />
                    <MetricMini label="Net Credit" value={`₹${Math.round(analysis?.risk?.suggested_payout ?? 0).toLocaleString()}`} sub="Current Calculation" icon={<IndianRupee size={12} className="text-indigo-400" />} />
                  </div>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 border border-gray-800 shadow-sm">
                  <h4 className="text-sm font-semibold mb-6 tracking-wide">Explainable AI Core</h4>
                  <div className="space-y-3">
                    {explainableInsights.map((line, idx) => (
                      <div className="flex gap-4 p-4 bg-gray-950/40 rounded-xl border border-gray-800/40 text-[11px] leading-relaxed text-gray-400 hover:text-gray-200 transition-colors duration-300" key={idx}>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                        <span>{line}</span>
                      </div>
                    ))}
                    {!analysis && <p className="text-xs text-gray-500 italic p-12 text-center border-2 border-dashed border-gray-800/50 rounded-2xl">Awaiting environment data crunching...</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wallet" && (
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
                  <div className="py-24 text-center text-gray-500 text-sm font-medium italic opacity-60">No financial events detected in this cycle.</div>
                )}
              </div>
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
                    <p className="text-xl font-black text-white">{systemData?.events_today || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Disbursed (24h)</p>
                    <p className="text-xl font-black text-white">{systemData?.payouts_today || '0'}</p>
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
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Live Updates • 30s Polling</span>
                </div>
                
                <div className="space-y-3">
                  {systemLogs.length > 0 ? systemLogs.map((log) => (
                    <div key={log.id} className="bg-[#111827] rounded-2xl p-4 border border-gray-800/60 hover:bg-gray-900/40 transition-colors group flex items-start gap-4">
                      <div className={`mt-1 p-1.5 rounded-lg border ${
                        log.level === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        log.level === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-600/20' : 
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        <Zap size={12} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-300 font-medium leading-relaxed group-hover:text-white transition-colors">{log.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{log.event_type.replace('_', ' ')}</span>
                          <span className="text-[9px] font-medium text-gray-700">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 border-2 border-dashed border-gray-800/50 rounded-3xl text-center">
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-widest font-sans italic">Awaiting System Broadcast...</p>
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

export default DashboardPage;
