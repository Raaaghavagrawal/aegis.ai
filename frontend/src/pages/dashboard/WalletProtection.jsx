import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck, Download, Clock, Activity, Loader2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../../utils/api';

const WalletProtection = () => {
  const [data, setData] = useState({ balance: 0, payouts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // The backend alias /api/wallet maps to payoutRoutes
      const res = await api.get('/api/wallet/me');
      console.log("[Wallet] API RESPONSE:", res.data);
      setData({
        balance: res.data?.balance ?? 0,
        payouts: Array.isArray(res.data?.payouts) ? res.data.payouts : []
      });
    } catch (err) {
      console.error("Wallet Fetch Error:", err);
      setError("Financial synchronization failed. Re-authenticating with ledger...");
    } finally {
      console.log("[Wallet] STATE:", data);
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalEarnings = data.payouts.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const chartData = data.payouts.length > 0 
    ? [...data.payouts].sort((a,b) => new Date(a.event_date) - new Date(b.event_date)).map((p, i, arr) => {
        const cumulative = arr.slice(0, i+1).reduce((s, x) => s + Number(x.amount), 0);
        return { date: new Date(p.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' }), value: cumulative };
      })
    : [];

  const mainStats = [
    { label: 'Available Balance', value: `₹${data.balance.toLocaleString()}`, sub: 'Secured parametric funds', icon: <Wallet size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Compensation', value: `₹${totalEarnings.toLocaleString()}`, sub: 'Life-to-date settlements', icon: <TrendingUp size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  if (loading && data.payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-emerald-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Synchronizing ledger with secure node...</p>
      </div>
    );
  }

  if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
         <AlertCircle size={48} className="text-rose-500 mb-6" />
         <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
         <button onClick={fetchData} className="mt-8 px-10 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all">Re-sync Wallet</button>
       </div>
     );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-poppins"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mainStats.map((stat, i) => (
          <div key={i} className="bg-slate-800/20 border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-3xl rounded-full translate-x-16 -translate-y-16 opacity-20`}></div>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-6 border border-white/5`}>{stat.icon}</div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300">
           <div className="flex justify-between items-start mb-10">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Revenue Trajectory</h4>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">Cumulative settlement curve from network triggers</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest hover:border-blue-500/30"><Download size={14} /> Export</button>
           </div>
           
           <div className="flex-1 w-full h-[300px] min-h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="walletGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                       itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#walletGlow)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                  <Activity size={32} className="opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Awaiting first settlement data</p>
                </div>
              )}
           </div>
        </div>

        <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300 overflow-hidden">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-8">Verification Ledger</h4>
          <div className="space-y-6 flex-1 overflow-y-auto pr-1">
             {data.payouts.length > 0 ? data.payouts.slice(0, 5).map((p, i) => (
               <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/5 transition-colors"><ArrowUpRight size={16}/></div>
                  <div className="flex-1 min-w-0">
                     <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{p.reason || 'Settlement'}</p>
                     <p className="text-[10px] text-slate-500 mt-1 font-medium">{new Date(p.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Verified</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-400 tabular-nums">+₹{Number(p.amount).toLocaleString()}</p>
               </div>
             )) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-700 py-10 opacity-50">
                  <Clock size={24} className="mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center">No ledger entries<br/>synchronized</p>
               </div>
             )}
          </div>
          <div className="mt-10 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><ShieldCheck size={20} /></div>
              <div>
                 <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Vault Status</p>
                 <p className="text-xs font-bold text-white uppercase tracking-tight">Active & Protected</p>
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletProtection;
