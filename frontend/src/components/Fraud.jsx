import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint, Activity, Clock, Globe, Smartphone, ShieldAlert, Zap } from 'lucide-react';

const Fraud = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  // Simulate a continuous "live" scan
  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const securityMetrics = [
    { icon: <Globe size={18} className="text-blue-400" />, label: "Geolocation Match", status: "Verified", detail: "Mumbai, Zone 4" },
    { icon: <Smartphone size={18} className="text-purple-400" />, label: "Device Integrity", status: "Secure", detail: "Hardware Attested" },
    { icon: <Fingerprint size={18} className="text-cyan-400" />, label: "Biometric Liveness", status: "Passed", detail: "Pattern Matched" },
    { icon: <Activity size={18} className="text-emerald-400" />, label: "App Session", status: "Active", detail: "No Mock Location" },
  ];

  const analysisLog = [
    "Initializing neural behavioral analysis...",
    "Verifying platform API handshake...",
    "Analyzing accelerometer drift patterns...",
    "Cross-referencing hyper-local weather...",
    "Identity verified via platform fingerprint."
  ];

  return (
    <section id="fraud" style={{ overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>AI Fraud <span className="gradient-text">Defense</span></h2>
          <p style={{ color: 'var(--text-dim)' }}>Multi-layered behavioral forensic system for 100% trust.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Live Scanner Visual */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card" 
            style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <ShieldCheck className="text-indigo-500" />
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Live Security Scan</h3>
               </div>
               <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                  SYSTEMS NOMINAL
               </div>
            </div>

            {/* Scanning Laser Animation */}
            <div style={{ position: 'relative', background: 'var(--bg-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
              <motion.div 
                style={{ 
                  position: 'absolute', 
                  top: `${scanProgress}%`, 
                  left: 0, 
                  width: '100%', 
                  height: '2px', 
                  background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                  boxShadow: '0 0 15px #6366f1',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {securityMetrics.map((m, i) => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'var(--bg-glass)', padding: '8px', borderRadius: '8px' }}>{m.icon}</div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-bright)' }}>{m.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{m.detail}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>{m.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '24px', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-dim)', background: 'var(--bg-glass)', padding: '12px', borderRadius: '8px' }}>
               {analysisLog.map((log, i) => (
                 <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 }}>
                   {`> ${log}`}
                 </motion.div>
               ))}
            </div>
          </motion.div>

          {/* Reliability & Trust Info */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card" 
            style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <div style={{ display: 'inline-flex', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', width: 'fit-content', marginBottom: '1.5rem' }}>
               GUARANTEED RELIABILITY
            </div>
            
            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.2 }}>
              Built for <span className="text-indigo-400">Zero-Claim</span> <br/> Friction.
            </h3>
            
            <p style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Our AI doesn't just check location. It analyzes 50+ device signals—from app session integrity to platform activity handshakes—to ensure payout reliability. This prevents fraud while eliminating the need for photos or paperwork.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={18} className="text-indigo-500" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>99.9% Accuracy</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={18} className="text-secondary" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fraud Shield V2</span>
               </div>
            </div>

            <button style={{ marginTop: '2.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-bright)', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={(e) => e.target.style.background = 'var(--bg-glass)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
               View Reliability whitepaper
            </button>
          </motion.div>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default Fraud;
