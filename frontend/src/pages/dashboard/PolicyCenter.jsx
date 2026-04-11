import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CreditCard, Calendar, ArrowUpRight, Download, ChevronRight, AlertCircle, Sparkles, RefreshCcw } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="space-y-6 font-poppins">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl animate-pulse h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/20 border border-white/5 rounded-2xl p-8 animate-pulse h-96" />
          <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 animate-pulse h-96" />
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
          <div key={i} className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl hover:border-blue-500/10 transition-all duration-300 group shadow-sm">
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-4 border border-white/5`}>
              {card.icon}
            </div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{card.label}</p>
            <p className="text-xl font-semibold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/20 border border-white/5 rounded-2xl p-8 relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-full text-[10px] font-bold uppercase tracking-wider">Active Certificate</span>
                <h3 className="text-3xl font-bold text-white mt-4 tracking-tight">Elite Shield Node</h3>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-full text-[10px] font-bold uppercase tracking-wider">Synchronized</span>
                <p className="text-[11px] text-slate-500 mt-3 font-medium uppercase tracking-widest">ID: AGS-{activePolicy.id}-SYNC</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12 py-8 border-y border-white/5">
              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Subscription Tier</p>
                <p className="text-lg font-semibold text-white">Weekly Automated</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Premium Cost</p>
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

        <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col shadow-sm">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-8">Node Coverage Matrix</h4>
          <div className="space-y-7 flex-1">
            {[
              { label: 'Atmos Sensitivity', pct: 100, color: 'bg-blue-500' },
              { label: 'Hydro Gradient', pct: 100, color: 'bg-emerald-500' },
              { label: 'Thermal Resilience', pct: 75, color: 'bg-indigo-500' },
              { label: 'Systemic Health', pct: 100, color: 'bg-blue-600' },
            ].map((item, i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
                  <span className="text-[11px] font-bold text-white">{item.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full ${item.color} rounded-full`} 
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-12 flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition group">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matrix Calibration</span>
            <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PolicyCenter;
