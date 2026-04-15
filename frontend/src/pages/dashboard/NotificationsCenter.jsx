import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Shield, CloudRain, Zap, Activity, Info,
  Loader2, RefreshCcw, CheckCircle2, BellOff, Sparkles
} from 'lucide-react';
import { api } from '../../utils/api';

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const NotificationsCenter = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/api/notifications');
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.status >= 400
        ? `Server Error ${err.response.status}: Could not fetch notifications.`
        : "Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getConfig = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('risk'))   return { icon: <Activity  size={15} />, color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   badge: 'risk'    };
    if (t.includes('payout')) return { icon: <Zap        size={15} />, color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',badge: 'live'    };
    if (t.includes('fraud'))  return { icon: <Shield    size={15} />, color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  badge: 'warning' };
    if (t.includes('rain'))   return { icon: <CloudRain size={15} />, color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   badge: 'live'    };
    return { icon: <Bell size={15} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', badge: 'live' };
  };

  const filters = ['all', 'risk', 'payout', 'fraud'];
  const filtered = filter === 'all' ? logs : logs.filter(l => (l.event_type || l.type || '').toLowerCase().includes(filter));

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <div className="relative mb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Bell size={24} className="text-indigo-400" />
          </div>
          <Loader2 size={16} className="animate-spin absolute -bottom-1 -right-1 text-indigo-400" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.25em] animate-pulse" style={{ color: "var(--text-muted)" }}>
          Fetching live alerts...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
          <Info size={24} className="text-rose-400" />
        </div>
        <h3 className="text-base font-black mb-2" style={{ color: "var(--text-bright)" }}>Connection Lost</h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button onClick={fetchData} className="btn-primary"><RefreshCcw size={13} /> Retry</button>
      </div>
    );
  }

  const getIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('risk')) return <Activity size={16} className="text-rose-400" />;
    if (t.includes('payout')) return <Zap size={16} className="text-emerald-400" />;
    if (t.includes('environment')) return <CloudRain size={16} className="text-sky-400" />;
    return <Bell size={16} className="text-blue-400" />;
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-bright)" }}>
            Smart Alerts
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {logs.length} notifications · Real-time Aegis monitoring
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl transition-all"
          style={{ background: "var(--bg-glass)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={fadeUp} className="flex items-center gap-2 p-1 rounded-2xl" style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200"
            style={{
              background:  filter === f ? "var(--primary)" : "transparent",
              color:       filter === f ? "#fff"           : "var(--text-muted)",
              boxShadow:   filter === f ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
            }}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map((log, i) => {
          const cfg = getConfig(log.event_type || log.type);
          return (
            <motion.div
              key={i}
              variants={fadeUp}
              className="premium-card p-5 hover:border-opacity-70 cursor-default group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${cfg.bg}`} style={{ border: `1px solid ${cfg.border.replace('border-','')}` }}>
                  <span className={cfg.color}>{cfg.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-sm font-black leading-tight" style={{ color: "var(--text-bright)" }}>
                      {log.message}
                    </p>
                    <span className="text-[9px] font-bold whitespace-nowrap shrink-0" style={{ color: "var(--text-dim)" }}>
                      {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
                    Parametric event logged on SecureNode-L1. Automated resolution is active based on your coverage plan.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`badge-${cfg.badge} text-[9px]`}>
                      <div className={`pulse-dot ${cfg.badge === 'risk' ? 'pulse-dot-rose' : cfg.badge === 'warning' ? 'pulse-dot-amber' : 'pulse-dot-green'}`} />
                      {(log.event_type || log.type || 'system').replace(/_/g, ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <motion.div variants={fadeUp} className="premium-card py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mx-auto mb-5">
              <BellOff size={24} style={{ color: "var(--text-dim)" }} />
            </div>
            <p className="text-sm font-black uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
              All Clear
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
              No {filter === 'all' ? '' : filter} alerts at the moment
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationsCenter;
