import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Shield, MapPin, Globe, CreditCard } from 'lucide-react';

const Analytics = React.memo(() => {
  const metrics = [
    { label: "Gig Workers Protected", value: "85,420+", icon: <Users size={20} className="text-indigo-500" /> },
    { label: "Active Deployments", value: "12 Nodes", icon: <MapPin size={20} className="text-rose-500" /> },
    { label: "Claims Settled (2025)", value: "₹1.28 Cr", icon: <TrendingUp size={20} className="text-emerald-500" /> },
    { label: "Volume Paid", value: "₹4.5B", icon: <CreditCard size={20} className="text-blue-500" /> },
    { label: "Lightning Network", value: "Sub 2s", icon: <Zap size={20} className="text-amber-500" /> },
    { label: "Community Impact", value: "9.8/10", icon: <Globe size={20} className="text-cyan-500" /> }
  ];

  const barData = [
    { month: 'Jun', value: 40, color: '#6366f1' },
    { month: 'Jul', value: 92, color: '#818cf8', high: true },
    { month: 'Aug', value: 75, color: '#6366f1' },
    { month: 'Sep', value: 45, color: '#6366f1' },
    { month: 'Oct', value: 60, color: '#6366f1' }
  ];

  return (
    <section id="analytics" className="bg-transparent" style={{ padding: '100px 5%' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 className="text-[var(--text-bright)]" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Live <span className="gradient-text">Ecosystem</span> Data</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Real-time telemetry and risk distribution across the network.</p>
        </div>

        {/* Top Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ width: '48px', height: '48px', background: 'var(--bg-glass)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                <div className="text-[var(--text-bright)]" style={{ fontSize: '2.5rem', fontWeight: 900 }}>{m.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Bar Chart: Seasonal Volume */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card"
            style={{ padding: '40px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h3 className="text-[var(--text-bright)]" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Seasonal Volatility</h3>
              <div style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: '100px', fontWeight: 800 }}>Risk Detected</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', gap: '16px', paddingBottom: '30px' }}>
              {barData.map((d) => (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${d.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      style={{ 
                        width: '100%', 
                        background: d.high ? 'linear-gradient(to top, #6366f1, #06b6d4)' : 'rgba(99, 102, 241, 0.15)', 
                        borderRadius: '8px 8px 0 0',
                        position: 'relative',
                        boxShadow: d.high ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
                      }}
                    >
                      {d.high && (
                        <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem', fontWeight: 900, color: '#06b6d4' }}>₹Max</div>
                      )}
                    </motion.div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '16px', fontWeight: 700 }}>{d.month}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* New Radar/Breakdown Chart (SVG-based) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card"
            style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ marginBottom: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Shield size={20} className="text-secondary" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Risk Analysis Breakdown</h3>
               </div>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Weighted factors used in payout triggering.</p>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <svg width="240" height="240" viewBox="0 0 200 200">
                  {/* Radar Polygons (Synthetic Grid) */}
                  <circle cx="100" cy="100" r="80" stroke="var(--border)" fill="none" />
                  <circle cx="100" cy="100" r="50" stroke="var(--border)" fill="none" />
                  <circle cx="100" cy="100" r="20" stroke="var(--border)" fill="none" />
                  
                  {/* Animated Radar Path */}
                  <motion.polygon
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, type: 'spring' }}
                    points="100,20 180,100 130,170 80,160 20,80"
                    fill="rgba(99, 102, 241, 0.2)"
                    stroke="#6366f1"
                    strokeWidth="3"
                  />
                  
                  {/* Dots at vertices */}
                  {[ [100,20], [180,100], [130,170], [80,160], [20,80] ].map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="4" fill="#06b6d4" />
                  ))}
               </svg>
               
               {/* Label Placeholders */}
               <div className="text-[var(--text-bright)]" style={{ position: 'absolute', top: '0', fontSize: '0.7rem', fontWeight: 800 }}>RAINFALL</div>
               <div className="text-[var(--text-bright)]" style={{ position: 'absolute', right: '0', fontSize: '0.7rem', fontWeight: 800 }}>AQI</div>
               <div className="text-[var(--text-bright)]" style={{ position: 'absolute', bottom: '0', left: '20%', fontSize: '0.7rem', fontWeight: 800 }}>TRAFFIC</div>
               <div className="text-[var(--text-bright)]" style={{ position: 'absolute', left: '-5px', fontSize: '0.7rem', fontWeight: 800 }}>USER_ACTIVITY</div>
            </div>

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6366f1' }}></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Primary Risks</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#06b6d4' }}></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Secondary Factors</span>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
});

export default Analytics;
