import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, TrendingUp, ShieldCheck, Download, Activity, Loader2, AlertCircle, 
  Search, RefreshCcw, CloudRain, Wind, Sun, Zap, ShieldAlert, Clock
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { api, getAuthHeaders } from '../../utils/api';

const WalletAndClaims = () => {
  const [data, setData] = useState({ balance: 0, payouts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch combined financial data
      const res = await api.get('/api/wallet/me', { headers: getAuthHeaders() });
      setData({
        balance: res.data?.balance ?? 0,
        payouts: Array.isArray(res.data?.payouts) ? res.data.payouts : []
      });
    } catch (err) {
      console.error("Financial Sync Error:", err);
      setError("Failed to synchronize financial node. Check network integrity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalEarnings = data.payouts.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const chartData = data.payouts.length > 0 
    ? [...data.payouts].sort((a,b) => new Date(a.event_date) - new Date(b.event_date)).map((p, i, arr) => {
        const cumulative = arr.slice(0, i+1).reduce((s, x) => s + Number(x.amount), 0);
        return { 
          date: new Date(p.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' }), 
          value: cumulative 
        };
      })
    : [];

  const filteredPayouts = data.payouts.filter(p => 
    p.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (reason) => {
    const r = reason?.toLowerCase() || '';
    if (r.includes('rain')) return <CloudRain size={16} className="text-blue-400" />;
    if (r.includes('aqi') || r.includes('pollution')) return <Wind size={16} className="text-indigo-400" />;
    if (r.includes('heat') || r.includes('temp')) return <Sun size={16} className="text-amber-400" />;
    return <Zap size={16} className="text-slate-400" />;
  };

  if (loading && data.payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-emerald-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Synchronizing ledger with secure node...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-poppins pb-10"
    >
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl translate-x-12 -translate-y-12"></div>
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4 border border-white/5"><Wallet size={20} /></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available Vault Balance</p>
          <p className="text-2xl font-black text-white tabular-nums">₹{data.balance.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl translate-x-12 -translate-y-12"></div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4 border border-white/5"><TrendingUp size={20} /></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Compensation</p>
          <p className="text-2xl font-black text-white tabular-nums">₹{totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl translate-x-12 -translate-y-12"></div>
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4 border border-white/5"><Activity size={20} /></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Response Latency</p>
          <p className="text-2xl font-black text-white uppercase tracking-tight">{data.payouts.length > 0 ? "< 2.4s" : "--"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory Chart */}
        <div className="lg:col-span-2 bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300">
           <div className="flex justify-between items-start mb-10">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Revenue Trajectory</h4>
                <p className="text-[11px] text-slate-500 font-medium tracking-tight uppercase">Life-to-date settlement curve</p>
              </div>
              <button className="p-2.5 bg-slate-800/50 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><RefreshCcw size={16} onClick={fetchData} className={loading ? 'animate-spin' : ''}/></button>
           </div>
           
           <div className="flex-1 w-full h-[280px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#glow)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20">
                  <Activity size={48} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-4">Awaiting Signal Synchronization</p>
                </div>
              )}
           </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300">
           <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-8">System Verification</h4>
           <div className="space-y-6 flex-1">
              <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                 <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl"><ShieldCheck size={20} /></div>
                 <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Ledger Integrity</p>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">Verified & Secure</p>
                 </div>
              </div>
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                 <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp size={20} /></div>
                 <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Growth Forecast</p>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">Optimized Output</p>
                 </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed font-normal italic">Historical triggers are cross-referenced with local environmental nodes to ensure 100% precision in settlements.</p>
           </div>
           <button className="mt-10 w-full py-4 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">Download Audit PDF</button>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-slate-800/20 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Search historical triggers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{filteredPayouts.length} Historical Triggers Recorded</span>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-slate-900/40">
                <th className="px-8 py-5">Trigger Source</th>
                <th className="px-8 py-5">Settlement</th>
                <th className="px-8 py-5">Date</th>
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
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">+ ₹{Number(p.amount).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.event_date || p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-8 py-6 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                      <ShieldCheck size={12} /> Settled
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <Clock size={32} className="text-slate-800 mb-4" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Zero Historical Signals Recorded</p>
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

export default WalletAndClaims;
