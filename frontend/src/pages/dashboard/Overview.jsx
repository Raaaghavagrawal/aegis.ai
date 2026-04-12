import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Zap, TrendingUp, Activity, Loader2, AlertCircle, BadgeCheck } from 'lucide-react';
import { api } from '../../utils/api';

const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/dashboard/overview');
      console.log("OVERVIEW RAW:", res.data);
      
      const mappedData = {
        ...res.data,
        netProtected: res.data.ai_metrics?.net_protected_forecast || 0,
        weeklyIncome: res.data.ai_metrics?.weekly_income || 0,
        financialMomentum: res.data.user?.wallet_balance || res.data.wallet_balance || 0,
        history: res.data.history || [],
        activePolicy: res.data.active_policy || null,
      };

      setData(mappedData);
    } catch (err) {
      console.error("Overview Fetch Error:", err);
      setError("Failed to synchronize with Aegis neural network. Re-initiating uplink...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data) console.log("[Overview] STATE UPDATED:", data);
  }, [data]);

  const stats = data?.system_stats || {};
  const ai = data?.ai_metrics || {};
  const env = data?.environment || {};
  const user = data?.user || {};

  const pieData = useMemo(() => {
    const env = data?.environment || {};
    const ai = data?.ai_metrics || {};

    if (!ai || !env) return [];
    const aq = env.aqi || 0;
    const rf = env.rainfall || 0;
    const riskScr = ai.risk?.risk_score || 0;
    
    // Weighted risk metrics
    const wAtmos = 10 + (aq / 300) * 90;
    const wHydro = 10 + Math.min(1, rf / 50) * 90;
    const wSystem = 10 + (riskScr / 100) * 90;
    const total = wAtmos + wHydro + wSystem;
    
    return [
      { name: "Atmospheric", color: "#3b82f6", value: Math.round((wAtmos / total) * 100) },
      { name: "Precipitation", color: "#818cf8", value: Math.round((wHydro / total) * 100) },
      { name: "Systemic", color: "#6366f1", value: Math.round((wSystem / total) * 100) },
    ];
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.history) return [];

    const transformed = data.history
      .map(item => ({
        time: item.time,
        AQI: Number(item.aqi),
        Rainfall: Number(item.rainfall),
        Temperature: Number(item.temperature)
      }));

    return transformed;

  }, [data?.history]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Polling distributed telemetry nodes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
        <AlertCircle size={48} className="text-rose-500 mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
        <button onClick={fetchData} className="mt-8 px-10 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all">Retry Link</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 font-poppins"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/20 rounded-2xl p-8 border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300 group h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-50"><Zap size={20} className="text-blue-500/20" /></div>
          <div className="flex flex-col items-center mb-10 w-full">
            <div className="text-center">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Net Protected Forecast</p>
              <h3 className="text-5xl font-semibold text-white tracking-tight mb-4 tabular-nums">
                ₹{Number(ai.net_protected_forecast || 0).toLocaleString()}
              </h3>
              {data?.activePolicy && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <BadgeCheck size={14} className="animate-pulse" /> Active {data.activePolicy.coverage_percentage === 40 ? 'Elite' : data.activePolicy.coverage_percentage === 30 ? 'Pro' : 'Basic'} Shield Enabled
                </div>
              )}
              <div className="mt-8 flex flex-wrap justify-center items-center gap-12 text-sm">
                <div className="flex flex-col items-center">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">Weekly Income</span>
                  <span className="text-white text-lg font-semibold tabular-nums">₹{Number(ai.weekly_income || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">Potential Offset</span>
                  <span className="text-rose-400 text-lg font-semibold tabular-nums">₹{Number(ai.estimated_loss || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">Model Precision</span>
                  <span className="text-blue-400 text-lg font-semibold tabular-nums">{Math.round((ai.confidence || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-[300px] mt-4 relative">
            {chartData.length >= 1 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="time" interval={3} stroke="#475569" fontSize={8} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '11px', color: '#64748b' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area yAxisId="left" type="monotone" dataKey="AQI" stroke="none" fill="#3b82f6" fillOpacity={0.1} legendType="none" />
                  <Bar yAxisId="left" dataKey="AQI" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="Rainfall" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="Temperature" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-900/40 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center px-6">
                <Activity size={32} className="text-blue-500/20 mb-4" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Awaiting Atmospheric Telemetry</p>
                <p className="text-[8px] opacity-50 mt-1 uppercase">Localized sensor synchronization in progress for {data?.user?.city || "your region"}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/20 rounded-2xl p-8 border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300 h-full flex flex-col">
          <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2">Node Distribution</h4>
          <p className="text-[10px] text-slate-500 mb-8 leading-snug">
            Current risk weights detected across localized telemetry nodes.
          </p>
          <div className="w-full h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">AQI</p>
               <p className="text-xl font-bold text-white leading-none">{env.aqi || "--"}</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-tight">{d.name}</span>
                </div>
                <span className="text-[11px] font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded border border-white/5 tabular-nums">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/20 rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all duration-300">
           <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Aegis Factor Assessment</h4>
           <div className="space-y-4">
              {[
                { label: 'Atmospheric Buffer', value: env.aqi != null ? `${Math.max(0, 100 - Math.round(env.aqi/3))}%` : '--', color: 'bg-blue-500' },
                { label: 'Hydric Load', value: env.rainfall != null ? `${Math.min(100, env.rainfall * 2)}%` : '--', color: 'bg-indigo-500' },
                { label: 'Model Trust', value: ai.confidence != null ? `${Math.round(ai.confidence * 100)}%` : '--', color: 'bg-emerald-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{item.label}</span>
                      <span className="text-white">{item.value}</span>
                   </div>
                   <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: item.value.includes('%') ? item.value : 0 }} className={`h-full ${item.color}`} />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-slate-800/20 rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all duration-300">
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Neural Pulse Cluster</h4>
              <span className="text-[9px] font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest whitespace-nowrap">{user.city} Segment</span>
           </div>
           <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6">Active localized environmental triggers synchronized with Aegis cloud infrastructure.</p>
           <div className="flex items-center gap-4 p-4 bg-slate-950/40 rounded-2xl border border-white/5">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500"><TrendingUp size={20}/></div>
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Growth Index</p>
                 <p className="text-lg font-bold text-white uppercase tracking-tight">+14.2% Stability</p>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Overview;
