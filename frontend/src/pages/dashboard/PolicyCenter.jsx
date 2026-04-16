import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CreditCard, Calendar, ArrowUpRight, Download, ChevronRight, AlertCircle, Sparkles, RefreshCcw, Loader2 } from 'lucide-react';
import { api, getAuthHeaders } from '../../utils/api';

const PolicyCenter = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scaling, setScaling] = useState(false);
  const [error, setError] = useState(null);
  const [fraudData, setFraudData] = useState(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pRes, fRes] = await Promise.all([
        api.get('/api/policies/me', { headers: getAuthHeaders() }),
        api.get('/api/risk/fraud/overview', { headers: getAuthHeaders() }).catch(() => ({ data: null }))
      ]);
      console.log("Policy API Response:", pRes.data);
      setPolicies(pRes.data.policies || []);
      setFraudData(fRes.data);
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
        <div className="lg:col-span-2 rounded-[32px] p-10 relative overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 font-poppins" style={{ backgroundColor: 'var(--bg-card)', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.08) 100%)' }}>
          {/* Neural Seal Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
            <Shield size={420} className="text-indigo-500" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-16 px-2">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Live Parametric Certificate
                </span>
                <h3 className="text-4xl font-black tracking-tighter leading-none mb-3" style={{ color: 'var(--text-bright)' }}>
                  {tier} Shield Node
                </h3>
                <p className="text-[11px] text-slate-500 font-bold font-mono uppercase tracking-tight">NODE_HASH: AEGIS_NET_{activePolicy.id?.toString().padStart(4, '0')}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                   SYNC_OK
                </span>
                <p className="text-[11px] text-slate-500 mt-4 font-black uppercase tracking-[0.3em]">ID: AGS-{activePolicy.id}-SYNC</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-16 p-8 bg-slate-500/5 dark:bg-white/[0.02] border border-slate-500/10 dark:border-white/5 rounded-[28px] backdrop-blur-md">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                  <Sparkles size={12} className="text-indigo-500" /> Subscription
                </div>
                <p className="text-2xl font-black italic tracking-tight" style={{ color: 'var(--text-bright)' }}>{tier} Automated</p>
                <div className="h-0.5 w-12 bg-indigo-500/40 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                  <CreditCard size={12} className="text-emerald-500" /> Premium
                </div>
                <p className="text-2xl font-black italic tracking-tight" style={{ color: 'var(--text-bright)' }}>₹{Number(activePolicy.premium || 0).toLocaleString()}</p>
                <div className="h-0.5 w-12 bg-emerald-500/40 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                  <Calendar size={12} className="text-blue-500" /> Deployment
                </div>
                <p className="text-2xl font-black italic tracking-tight text-blue-600 dark:text-blue-400">
                  {new Date(activePolicy.start_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="h-0.5 w-12 bg-blue-500/40 rounded-full" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 px-4">
              <button 
                onClick={handleScale}
                disabled={scaling || Number(activePolicy.coverage_percentage) >= 100}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-2xl active:scale-95 group disabled:opacity-50 ${
                  success ? 'bg-emerald-600 shadow-emerald-500/30 text-white' : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-500/30 text-white'
                }`}
              >
                {scaling ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : success ? (
                  <Shield size={16} className="animate-bounce" />
                ) : (
                  <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                )}
                <span className="tracking-widest">{scaling ? 'Expanding Node...' : success ? 'Shield Verified' : 'Optimize Protection'}</span>
              </button>
              
              <button className="flex items-center gap-3 px-8 py-4 bg-slate-900/10 dark:bg-slate-900/40 hover:bg-slate-900 border border-slate-900/10 dark:border-white/5 hover:border-slate-900 dark:hover:border-white/10 text-slate-600 dark:text-slate-400 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 group">
                <Download size={16} className="text-slate-500 group-hover:text-white transition-colors" /> Export PDF
              </button>

              <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500/40 hover:text-rose-500 transition-colors ml-auto group">
                Deactivate Node <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="premium-card p-8 flex flex-col">
          <h4 className="text-[10px] font-black uppercase tracking-wider mb-8" style={{ color: "var(--text-muted)" }}>Behavioral Peer Analysis</h4>
          <div className="space-y-6 flex-1">
            <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full ${fraudData?.peerComparison?.status === 'Normal' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-bright)' }}>
                  {fraudData?.peerComparison?.status || 'Active'}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {fraudData?.peerComparison?.label || "Calibrating behavioral vectors against regional claim aggregates."}
              </p>
            </div>

            {[
              { label: 'Claim Regularity', pct: fraudData?.peerComparison?.score ? Math.max(0, 100 - (fraudData.peerComparison.score * 10)) : 100, color: '#6366f1' },
              { label: 'Zone Synchronization', pct: 92, color: '#10b981' },
              { label: 'Platform Consistency', pct: 88,  color: '#818cf8' },
              { label: 'Integrity Rating',    pct: 95, color: '#06b6d4' },
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
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Drill Down Logs</span>
            <ChevronRight size={14} style={{ color: "var(--text-dim)" }} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PolicyCenter;
