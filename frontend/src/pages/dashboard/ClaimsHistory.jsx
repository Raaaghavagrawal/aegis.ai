import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Wind, CloudRain, Sun, Zap, ShieldCheck, Clock, ShieldAlert, RefreshCcw } from 'lucide-react';
import { api } from '../../utils/api';

const ClaimsHistory = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get('/api/claims/me');
      setPayouts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Claims Fetch Error:", err);
      setError("Failed to synchronize node ledger. Check network integrity.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPayouts = payouts.filter(p => 
    p.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Settled Compensation', value: `₹${payouts.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}`, color: 'text-blue-400' },
    { label: 'Network Triggers', value: payouts.length, color: 'text-indigo-400' },
    { label: 'Response Latency', value: payouts.length > 0 ? '< 2.4s' : '--', color: 'text-emerald-400' },
    { label: 'Ledger Status', value: loading ? 'Syncing...' : 'Verified', color: 'text-slate-400' },
  ];

  const getStatusIcon = (reason) => {
    const r = reason?.toLowerCase() || '';
    if (r.includes('rain')) return <CloudRain size={16} className="text-blue-400" />;
    if (r.includes('aqi') || r.includes('pollution') || r.includes('air')) return <Wind size={16} className="text-indigo-400" />;
    if (r.includes('heat') || r.includes('temp')) return <Sun size={16} className="text-amber-400" />;
    return <Zap size={16} className="text-slate-400" />;
  };

  if (loading && payouts.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800/40 rounded-2xl border border-white/5" />)}
         </div>
         <div className="h-96 bg-slate-800/40 rounded-2xl border border-white/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
        <ShieldAlert size={48} className="text-rose-500 mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
        <button onClick={fetchData} className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-slate-700 transition-all">
          <RefreshCcw size={14} /> Retry Sync
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 font-poppins"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
            <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/20 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Filter node ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2.5 bg-slate-800/50 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-slate-900/20">
                <th className="px-8 py-5">Event Source</th>
                <th className="px-8 py-5">Managed Node</th>
                <th className="px-8 py-5">Settlement</th>
                <th className="px-8 py-5">Temporal Node</th>
                <th className="px-8 py-5 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayouts.length > 0 ? filteredPayouts.map((p, i) => (
                <tr key={p.id || i} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 border border-white/5 group-hover:border-blue-500/20 transition-colors">
                        {getStatusIcon(p.reason)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight uppercase">{p.reason || 'Network Signal'}</p>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Parametric Trigger</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-400 uppercase tracking-tight">{p.city || 'Global Node'}</td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">+ ₹{Number(p.amount).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{new Date(p.event_date || p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-8 py-6 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                      <ShieldCheck size={12} /> Settled
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <ShieldAlert size={32} className="text-slate-800 mb-4" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No historical triggers detected</p>
                      <p className="text-[11px] text-slate-600 mt-2 font-medium">Node ledger is currently empty for active deployment.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ClaimsHistory;
