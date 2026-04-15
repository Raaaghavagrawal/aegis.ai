import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Activity, Shield, Zap } from 'lucide-react';

const LiveUpdates = React.memo(({ systemData, city, signalLogsForCity, SignalLogHoverDetail, formatTime }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8 mt-6">
      <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden group hover:border-indigo-600/30 transition-all duration-500">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity size={120} className="text-indigo-400" />
        </div>
        
        <div className="flex items-center gap-6 mb-10 relative">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl group-hover:scale-105 transition-transform">
            <Shield size={28} />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-white tracking-tight uppercase">System Health</h4>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] italic">{systemData?.data_flow || 'CONNECTING'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">System Uptime</p>
            <p className="text-xl font-black text-white italic">{systemData?.uptime || '--'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Active Nodes</p>
            <p className="text-xl font-black text-white italic">{systemData?.active_nodes || '--'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Events (24h)</p>
            <p className="text-xl font-black text-white italic">{systemData?.events_today ?? '--'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">Disbursed (24h)</p>
            <p className="text-xl font-black text-white italic">{systemData?.payouts_today ?? '--'}</p>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800/80">
          <p className="text-xs text-gray-400 leading-relaxed font-bold italic">
            Cluster is monitoring <span className="text-indigo-400">{systemData?.active_cities?.join(", ") || 'primary zones'}</span>. Integrations for OpenWeather and AQICN are <span className="text-emerald-400 uppercase font-black text-[9px] px-2 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 ml-1">Live</span>.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h5 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 italic">
            <Newspaper size={14} className="text-indigo-400 uppercase" /> Activity Feed
          </h5>
          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">Live Polling • 5s</span>
        </div>
        
        <div className="space-y-3">
          {signalLogsForCity.length > 0 ? (
            signalLogsForCity.map((log) => (
              <div
                key={log.id}
                className="bg-[#111827] rounded-3xl p-5 border border-gray-800/60 hover:bg-gray-900/40 transition-colors group flex items-start gap-5"
              >
                <div
                  className={`mt-1 p-2 rounded-xl border ${
                    log.level === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : log.level === "warning"
                        ? "bg-amber-500/10 text-amber-500 border-amber-600/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                  }`}
                >
                  <Zap size={14} />
                </div>
                <SignalLogHoverDetail log={log} formatTimeFn={formatTime}>
                  <p className="text-xs text-gray-200 font-bold leading-relaxed line-clamp-3 group-hover:text-white transition-colors uppercase tracking-tight italic">
                    {log.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] italic">
                      {(log.event_type || "system").replace(/_/g, " ")}
                    </span>
                    <span className="text-[9px] font-black text-gray-700 uppercase italic">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                      NODE {city}
                    </span>
                  </div>
                </SignalLogHoverDetail>
              </div>
            ))
          ) : (
            <div className="py-24 border-2 border-dashed border-gray-800/50 rounded-[2rem] text-center px-4">
              <p className="text-xs text-gray-600 font-black uppercase tracking-[0.3em] italic">
                Awaiting Stream for {city}
              </p>
              <p className="text-[10px] text-gray-700 mt-2 font-bold uppercase italic">
                No telemetry matching target city vector found in current cache.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default LiveUpdates;
