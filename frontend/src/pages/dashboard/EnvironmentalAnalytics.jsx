import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, BarChart, AreaChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Wind, CloudRain, Thermometer, Gauge, Download, Calendar, Activity, Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { api } from '../../utils/api';

const EnvironmentalAnalytics = () => {
  const [envData, setEnvData] = useState([]);
  const [latestStats, setLatestStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");
  const city = user.city || "Kolkata";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/environment/${city}/history`);
      
      console.log("ENV API RESPONSE:", res);
      console.log("RESPONSE DATA:", res.data);

      if (res.data && res.data.current && Array.isArray(res.data.history)) {
        const mappedData = {
          aqi: res.data.current.air_quality,
          rainfall: res.data.current.rain_mm,
          temperature: res.data.current.temp_c,
          telemetry: res.data.history
        };
        
        console.log("MAPPED DATA:", mappedData);
        setEnvData([...mappedData.telemetry].reverse());
        // We can store latest stats separately or derive from history, 
        // but now we have direct 'current' object.
        setLatestStats(res.data.current);
      } else {
        console.warn("Unexpected API structure or empty data");
        setEnvData([]);
      }
    } catch (err) {
      console.error("Env History Fetch Error:", err);
      setError("Synchronized environmental mapping failed. Re-initiating uplink...");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = [
    { label: 'AQI Index', value: latestStats?.air_quality != null ? latestStats.air_quality : '--', sub: latestStats?.pollution || 'Atmospheric Health', icon: <Wind size={18} />, color: 'text-blue-400' },
    { label: 'Rainfall Node', value: latestStats?.rain_mm != null ? `${latestStats.rain_mm}mm` : '--', sub: 'Precipitation Load', icon: <CloudRain size={18} />, color: 'text-indigo-400' },
    { label: 'Temp Gradient', value: latestStats?.temp_c != null ? `${latestStats.temp_c}°C` : '--', sub: 'Thermal Drift', icon: <Thermometer size={18} />, color: 'text-amber-400' },
    { label: 'Network Integrity', value: loading ? "Syncing" : "Synced", sub: `${envData.length} Telemetry Nodes`, icon: <Activity size={18} />, color: 'text-emerald-400' },
  ];

  if (loading && envData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Polling localized telemetry nodes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
        <button onClick={fetchData} className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition active:scale-95">
          Retry Uplink
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 font-poppins"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-800/20 border border-white/5 p-6 rounded-2xl hover:border-blue-500/10 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-900 border border-white/5 rounded-lg text-slate-400 group-hover:text-blue-400 transition-colors">
                {stat.icon}
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className={`text-2xl font-semibold text-white`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300 h-[450px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Atmospheric Telemetry</h4>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Rolling AQI and Pollution indices</p>
            </div>
            <button onClick={fetchData} className="p-2 border border-white/5 rounded-lg text-slate-500 hover:text-white transition-all"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></button>
          </div>
          <div className="flex-1 w-full min-h-0">
            {envData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={envData}>
                  <defs>
                    <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '11px', color: '#64748b' }}
                  />
                  <Area type="monotone" dataKey="aqi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAqi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                <span className="mb-2">No environmental data available for this location</span>
                <span className="text-[8px] opacity-50">Atmospheric sensor array offline</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col hover:border-white/10 transition-all duration-300 h-[450px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Precipitation Nodes</h4>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Measured rainfall volume across segments</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest"><Calendar size={12}/> Window</button>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            {envData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={envData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                     itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                     labelStyle={{ fontSize: '11px', color: '#64748b' }}
                  />
                  <Bar dataKey="rainfall" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                <span className="mb-2">No precipitation data available for this location</span>
                <span className="text-[8px] opacity-50">Pluvial monitoring inactive</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-8 flex flex-col lg:col-span-2 hover:border-white/10 transition-all duration-300 h-[400px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Thermal Stability Index</h4>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Drift monitoring vs base environmental coordinates</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            {envData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={envData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                     itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                     labelStyle={{ fontSize: '11px', color: '#64748b' }}
                  />
                  <Line type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                  <span className="mb-2">No thermal metrics available for this location</span>
                  <span className="text-[8px] opacity-50">Wait for next telemetry sync...</span>
                </div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnvironmentalAnalytics;
