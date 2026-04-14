import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CreditCard, Calendar, ArrowUpRight, Download, ChevronRight, AlertCircle, Sparkles, RefreshCcw, Loader2 } from 'lucide-react';
import { api, getAuthHeaders } from '../../utils/api';

const PolicyCenter = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scaling, setScaling] = useState(false);
  const [error, setError] = useState(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/policies/me', { headers: getAuthHeaders() });
      console.log("Policy API Response:", res.data);
      setPolicies(res.data.policies || []);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
      setError("Unable to load policy data. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleScale = async () => {
    if (!activePolicy) return;
    try {
      console.log("[POLICY] Initiating scale sequence for ID:", activePolicy.id);
      setScaling(true);
      setSuccess(false);

      const currentCoverage = Number(activePolicy.coverage_percentage);
      if (currentCoverage >= 100) return;

      const newCoverage = 100;
      const newPremium = Number(activePolicy.premium) * 1.5;

      console.log(`[POLICY] Scaling: ${currentCoverage}% -> ${newCoverage}%. New Premium: ₹${newPremium}`);

      await api.post('/api/policies/scale', {
        policyId: activePolicy.id,
        newCoverage,
        newPremium
      });

      console.log("[POLICY] Sync successful. Re-fetching vectors...");
      await fetchPolicies();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("[POLICY] Scaling failed:", err);
      alert("Neural sync error: Could not expand protection parameters.");
    } finally {
      setScaling(false);
    }
  };

  const activePolicy = policies.find(p => p.status === 'active');
  const [success, setSuccess] = useState(false);

  // Derive dynamic labels based on coverage percentage
  const getTierName = (pct) => {
    if (pct >= 40) return "Elite";
    if (pct >= 30) return "Pro";
    return "Basic";
  };

  const tier = activePolicy ? getTierName(activePolicy.coverage_percentage) : "Standard";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton rounded-2xl h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton rounded-2xl h-96" />
          <div className="skeleton rounded-2xl h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
        <p className="text-slate-500 text-sm max-w-xs mb-8">The neural link to the policy server was interrupted. This could be a temporary synchronization issue.</p>
        <button 
          onClick={fetchPolicies}
          className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition active:scale-95"
        >
          <RefreshCcw size={14} /> Retry Sync
        </button>
      </div>
    );
  }

  if (!activePolicy) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
        <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400 mb-8">
          <Shield size={40} />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">No Active Protection</h3>
        <p className="text-slate-500 text-sm max-w-md mb-12 leading-relaxed">You have not subscribed to income protection yet. Your node is currently exposed to environmental and systemic disruption risks.</p>
        <button className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition shadow-2xl shadow-blue-500/20 active:scale-95 group">
          Activate Protection <ArrowUpRight size={18} className="inline ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>
    );
  }

  // Bind real data to summary cards
  const summaryCards = [
    { 
      label: 'Network Node', 
      value: activePolicy.status === "active" ? "Tier-1 Parametric" : "Protected", 
      icon: <Shield size={18} />, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/5' 
    },
    { 
      label: 'Weekly Payout', 
      value: `₹${Number(activePolicy.premium).toLocaleString()}`, 
      icon: <CreditCard size={18} />, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/5' 
    },
    { 
      label: 'Coverage Load', 
      value: `${activePolicy.coverage_percentage}%`, 
      icon: <Sparkles size={18} />, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/5' 
    },
    { 
      label: 'Next Boundary', 
      value: new Date(new Date(activePolicy.start_date).setMonth(new Date(activePolicy.start_date).getMonth() + 1)).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }), 
      icon: <Calendar size={18} />, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/5' 
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-poppins"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="premium-card p-6 group">
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              {card.icon}
            </div>
            <p className="text-[10px] uppercase tracking-wider font-black mb-1" style={{ color: "var(--text-muted)" }}>{card.label}</p>
            <p className="text-xl font-black" style={{ color: "var(--text-bright)" }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 premium-card p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-full text-[10px] font-bold uppercase tracking-wider">Active Certificate</span>
                <h3 className="text-3xl font-bold text-white mt-4 tracking-tight">{tier} Shield Node</h3>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-full text-[10px] font-bold uppercase tracking-wider">Synchronized</span>
                <p className="text-[11px] text-slate-500 mt-3 font-medium uppercase tracking-widest">ID: AGS-{activePolicy.id}-SYNC</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12 py-8 border-y border-white/5">
              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Subscription Tier</p>
                <p className="text-lg font-semibold text-white">{tier} Automated</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Weekly Premium</p>
                <p className="text-lg font-semibold text-white">₹{Number(activePolicy.premium).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Deployment Date</p>
                <p className="text-lg font-semibold text-blue-400">
                  {new Date(activePolicy.start_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleScale}
                disabled={scaling || Number(activePolicy.coverage_percentage) >= 100}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg active:scale-95 group disabled:opacity-50 ${
                  success ? 'bg-emerald-600 shadow-emerald-500/20 text-white' : 'bg-blue-600 shadow-blue-500/10 hover:bg-blue-500 text-white'
                }`}
              >
                {scaling ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : success ? (
                  <Shield size={14} className="animate-bounce" />
                ) : (
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                )}
                {scaling ? 'Expanding...' : success ? 'Elite Status Secured' : Number(activePolicy.coverage_percentage) >= 100 ? 'Fully Optimized' : 'Scale Protection'}
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95">
                <Download size={14} className="text-slate-500" /> Export Certificate
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 ml-auto">
                Deactivate Node
              </button>
            </div>
          </div>
        </div>

        <div className="premium-card p-8 flex flex-col">
          <h4 className="text-[10px] font-black uppercase tracking-wider mb-8" style={{ color: "var(--text-muted)" }}>Node Coverage Matrix</h4>
          <div className="space-y-6 flex-1">
            {[
              { label: 'Atmos Sensitivity', pct: 100, color: '#6366f1' },
              { label: 'Hydro Gradient',    pct: 100, color: '#10b981' },
              { label: 'Thermal Resilience',pct: 75,  color: '#818cf8' },
              { label: 'Systemic Health',   pct: 100, color: '#06b6d4' },
            ].map((item, i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span className="text-[10px] font-black" style={{ color: "var(--text-bright)" }}>{item.pct}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1.2, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="progress-fill"
                    style={{ background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}88 100%)` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-10 flex items-center justify-between p-4 rounded-xl transition-all group" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Matrix Calibration</span>
            <ChevronRight size={14} style={{ color: "var(--text-dim)" }} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PolicyCenter;
