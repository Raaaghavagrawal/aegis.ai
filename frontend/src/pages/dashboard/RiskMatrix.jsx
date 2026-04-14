import React from 'react';
import { motion } from 'framer-motion';
import { Gauge, Wind, CloudRain, Activity, IndianRupee, LineChart as LineIcon, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';

const RiskMatrix = ({ 
  city, 
  setCity, 
  income, 
  setIncome, 
  handleAnalyze, 
  loading, 
  error, 
  analysis, 
  envSnapshot, 
  envLoadMeters, 
  getAqiLabel, 
  formatTenMinAxis, 
  chartData, 
  MetricMini, 
  SignalRow, 
  explainableInsights, 
  riskWindowTrend, 
  extendedPolicyText 
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch font-poppins">
      <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
        <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition shrink-0" style={{ backgroundColor: 'var(--bg-card)' }}>
          <h4 className="text-sm font-semibold mb-6 uppercase tracking-widest text-slate-500">Execution Config</h4>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] italic">Deployment City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0B0F19] border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-indigo-600 focus:bg-indigo-950/10 transition-all font-medium text-gray-900 dark:text-white italic"
                placeholder="e.g. Mumbai"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] italic">Target Income (₹/wk)</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0B0F19] border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-indigo-600 focus:bg-indigo-950/10 transition-all font-medium text-gray-900 dark:text-white italic"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-100 shadow-xl shadow-indigo-600/20 disabled:opacity-50 uppercase tracking-[0.2em] mt-2 group"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? "Crunching Env Logic..." : "Compute Risk Vectors"}
                {!loading && <Activity size={14} className="group-hover:rotate-12 transition-transform" />}
              </div>
            </button>
            {error && <p className="text-[11px] text-red-600 dark:text-red-500 bg-red-500/5 p-3 rounded-lg border border-red-500/10 font-bold italic">{error}</p>}
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm shrink-0" style={{ backgroundColor: 'var(--bg-card)' }}>
          <h4 className="text-sm font-semibold mb-6 uppercase tracking-widest text-slate-500">Real-Time Core (AI Mode)</h4>
          <div className="space-y-3">
            <SignalRow label="Model Status" value="ACTIVE (ML)" color="emerald" />
            <SignalRow label="Disruption Prob." value={`${Math.round((analysis?.disruption_probability || 0) * 100)}%`} />
            <SignalRow label="Risk Threshold" value={analysis?.risk?.risk_level || "—"} />
            <SignalRow label="Expected Loss" value={`${analysis?.expected_loss_pct || 0}%`} />
            <SignalRow label="Value at Risk" value={`₹${Math.round(analysis?.estimated_loss_val || 0)}`} />
          </div>
        </div>

        <div className="flex-1 min-h-[280px] flex flex-col rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-semibold tracking-wide flex items-center gap-2 uppercase text-[10px] text-slate-500">
                <Gauge size={14} className="text-cyan-600 dark:text-cyan-400" /> Environmental load
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider italic">
                Same 20‑min buckets
              </p>
            </div>
            {envLoadMeters.cityLabel && (
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300/90 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 px-2 py-1 rounded-lg uppercase tracking-wide shrink-0">
                {envLoadMeters.cityLabel}
              </span>
            )}
          </div>

          <div className="space-y-4 flex-1 flex flex-col min-h-0 mt-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Wind size={11} className="text-indigo-500" /> AQI vs 300 cap
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {envLoadMeters.aq}{" "}
                  <span className="text-slate-500">({getAqiLabel(envLoadMeters.aq)})</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${envLoadMeters.nearAqiTrigger ? "bg-amber-500" : "bg-indigo-500"}`}
                  style={{ width: `${envLoadMeters.aqiPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CloudRain size={11} className="text-indigo-500" /> Rain vs 50mm trigger
                </span>
                <span className="text-gray-600 dark:text-gray-400">{envLoadMeters.rf} mm</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${envLoadMeters.nearRainTrigger ? "bg-sky-500" : "bg-cyan-600"}`}
                  style={{ width: `${envLoadMeters.rainPct}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              Sky state: <span className="text-gray-900 dark:text-gray-300 font-bold">{envLoadMeters.cond}</span>.
            </p>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800/80 flex-1 flex flex-col min-h-[140px]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <LineIcon size={12} className="text-emerald-600 dark:text-emerald-400/90" />
                Risk pulse (this window)
              </p>
                <div className="flex-1 w-full h-full min-h-[120px]">
                  {(!chartData || chartData.length === 0) ? null : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskPulseFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis hide dataKey="bucketKey" />
                      <Tooltip 
                        labelFormatter={(label) => formatTenMinAxis(label)}
                        contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: "10px", fontSize: "11px", color: 'var(--text-main)' }}
                      />
                      <Area type="monotone" dataKey="risk" name="Risk" stroke="#10b981" strokeWidth={2} fill="url(#riskPulseFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition" style={{ backgroundColor: 'var(--bg-card)' }}>
           <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-sm font-semibold tracking-wide flex items-center gap-2 uppercase text-[10px] text-slate-500">
                <Activity size={14} className="text-indigo-500" /> AI Risk Mapping
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider italic">Bayesian Logic Applied</p>
            </div>
            {analysis && (
               <div className="px-3 py-1 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-600/20 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/5">
                {analysis.risk.risk_level} VECTOR (ML)
              </div>
            )}
          </div>
          <div className="w-full h-[300px] min-h-[300px]">
            {(!chartData || chartData.length === 0) ? null : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="riskCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="bucketKey" tickFormatter={formatTenMinAxis} stroke="var(--chart-axis)" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--chart-axis)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={(label) => formatTenMinAxis(label)} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)' }} />
                  <Area type="monotone" dataKey="risk" name="Risk score" stroke="#10b981" strokeWidth={3} fill="url(#riskCyan)" />
                  <Line type="monotone" dataKey="predicted_loss" name="Predicted Loss" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200 dark:border-gray-800/80">
            <MetricMini label="Rainfall" value={`${analysis?.weather?.rainfall ?? 0}mm`} sub={analysis?.weather?.condition || "—"} icon={<CloudRain size={12} className="text-indigo-500" />} />
            <MetricMini label="AQI INDEX" value={analysis?.weather?.aqi ?? 0} sub={getAqiLabel(analysis?.weather?.aqi)} icon={<Wind size={12} className="text-indigo-500" />} />
            <MetricMini label="Threat" value={analysis?.risk?.risk_level || "Low"} sub={`SCORE ${analysis?.risk?.risk_score ?? 0}`} icon={<Activity size={12} className="text-indigo-500" />} />
            <MetricMini label="Net Credit" value={`₹${Math.round(analysis?.risk?.suggested_payout ?? 0)}`} sub="Calc Result" icon={<IndianRupee size={12} className="text-indigo-500" />} />
          </div>
        </div>

        <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Activity size={16}/></div>
             <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest italic">Intelligence Insights</h4>
          </div>
          <div className="space-y-4">
            {analysis?.ai_insight ? (
              <>
                <div className="flex gap-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 shadow-inner group">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <div className="space-y-2 min-w-0 flex-1">
                    <p className="text-[12px] font-bold leading-relaxed text-emerald-900 dark:text-emerald-100/95 italic">
                      {analysis.ai_insight}
                    </p>
                    {riskWindowTrend && (
                      <p className="text-[11px] leading-relaxed text-emerald-800/70 dark:text-emerald-200/65 border-t border-emerald-500/10 pt-2 font-medium">
                        {riskWindowTrend}
                      </p>
                    )}
                  </div>
                </div>

                {explainableInsights.length > 0 && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#0B0F19]/40 p-5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Hedge Calculation Log</p>
                    <ul className="space-y-2.5 text-[11px] leading-relaxed text-slate-600 dark:text-gray-400 list-disc pl-4 marker:text-indigo-500/80 italic font-medium">
                      {explainableInsights.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 group">
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 italic">Aegis Core recommendation</p>
                  <p className="text-[11px] text-slate-600 dark:text-gray-400 font-bold italic leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    {extendedPolicyText || "Operational parameters within safety bounds."}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex gap-4 p-4 bg-gray-100 dark:bg-gray-950/40 rounded-xl border border-gray-200 dark:border-gray-800/40 text-[11px] leading-relaxed text-slate-500 italic">
                <span>Run <strong className="text-gray-900 dark:text-white">Compute Risk Vectors</strong> to trigger neural logic.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RiskMatrix;
