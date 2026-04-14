import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, ShieldCheck, Download,
  Clock, Activity, Loader2, AlertCircle, ArrowUpRight, RefreshCcw, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../utils/api';

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-bright)" }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-black text-emerald-400">₹{Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

const WalletProtection = () => {
  const [data, setData]       = useState({ balance: 0, payouts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/api/wallet/me');
      setData({
        balance: res.data?.balance ?? 0,
        payouts: Array.isArray(res.data?.payouts) ? res.data.payouts : [],
      });
    } catch (err) {
      setError("Financial sync failed. Re-authenticating with ledger...");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalEarnings = data.payouts.reduce((s, p) => s + Number(p.amount), 0);

  const chartData = data.payouts.length > 0
    ? [...data.payouts]
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .map((p, i, arr) => ({
          date:  new Date(p.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          value: arr.slice(0, i + 1).reduce((s, x) => s + Number(x.amount), 0),
        }))
    : [{ date: "Now", value: data.balance }];

  if (loading && data.payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <div className="relative mb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Wallet size={24} className="text-emerald-400" />
          </div>
          <Loader2 size={14} className="animate-spin absolute -bottom-1 -right-1 text-emerald-400" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.25em] animate-pulse" style={{ color: "var(--text-muted)" }}>
          Syncing vault...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
          <AlertCircle size={24} className="text-rose-400" />
        </div>
        <h3 className="text-base font-black mb-2" style={{ color: "var(--text-bright)" }}>Ledger Offline</h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button onClick={fetchData} className="btn-primary"><RefreshCcw size={13} /> Re-sync Wallet</button>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-bright)" }}>
            Wallet & Protection
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Your secured parametric funds · Aegis vault
          </p>
        </div>
        <div className="badge-live"><div className="pulse-dot pulse-dot-green" />Vault Active</div>
      </motion.div>

      {/* Balance + Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[
          {
            label: "Available Balance",
            value: `₹${data.balance.toLocaleString()}`,
            sub: "Secured funds · Ready to withdraw",
            icon: <Wallet size={18} />, bgg: "bg-emerald-500/10", tc: "text-emerald-400",
            accent: "#10b981",
          },
          {
            label: "Total Compensation",
            value: `₹${totalEarnings.toLocaleString()}`,
            sub: "Lifetime settlements received",
            icon: <TrendingUp size={18} />, bgg: "bg-indigo-500/10", tc: "text-indigo-400",
            accent: "#6366f1",
          },
          {
            label: "Active Payouts",
            value: data.payouts.length,
            sub: "Recorded transactions",
            icon: <Zap size={18} />, bgg: "bg-amber-500/10", tc: "text-amber-400",
            accent: "#f59e0b",
          },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeUp} className="premium-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 translate-x-8 -translate-y-8"
              style={{ background: stat.accent }} />
            <div className={`w-10 h-10 ${stat.bgg} rounded-xl flex items-center justify-center mb-5 relative z-10`}>
              <span className={stat.tc}>{stat.icon}</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 relative z-10" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
            <p className="text-3xl font-black tracking-tight relative z-10" style={{ color: "var(--text-bright)" }}>
              {stat.value}
            </p>
            <p className="text-[10px] mt-2 relative z-10" style={{ color: "var(--text-dim)" }}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart + Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Trajectory */}
        <motion.div variants={fadeUp} className="lg:col-span-2 premium-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-bright)" }}>
                Revenue Trajectory
              </h4>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Cumulative settlement curve
              </p>
            </div>
            <button className="btn-secondary py-2 px-3 text-[10px]">
              <Download size={12} /> Export
            </button>
          </div>

          <div className="flex-1 h-[240px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -5, right: 0 }}>
                  <defs>
                    <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--chart-axis)" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontWeight: 700 }} />
                  <YAxis stroke="var(--chart-axis)" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#walletGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center" style={{ color: "var(--text-dim)" }}>
                <Activity size={32} className="mb-3 opacity-30" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Awaiting first settlement</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transaction Ledger */}
        <motion.div variants={fadeUp} className="premium-card p-6 flex flex-col">
          <h4 className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
            Verification Ledger
          </h4>

          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
            {data.payouts.length > 0 ? data.payouts.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center gap-3 group p-3 rounded-xl transition-all" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate" style={{ color: "var(--text-bright)" }}>
                    {p.reason || 'Settlement'}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {new Date(p.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <p className="text-xs font-black text-emerald-400 shrink-0">+₹{Number(p.amount).toLocaleString()}</p>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12" style={{ color: "var(--text-dim)" }}>
                <Clock size={24} className="mb-3 opacity-40" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-center">No entries yet</p>
              </div>
            )}
          </div>

          <div className="mt-5 p-4 rounded-2xl flex items-center gap-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Vault Status</p>
              <p className="text-xs font-black" style={{ color: "var(--text-bright)" }}>Active & Protected</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WalletProtection;
