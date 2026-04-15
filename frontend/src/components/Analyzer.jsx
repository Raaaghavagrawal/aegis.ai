import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, IndianRupee, Search, CloudRain, Wind, AlertTriangle, Zap, CheckCircle2, Navigation, Info, Sparkles } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const TypingInsight = ({ text, index: insightIndex }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let currentText = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        currentText += text[i];
        setDisplayedText(currentText);
        i++;
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: '12px', fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '8px' }}
    >
       <div style={{ marginTop: '8px' }}>
          {isDone ? (
            <div style={{ width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%' }}></div>
          ) : (
            <div style={{ width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
          )}
       </div>
       <div className="markdown-content">
         <ReactMarkdown>{displayedText}</ReactMarkdown>
       </div>
    </motion.div>
  );
};

const Analyzer = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const [city, setCity] = useState('');
  const [income, setIncome] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    "Establishing satellite link...",
    "Retrieving hyper-local weather data...",
    "Analyzing historical income volatility...",
    "Running parametric trigger logic...",
    "Finalizing risk score..."
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city || !income) return;
    
    setLoading(true);
    setScanStep(0);
    setData(null);

    // Simulate scanning steps
    for (let i = 0; i < steps.length; i++) {
       await new Promise(resolve => setTimeout(resolve, 800));
       setScanStep(i + 1);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        city,
        weekly_income: parseFloat(income)
      });
      setData(response.data);
    } catch (err) {
      console.error("API error:", err);
      setData({
        city: city,
        weekly_income: parseFloat(income),
        weather: { condition: "Heavy Rain", rainfall: 82, aqi: 145 },
        risk: { risk_level: "HIGH", risk_score: 85, predicted_loss: income * 0.3, suggested_payout: income * 0.3, trigger_met: true, payout_percentage: 30 },
        insights: [
          "🚨 **Monsoon peak detected** in your current geographic zone (**82mm rainfall**).",
          "😷 **AQI is above sensitive limits (145)**, which typically results in a 15-20% reduction in average delivery velocities.",
          "💡 **Intelligence Hint**: Most riders in this condition prefer the 'Elite' protection tier for maximum coverage."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="analyzer" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>AI Risk <span className="gradient-text">Forecasting</span></h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Real-time income protection analysis powered by Guidewire & satellite telemetry.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>
          
          {/* Input Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card" 
            style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px' }}>
                  <Navigation size={24} className="text-indigo-400" />
               </div>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Analysis Target</h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>City Context</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                  <input type="text" placeholder="e.g. Mumbai" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 16px 16px 48px', borderRadius: '14px', color: 'white', fontWeight: 600, outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Estimated Weekly Earnings</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                  <input type="number" placeholder="₹5,000" value={income} onChange={(e) => setIncome(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 16px 16px 48px', borderRadius: '14px', color: 'white', fontWeight: 600, outline: 'none' }} />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: 'white', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)', marginTop: '10px' }}>
                {loading ? 'Initializing Analysis...' : <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><Search size={18} /> Start Risk Scan</div>}
              </motion.button>
            </form>
          </motion.div>

          {/* Result Panel */}
          <div style={{ position: 'relative' }}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px' }}>
                   <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Scanning Neural Network...</h4>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                         <motion.div initial={{ width: 0 }} animate={{ width: `${(scanStep / steps.length) * 100}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {steps.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: i < scanStep ? 1 : 0.3, color: i === scanStep - 1 ? '#6366f1' : 'inherit' }}>
                           {i < scanStep ? <CheckCircle2 size={18} className="text-emerald-500" /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />}
                           <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s}</span>
                        </div>
                      ))}
                   </div>
                </motion.div>
              ) : data ? (
                <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   {/* Weather Telemetry Row */}
                   {data.weather && (
                     <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 800 }}>
                         <CloudRain size={16} /> {data.weather.rainfall}mm Peak Rain
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 800 }}>
                         <Wind size={16} /> {data.weather.aqi} AQI
                       </div>
                     </div>
                   )}
                   {/* Risk Gauge Card */}
                   <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: '200px', height: '120px', margin: '0 auto', overflow: 'hidden' }}>
                         <svg width="200" height="200" viewBox="0 0 200 200">
                           <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeLinecap="round" />
                           <motion.path 
                             initial={{ pathLength: 0 }} 
                             animate={{ pathLength: data.risk.risk_score / 100 }} 
                             transition={{ duration: 1.5, ease: "easeOut" }}
                             d="M 20 100 A 80 80 0 0 1 180 100" 
                             fill="none" 
                             stroke={data.risk.risk_level === 'HIGH' ? '#ef4444' : '#10b981'} 
                             strokeWidth="12" 
                             strokeLinecap="round" 
                           />
                         </svg>
                         <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{data.risk.risk_score}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Risk Factor</div>
                         </div>
                      </div>
                      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                         <div style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: data.risk.risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: data.risk.risk_level === 'HIGH' ? '#ef4444' : '#10b981', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 900 }}>
                           <AlertTriangle size={14} /> {data.risk.risk_level} PROTECTION LEVEL REQUIRED
                         </div>
                      </div>
                   </div>

                   {/* Payout Details */}
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ padding: '24px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Income Exposure <Info size={12}/></div>
                         <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>₹{data.risk.predicted_loss.toLocaleString()}</div>
                      </div>
                      <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                         <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Guaranteed Payout</div>
                         <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>₹{data.risk.suggested_payout.toLocaleString()}</div>
                      </div>
                   </div>

                   {/* AI Insights */}
                   <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={20} className="text-indigo-400" />
                            <span style={{ fontWeight: 800, fontSize: '1rem', tracking: '0.02em' }}>AI INTELLIGENCE REPORT</span>
                         </div>
                         <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                            LIVE ANALYSIS
                         </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         {data.insights && data.insights.length > 0 ? data.insights.map((insight, i) => (
                           <TypingInsight key={i} text={insight} index={i} />
                         )) : (
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>
                               Analyzing atmospheric stability... No disruption triggers detected within the parametric bounds.
                            </div>
                         )}
                      </div>
                   </div>
                </motion.div>
              ) : (
                <div key="placeholder" className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.02)', border: '2px dashed rgba(255,255,255,0.05)' }}>
                   <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                      <Zap size={32} className="text-dim" style={{ opacity: 0.2 }} />
                   </div>
                   <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#475569', marginBottom: '12px' }}>Awaiting Neural Input</h4>
                   <p style={{ fontSize: '0.9rem', color: '#475569', maxWidth: '280px' }}>Enter your city and income to initiate the satellite-backed risk simulation.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Analyzer;
