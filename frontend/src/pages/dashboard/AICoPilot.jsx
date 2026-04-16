import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, MapPin, TrendingUp, AlertTriangle, Clock, MessageSquare,
  ChevronRight, Send, Sparkles, Shield, CloudRain, Moon, Target,
  BarChart3, Loader2, RefreshCw, Lightbulb, Brain, Activity,
  ArrowUpRight, Star, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api, getAuthHeaders } from '../../utils/api';

const genEarnings = () =>
  Array.from({ length: 12 }, (_, i) => ({
    time:     `${i * 10}m`,
    earnings: 400 + Math.random() * 700,
  }));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-bright)" }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-black" style={{ color: "#10b981" }}>₹{Number(payload[0].value).toFixed(0)}</p>
    </div>
  );
};

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const AICoPilot = () => {
  const [loading, setLoading]             = useState(true);
  const [predData, setPredData]           = useState(genEarnings());
  const [shiftHours, setShiftHours]       = useState('4');
  const [planResult, setPlanResult]       = useState(false);
  const [chatInput, setChatInput]         = useState('');
  const [messages, setMessages]           = useState([]);
  const [lastSync, setLastSync]           = useState(new Date());
  const [activeRec, setActiveRec]         = useState(0);

  const user = JSON.parse(localStorage.getItem('aegis_user') || '{}');
  const [envData, setEnvData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/environment', { 
          headers: getAuthHeaders() 
        });
        setEnvData(res.data);
        setLoading(false);
        setMessages([{
          role: 'ai',
          text: `Hello ${user.name || 'Partner'} 👋 I'm your GigShield AI Co-Pilot. Synchronized with ${res.data.current?.city || user.city || 'your city'}. Environmental risk is ${res.data.current?.risk_level || 'Low'}. How can I help maximize your earnings today?`,
        }]);
      } catch (err) {
        console.error("Co-Pilot sync error:", err);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(() => {
      setPredData(genEarnings());
      setLastSync(new Date());
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const currentCity = envData?.current?.city || user.city || "Mathura";
  
  const recommendations = [
    { loc: `${currentCity} Central`, boost: "+₹180", demand: "Peak", duration: "20 mins", conf: 94, icon: <Zap size={16} />, iconColor: "text-amber-400", bgColor: "bg-amber-500/10" },
    { loc: `${currentCity} Market`,  boost: "+₹120", demand: "High", duration: "45 mins", conf: 87, icon: <MapPin size={16} />, iconColor: "text-indigo-400", bgColor: "bg-indigo-500/10" },
    { loc: `${currentCity} Plaza`,   boost: "+₹90",  demand: "Medium",duration: "60 mins", conf: 72, icon: <Target size={16} />, iconColor: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  ];

  const riskAlerts = envData?.nearby_alert ? [
    { level: "danger",  msg: "Active Trigger Zone", sub: envData.nearby_alert.message, color: "text-rose-400",  bg: "bg-rose-500/8",  border: "border-rose-500/20",  icon: <AlertTriangle size={15} /> },
    { level: "info",    msg: `${envData.current?.condition} Detected`, sub: `Temp: ${envData.current?.temp_c}°C · AQI: ${envData.current?.air_quality}`,  color: "text-blue-400",  bg: "bg-blue-500/8",  border: "border-blue-500/20",  icon: <CloudRain size={15} /> },
    { level: "warning", msg: "Risk Forecast",      sub: envData.current?.ai_insight || "Stable condition in area",    color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/20", icon: <Shield size={15} /> },
  ] : [
    { level: "warning", msg: "Moderate Risk Zone", sub: `Increased congestion near ${currentCity}`, color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/20", icon: <AlertTriangle size={15} /> },
    { level: "info",    msg: "Normal Conditions",  sub: `AQI is ${envData?.current?.air_quality || 50} in ${currentCity}`,  color: "text-blue-400",  bg: "bg-blue-500/8",  border: "border-blue-500/20",  icon: <CloudRain size={15} /> },
    { level: "info",    msg: "Shield Protection",   sub: "Parametric monitoring active",       color: "text-indigo-400",  bg: "bg-indigo-500/8",  border: "border-indigo-500/20",  icon: <Shield size={15} /> },
  ];

  const demandZones = [
    { zone: `${currentCity} Hub`,  heat: 12, label: "Extreme", color: "#f43f5e" },
    { zone: `${currentCity} North`, heat: 9, label: "High",    color: "#f59e0b" },
    { zone: `${currentCity} West`,  heat: 5, label: "Medium", color: "#6366f1" },
  ];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput };
    const aiReply = {
      role: 'ai',
      text: `Based on current demand near ${currentCity}, I recommend heading to ${currentCity} Central. You could earn an extra ₹180 in the next 20 minutes. Safety score is ${envData?.current?.risk_score ? (100 - envData.current.risk_score) : 92}/100. 🚀`,
    };
    setMessages(prev => [...prev, userMsg, aiReply]);
    setChatInput('');
  };



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Brain size={28} className="text-indigo-400" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-indigo-500/20 animate-ping" />
        </div>
        <p className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={14} className="animate-spin text-indigo-400" /> Synchronizing Neural Co-Pilot...
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 pb-8">

      {/* Hero Banner */}
      <motion.div variants={fadeUp} className="premium-card p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.08) 100%)", borderColor: "rgba(99,102,241,0.25)" }}>
        <div className="blob blob-blue absolute -top-10 right-20 w-64 h-64 opacity-30" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Brain size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--text-bright)" }}>AI Co-Pilot</h2>
                <div className="badge-live"><div className="pulse-dot pulse-dot-green" />Active</div>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Maximizing your earnings · watching {user.city || "your city"} in real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Safety Score</p>
              <p className="text-2xl font-black gradient-text">{envData?.current?.risk_score ? (100 - envData.current.risk_score) : 92}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Synced</p>
              <p className="text-xs font-black" style={{ color: "#10b981" }}>{lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min">
        {/* Smart Recommendations */}

            {/* Smart Recommendations */}
            <motion.div variants={fadeUp} className="premium-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <Lightbulb size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--text-bright)" }}>Smart Moves</h3>
                  <p className="flex items-center gap-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                    <Star size={10} className="text-amber-400" /> AI-ranked by earnings potential
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveRec(i)}
                    className="p-4 rounded-2xl cursor-pointer transition-all duration-200"
                    style={{
                      background:   activeRec === i ? "rgba(99,102,241,0.12)" : "var(--bg-glass)",
                      border:       activeRec === i ? "1px solid rgba(99,102,241,0.35)" : "1px solid var(--border)",
                      boxShadow:    activeRec === i ? "0 4px 20px rgba(99,102,241,0.15)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${rec.bgColor}`}>
                          <span className={rec.iconColor}>{rec.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black" style={{ color: "var(--text-bright)" }}>📍 {rec.loc}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center text-[10px] font-black text-emerald-400">
                              <ArrowUpRight size={12} className="mr-0.5" />{rec.boost}
                            </span>
                            <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>· {rec.duration} window</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] font-black" style={{ color: rec.conf >= 90 ? "#10b981" : rec.conf >= 75 ? "#f59e0b" : "var(--text-muted)" }}>
                            {rec.conf}%
                          </div>
                          <div className="mt-1 h-1 w-10 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${rec.conf}%` }}
                              transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                              className="h-full rounded-full"
                              style={{ background: rec.conf >= 90 ? "#10b981" : rec.conf >= 75 ? "#f59e0b" : "#6366f1" }}
                            />
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Earnings Forecast */}
            <motion.div variants={fadeUp} className="premium-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--text-bright)" }}>Earnings Forecast</h3>
                    <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>Next 2 hours projection</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw size={10} className="animate-spin" style={{ color: "var(--text-dim)" }} />
                  <span className="text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Live</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black tracking-tight" style={{ color: "var(--text-bright)" }}>₹850</p>
                  <p className="text-xl font-black" style={{ color: "var(--text-muted)" }}>– ₹1,100</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="badge-live"><div className="pulse-dot pulse-dot-green" />High Confidence</div>
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>Based on demand trends</span>
                </div>
              </div>

              <div className="flex-1 min-h-[130px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predData}>
                    <defs>
                      <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={9} axisLine={false} tickLine={false} width={35} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2.5} fill="url(#earnGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>


            {/* Shift Planner */}
            <motion.div variants={fadeUp} className="premium-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <Target size={16} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--text-bright)" }}>Shift Optimizer</h3>
                  <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>AI-generated schedule</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!planResult ? (
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                    <div>
                      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                        <Clock size={12} className="text-indigo-400" /> Hours available today
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {["2","4","6","8"].map(h => (
                          <button
                            key={h}
                            onClick={() => setShiftHours(h)}
                            className="py-3 rounded-xl text-xs font-black transition-all duration-200"
                            style={{
                              background:    shiftHours === h ? "rgba(99,102,241,0.2)" : "var(--bg-glass)",
                              border:        shiftHours === h ? "1px solid rgba(99,102,241,0.5)" : "1px solid var(--border)",
                              color:         shiftHours === h ? "#818cf8" : "var(--text-muted)",
                              boxShadow:     shiftHours === h ? "0 4px 15px rgba(99,102,241,0.2)" : "none",
                            }}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setPlanResult(true)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
                    >
                      <Brain size={14} /> Generate AI Plan <Sparkles size={14} className="opacity-75" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
                      {[
                        { label: "Optimal Window", value: "6:00 PM – 10:00 PM" },
                        { label: "Prime Zone",     value: `📍 ${currentCity} Hub`, highlight: true },
                        { label: "Projected Yield", value: "₹940+", green: true },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                          <span className={`text-xs font-black ${row.green ? "text-emerald-400" : row.highlight ? "text-indigo-400" : ""}`} style={!row.green && !row.highlight ? { color: "var(--text-bright)" } : {}}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <p className="text-[10px] font-bold text-emerald-400">Plan generated for {shiftHours}h shift</p>
                    </div>
                    <button onClick={() => setPlanResult(false)} className="btn-secondary w-full text-[10px] py-2">
                      Regenerate
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Demand Heatmap */}
            <motion.div variants={fadeUp} className="premium-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <BarChart3 size={16} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--text-bright)" }}>Demand Heatmap</h3>
                  <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>Live order density by zone</p>
                </div>
              </div>

              <div className="space-y-5">
                {demandZones.map((zone, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black" style={{ color: "var(--text-bright)" }}>{zone.zone}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-lg" style={{ color: zone.color, background: `${zone.color}18`, border: `1px solid ${zone.color}35` }}>
                        {zone.label}
                      </span>
                    </div>
                    <div className="h-5 rounded-xl flex items-center px-1.5 gap-0.5 overflow-hidden" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
                      {Array.from({ length: 16 }, (_, b) => (
                        <motion.div
                          key={b}
                          initial={{ scaleY: 0, opacity: 0 }}
                          animate={{ scaleY: 1, opacity: b < zone.heat ? 1 : 0.12 }}
                          transition={{ delay: b * 0.04 + i * 0.15, duration: 0.4 }}
                          className="flex-1 rounded-sm"
                          style={{
                            height: "10px",
                            background: b < zone.heat ? zone.color : "var(--border)",
                            transformOrigin: "bottom",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>


          {/* Risk Intelligence */}
          <motion.div variants={fadeUp} className="premium-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <Shield size={16} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--text-bright)" }}>Risk Intelligence</h3>
                <p className="flex items-center gap-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                  <Activity size={10} className="text-rose-400" /> Live threat monitoring
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {riskAlerts.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className={`p-3 rounded-2xl flex items-start gap-3 ${a.bg}`}
                  style={{ border: `1px solid ${a.border.replace("border-", "")}` }}
                >
                  <span className={`mt-0.5 shrink-0 ${a.color}`}>{a.icon}</span>
                  <div>
                    <p className={`text-xs font-black ${a.color}`}>{a.msg}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{a.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Safety Score */}
            <div className="p-4 rounded-2xl text-center" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>AI Safety Score</p>
              <div className="flex items-center justify-center gap-4">
                <p className="text-4xl font-black gradient-text">{envData?.current?.risk_score ? (100 - envData.current.risk_score) : 92}</p>
                <div className="text-left">
                  <p className="text-[10px] font-black text-emerald-400">OPTIMAL</p>
                  <p className="text-[9px]" style={{ color: "var(--text-dim)" }}>Updated {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Chat */}
          <motion.div variants={fadeUp} className="premium-card p-5 flex flex-col" style={{ height: "400px" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <MessageSquare size={16} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--text-bright)" }}>Neural Assistant</h3>
                <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>Ask me anything</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed"
                    style={{
                      background: msg.role === 'user'
                        ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                        : "var(--bg-glass)",
                      border:     msg.role === 'user' ? "none" : "1px solid var(--border)",
                      color:      msg.role === 'user' ? "#fff" : "var(--text-main)",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {["Recommend location", "Earnings goal", "Safety risk", "Weather check"].map(q => (
                    <button
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your AI Co-Pilot..."
                className="w-full rounded-2xl py-3.5 px-5 pr-14 text-xs font-semibold focus:outline-none transition-all"
                style={{
                  background:   "var(--bg-glass)",
                  border:       "1px solid var(--border-bright)",
                  color:        "var(--text-main)",
                  caretColor:   "var(--primary)",
                }}
              />
              <button
                onClick={handleSendMessage}
                className="absolute right-2 top-1.5 h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </motion.div>
      </div>
    </motion.div>
  );
};

export default AICoPilot;
