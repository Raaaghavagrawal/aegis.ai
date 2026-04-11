import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Zap, Activity, Search, RefreshCcw, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';

const FraudDetection = () => {
  const [logs, setLogs] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get('/api/fraud/fraud-overview');
      
      // Step 1: Log Full API Response
      console.log("FRAUD API RESPONSE:", res);
      
      const fraudData = res.data;
      setLogs(Array.isArray(fraudData.alerts) ? fraudData.alerts : (Array.isArray(fraudData) ? fraudData : []));
      setData(fraudData); 
    } catch (err) {
      console.error("Fraud Fetch Error:", err);
      // Step 7: Handle properly. If 404, specific message, else fallback.
      if (err.response?.status === 404) {
         setError("Fraud engine endpoint not found (404)");
      } else {
         setError("Fraud heuristic engine unstable. Neural link retry required.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogs = logs.filter(log => 
    log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Integrity Rating', value: `${(100 - (data?.riskScore || 0)).toFixed(1)}%`, icon: <ShieldCheck size={18} />, color: 'text-emerald-400' },
    { label: 'Heuristic Scans', value: logs.length, icon: <Activity size={18} />, color: 'text-blue-400' },
    { label: 'Active Anomalies', value: logs.filter(l => l.level === 'warning' || l.level === 'error').length, icon: <Zap size={18} />, color: 'text-rose-400' },
  ];

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Scanning network for identity anomalies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
        <AlertCircle size={48} className="text-amber-500 mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
        <button onClick={fetchData} className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition active:scale-95">
          Reset Heuristics
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 font-poppins"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl">
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 bg-slate-900 border border-white/5 rounded-lg ${stat.color}`}>{stat.icon}</div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
             </div>
             <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/20 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center bg-slate-900/40">
           <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identity Monitoring Log</h3>
           <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Query anomalies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <button onClick={fetchData} className="p-2 bg-slate-900 border border-white/10 rounded-xl text-slate-500 hover:text-white"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''}/></button>
           </div>
        </div>

        <div className="p-2 overflow-y-auto max-h-[500px]">
          {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] rounded-xl transition-colors border border-transparent hover:border-white/5 mb-1 group">
               <div className={`mt-0.5 p-2 rounded-lg bg-slate-900 border border-white/5 ${log.level === 'warning' || log.level === 'error' ? 'text-rose-400' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                  {log.level === 'warning' || log.level === 'error' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                     <p className="text-[11px] font-bold text-white uppercase tracking-tight truncate">{log.message}</p>
                     <span className="text-[9px] font-bold text-slate-600 bg-slate-950 px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                     <span className={log.level === 'warning' || log.level === 'error' ? 'text-rose-500/80' : 'text-indigo-400/80'}>
                        {(log.event_type || 'system').replace(/_/g, ' ')}
                     </span>
                     <span className="mx-2 opacity-30">•</span>
                     Node {log.city || 'Global-L1'}
                  </p>
               </div>
            </div>
          )) : (
            <div className="py-24 text-center">
              <ShieldCheck size={32} className="mx-auto text-slate-800 mb-4" />
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">No anomalies detected in current window</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FraudDetection;
