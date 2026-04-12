import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, CloudRain, Zap, Activity, Info, Loader2, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { api } from '../../utils/api';

const NotificationsCenter = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      console.log("[NOTIFICATIONS] Initiating neural link sync...");
      setLoading(true);
      setError(null);
      const res = await api.get('/api/notifications');
      console.log("[NOTIFICATIONS] Sync complete. Vector count:", res.data?.length);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("[NOTIFICATIONS] Sync failed:", err);
      // Only set error if it's a legitimate connection or server failure
      if (err.response?.status >= 400) {
        setError(`Uplink Error ${err.response.status}: Neural link interrupted.`);
      } else {
        setError("Network drift detected. Could not establish payload connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Awaiting system telemetry updates...</p>
      </div>
    );
  }

  if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
         <Info size={48} className="text-slate-700 mb-6" />
         <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
         <button onClick={fetchData} className="mt-8 px-10 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all">Retry Link</button>
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6 font-poppins"
    >
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-2xl font-bold text-white tracking-tight">System Notifications</h2>
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">{logs.length} Vectors Recorded</span>
            <button onClick={fetchData} className="p-2.5 bg-slate-800/50 border border-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''}/></button>
         </div>
      </div>

      <div className="space-y-4">
        {logs.length > 0 ? logs.map((log, i) => (
          <div key={i} className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all duration-300 group">
             <div className="flex items-start gap-5">
                <div className="mt-1 p-3 bg-slate-900 border border-white/5 rounded-xl group-hover:bg-slate-950 transition-colors">
                  {getIcon(log.event_type)}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{log.message}</p>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">Parametric event recorded on SecureNode-L1. Automated resolution active based on atmospheric telemetry.</p>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-blue-500/80 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 uppercase tracking-widest">{(log.type || 'system').replace(/_/g, ' ')}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Verified</span>
                   </div>
                </div>
             </div>
          </div>
        )) : (
          <div className="py-32 text-center bg-slate-800/10 border border-dashed border-white/5 rounded-3xl">
             <Bell size={40} className="mx-auto text-slate-800 mb-6" />
             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Zero system broadcasts detected</p>
             <p className="text-[10px] text-slate-600 mt-2 font-medium">Monitoring parametric triggers in real-time...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationsCenter;
