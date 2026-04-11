import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, AlertTriangle, TrendingDown, Clock, Lightbulb, MapPin, ChevronRight, Activity, Loader2, RefreshCcw } from 'lucide-react';
import { api } from '../../utils/api';

const AIRiskPredictor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");
  const income = user.weekly_income || 5000;
  const city = user.city || "Mathura";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 2 & 3: Correct endpoint and city parameter
      const res = await api.get(`/api/risk/predict?city=${city}`);
      
      // Step 1: Log Full API Response
      console.log("RISK API RESPONSE:", res);
      
      if (!res.data) {
        console.warn("RISK API: Response data is null");
        return;
      }

      setData(res.data);
    } catch (err) {
      console.error("Risk Fetch Error:", err);
      
      // Step 7: Handle Error Properly
      if (err.response?.status === 404) {
        setError("Risk service not available (404)");
      } else if (err.response?.status === 500) {
        setError("Prediction engine error (500)");
      } else {
        setError("AI analysis offline. Neural link disrupted.");
      }
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Running neural disruption vectors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
        <button onClick={fetchData} className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition active:scale-95">
          Retry Analysis
        </button>
      </div>
    );
  }

  const riskScore = data?.riskScore || 0;
  const metrics = data?.metrics || {};
  const riskLevels = [
    { name: 'AQI', value: Math.round((metrics.aqi / 300) * 40) || 1, color: '#3b82f6' },
    { name: 'Rainfall', value: Math.round((metrics.rainfall / 50) * 25) || 1, color: '#818cf8' },
    { name: 'Stability', value: Math.max(1, 100 - riskScore), color: '#1e293b' },
  ];

  const signals = [
    { label: 'Disruption Probability', value: data?.disruptionProbability != null ? `${data.disruptionProbability.toFixed(1)}%` : '--', trend: 'Calculated', icon: <Activity size={18} />, color: 'text-blue-400' },
    { label: 'Loss Estimation', value: data?.lossEstimation != null ? `₹${data.lossEstimation}` : '₹0', trend: 'Projected', icon: <TrendingDown size={18} />, color: 'text-rose-400' },
    { label: 'Model Confidence', value: data?.confidence != null ? `${data.confidence.toFixed(1)}%` : '--', trend: 'Optimal', icon: <Zap size={18} />, color: 'text-emerald-400' },
    { label: 'Sync Status', value: 'Active', trend: 'Real-time', icon: <Clock size={18} />, color: 'text-blue-400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-poppins"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {signals.map((sig, i) => (
          <div key={i} className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl hover:border-blue-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 bg-slate-900 border border-white/5 rounded-lg ${sig.color}`}>
                {sig.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sig.trend}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{sig.label}</p>
            <p className="text-2xl font-semibold text-white">{sig.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Neural Forecast Vector</h4>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">Projected disruption likelihood across node segments</p>
            </div>
            <div className="flex gap-2">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/5 text-blue-400 border border-blue-500/10">
                <MapPin size={12} /> {data?.city || city} Node
               </span>
            </div>
          </div>
          
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <Lightbulb size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">AI Recommendation</p>
                <p className="text-sm font-semibold text-white leading-relaxed">{data?.recommendation || 'Continuous monitoring active.'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">Risk exposure based on {data?.risk?.risk_level || 'stable'} environmental indicators. Parametric triggers are calibrated to localized telemetry nodes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                { label: 'Disruption Risk', value: Math.max(0, riskScore), color: 'bg-blue-500' },
                { label: 'System Integrity', value: data?.confidence || 99, color: 'bg-emerald-500' },
                { label: 'Sync Accuracy', value: 99.4, color: 'bg-indigo-500' },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                    <span>{m.label}</span>
                    <span className="text-white">{m.value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full border border-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1 }} className={`h-full ${m.color}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-6 flex items-center justify-center">
               <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Stability Index</p>
                 <p className="text-4xl font-bold text-blue-400">{Math.round(100 - riskScore)}%</p>
                 <p className="text-[10px] text-slate-600 mt-2 font-medium uppercase tracking-wider">Optimal Condition</p>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300">
          <div className="flex justify-between items-center mb-8">
             <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Metric Mapping</h4>
             <button onClick={fetchData} className="p-1.5 text-slate-500 hover:text-white transition-colors"><RefreshCcw size={14} className={loading ? 'animate-spin' : ''}/></button>
          </div>
          <div className="flex-1 w-full h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskLevels} innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value" stroke="none">
                  {riskLevels.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <AlertTriangle size={24} className="mx-auto text-slate-600 mb-2" />
                <p className="text-lg font-bold text-white leading-none">{riskScore}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Score</p>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-xl group cursor-pointer hover:border-blue-500/20 transition-all">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-500/5 rounded-lg text-blue-400"><TrendingDown size={14}/></div>
                 <div>
                   <p className="text-[11px] font-bold text-slate-200 uppercase tracking-wider leading-none mb-1">Volatility Vector</p>
                   <p className="text-[10px] text-slate-500 font-medium">Synced just now</p>
                 </div>
               </div>
               <ChevronRight size={16} className="text-slate-700 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIRiskPredictor;
