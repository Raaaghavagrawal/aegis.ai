import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, IndianRupee, MapPin, Clock, Zap, CheckCircle2 } from 'lucide-react';

const RiderShowcase = () => {
  const rider = {
    name: "Rahul Sharma",
    platform: "Zomato",
    rating: 4.8,
    deliveries: "12,400+",
    location: "Mumbai, MH",
    plan: "Elite Shield",
    totalPayouts: "₹8,500",
    joinDate: "Jan 2024",
    payoutSpeed: "45 Seconds"
  };

  const timeline = [
    { date: "July 14", event: "Heavy Rain (82mm)", payout: "₹1,500", status: "Instant" },
    { date: "Aug 02", event: "Severe AQI (380)", payout: "₹2,200", status: "Instant" },
    { date: "Aug 21", event: "Moderate Rain (55mm)", payout: "₹1,200", status: "Instant" },
  ];

  return (
    <section id="rider-showcase" style={{ padding: '100px 5%', background: 'rgba(99, 102, 241, 0.01)', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Rider <span className="gradient-text">Spotlight</span></h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Building trust through transparency: Real protection for real lives.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
          
          {/* Left: Profile & Core Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card"
              style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}
            >
               <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', padding: '8px 25px', borderRadius: '0 0 0 24px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.05em' }}>
                  ELITE PARTNER
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(45deg, #1e293b, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '3px solid rgba(99, 102, 241, 0.4)' }}>🧔</div>
                    <div style={{ position: 'absolute', bottom: 5, right: 5, background: '#10b981', border: '3px solid #0f172a', width: '24px', height: '24px', borderRadius: '50%' }}></div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{rider.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '1rem', fontWeight: 700 }}>
                       <Star size={18} fill="#f59e0b" /> {rider.rating} • {rider.platform}
                    </div>
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--bg-glass)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Lifetime Deliveries</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{rider.deliveries}</div>
                  </div>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Total Savings</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{rider.totalPayouts}</div>
                  </div>
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="glass-card" 
               style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={20} className="text-indigo-500" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Member Since</span>
               </div>
               <span style={{ fontWeight: 800 }}>{rider.joinDate}</span>
            </motion.div>
          </div>

          {/* Right: Protection Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card"
            style={{ padding: '40px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
               <ShieldCheck size={24} className="text-secondary" />
               <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Protection Timeline</h3>
            </div>

            <div style={{ position: 'relative', paddingLeft: '30px' }}>
               <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'linear-gradient(to bottom, #6366f1, #06b6d4, transparent)' }}></div>
               
               {timeline.map((t, i) => (
                 <motion.div 
                   key={i} 
                   initial={{ opacity: 0, x: 20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.2 }}
                   style={{ marginBottom: '2.5rem', position: 'relative' }}
                 >
                   <div style={{ position: 'absolute', left: '-30px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#020617', border: '3px solid #6366f1', zIndex: 1 }}></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dim)' }}>{t.date}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 900, color: '#10b981' }}>
                         <Zap size={10} /> {t.status}
                      </div>
                   </div>
                   <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{t.event}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                         Payout: <span style={{ fontWeight: 800, color: 'var(--text-bright)' }}>{t.payout}</span>
                      </div>
                   </div>
                 </motion.div>
               ))}
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
               <button style={{ background: 'transparent', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
                  Download Full Claims History
               </button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default RiderShowcase;
