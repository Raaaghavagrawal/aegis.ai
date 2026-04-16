import { useState, useEffect, useCallback } from 'react';
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
    { label: 'Peer Status', value: data?.peerComparison?.status || 'OPTIMAL', icon: <Activity size={18} />, color: data?.peerComparison?.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Active Anomalies', value: logs.filter(l => l.severity === 'high' || l.severity === 'medium').length, icon: <Zap size={18} />, color: 'text-rose-400' },
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
         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error}</h3>
         <button onClick={fetchData} className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition active:scale-95 shadow-lg shadow-indigo-500/20">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-white/5 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gray-100 dark:bg-slate-900 ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-black text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Behavioral Peer Analysis Section */}
      <div className="bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-400" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">Behavioral Peer Analysis</h3>
          </div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">Zone: {data?.peerComparison?.zone_id || 'Global'}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Claim Frequency vs Zone Average</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">x{data?.peerComparison?.anomaly_score?.toFixed(2) || '1.00'}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden border border-gray-200 dark:border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (data?.peerComparison?.anomaly_score || 1) * 33)}%` }}
                className="h-full rounded-full"
                style={{ background: (data?.peerComparison?.anomaly_score || 0) > 1.2 ? '#f43f5e' : (data?.peerComparison?.anomaly_score || 0) > 0.8 ? '#f59e0b' : '#10b981' }}
              />
            </div>
            <p className="text-[10px] mt-2 text-slate-500">Your behavior is <span className="font-bold">{data?.peerComparison?.status === 'OPTIMAL' ? 'in sync with' : 'divergent from'}</span> peer activity in this region.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-white/5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Zone Ratio</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">{(data?.peerComparison?.zone_claim_ratio * 100 || 0).toFixed(1)}%</p>
             </div>
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-white/5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Peer Consistency</p>
                <p className="text-lg font-black text-emerald-400">{data?.peerComparison?.status === 'OPTIMAL' ? 'High' : 'Moderate'}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-slate-900/40 transition-colors">
           <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Identity Monitoring Log</h3>
           <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Query anomalies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <button onClick={fetchData} className="p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 rounded-xl text-slate-500 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''}/></button>
           </div>
        </div>

        <div className="p-2 overflow-y-auto max-h-[500px]">
          {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/5 mb-1 group">
               <div className={`mt-0.5 p-2 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-white/5 ${log.severity === 'high' || log.severity === 'medium' ? 'text-rose-500' : 'text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'} transition-colors`}>
                  {log.severity === 'high' || log.severity === 'medium' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
               </div>
               <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-bold text-gray-800 dark:text-white uppercase tracking-tight truncate">{log.message || (log.type || 'System').replace(/_/g, ' ')}</p>
                      <span className="text-[9px] font-bold text-gray-600 dark:text-slate-600 bg-gray-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-gray-300 dark:border-white/5 uppercase tracking-widest transition-colors">{new Date(log.timestamp || log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                  <p className="text-[10px] text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wider">
                     <span className={log.severity === 'high' || log.severity === 'medium' ? 'text-rose-500/80' : 'text-indigo-600 dark:text-indigo-400/80'}>
                        {(log.type || 'system').replace(/_/g, ' ')}
                      </span>
                     <span className="mx-2 opacity-30">•</span>
                     Node {log.city || 'Global-L1'}
                  </p>
               </div>
            </div>
          )) : (
            <div className="py-32 text-center flex flex-col items-center">
              <div className="relative mb-6">
                <ShieldCheck size={48} className="text-emerald-500/40" />
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: [0.1, 0.3, 0.1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"
                />
              </div>
              <p className="text-[12px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-2">Neural Link: SECURE</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                Aggressive behavioral scanning active. No anomalous patterns detected in your peer group segment.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FraudDetection;
