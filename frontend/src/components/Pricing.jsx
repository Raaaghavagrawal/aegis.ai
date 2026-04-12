import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Info, ShieldCheck, Zap, Users, ShieldAlert, BadgeCheck, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import FakeRazorpay from './payment/FakeRazorpay';

const Pricing = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: "Basic",
      price: "99",
      desc: "Essential atmospheric protection",
      features: ["Rainfall > 50mm", "15% Base Payout", "UPI Instant Settlement", "Basic Risk Alerts"],
      color: "#94a3b8"
    },
    {
      name: "Pro",
      price: "149",
      desc: "Full shield for professional earners",
      features: ["Weather + AQI Triggers", "30% Dynamic Payout", "Fraud Shield (AI)", "Priority Support", "Accident Micro-cover"],
      color: "#6366f1",
      popular: true
    },
    {
      name: "Elite",
      price: "199",
      desc: "Ultimate systemic security",
      features: ["All Trigger Types", "40% Max Payout", "Full Accident Cover", "Weekly Risk Intelligence", "Direct Bank X-fer"],
      color: "#06b6d4"
    }
  ];

  const handleSelectPlan = (plan) => {
    const token = localStorage.getItem("aegis_token");
    if (!token) {
      navigate('/auth');
      return;
    }
    setSelectedPlan(plan);
    setIsGatewayOpen(true);
  };

  const finalizePurchase = async () => {
    try {
      setLoading(true);
      await api.post('/api/policies/purchase', {
        planName: selectedPlan.name,
        price: selectedPlan.price
      });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error("Purchase failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-32">
      <FakeRazorpay 
        isOpen={isGatewayOpen} 
        onClose={() => setIsGatewayOpen(false)} 
        plan={selectedPlan}
        onPaymentSuccess={finalizePurchase}
      />

      {/* Hero Section */}
      <section id="pricing" style={{ padding: '40px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <ShieldCheck size={14} /> Intelligence-Driven Protection
          </motion.div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: 'white', letterSpacing: '-0.02em' }}>
            Flexible <span className="gradient-text">Weekly</span> Plans
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
            No KYC, no long-term contracts. Just raw machine learning protecting your daily earnings from environmental instability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -12, scale: 1.02 }}
              className="glass-card relative p-10 border border-white/5 bg-white/[0.02] rounded-[32px] overflow-hidden"
              style={{ 
                border: plan.popular ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', background: '#6366f1', color: 'white', padding: '6px 14px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em' }}>
                  RECOMENDED
                </div>
              )}
              
              <div className="mb-10">
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">{plan.name} Tier</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white">₹{plan.price}</span>
                  <span className="text-slate-500 font-bold">/weekly</span>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{plan.desc}</p>
              </div>
              
              <div className="space-y-4 mb-12">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <motion.button 
                onClick={() => handleSelectPlan(plan)}
                disabled={loading}
                whileHover={{ scale: 1.02, backgroundColor: plan.popular ? '#4f46e5' : 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all"
                style={{ 
                  background: plan.popular ? '#6366f1' : 'rgba(255,255,255,0.05)', 
                  color: 'white',
                  boxShadow: plan.popular ? '0 10px 30px -10px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                {loading ? "Initializing..." : `Activate ${plan.name} Shield`}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
          {[
            { icon: Users, label: "Active Drivers", value: "12,400+" },
            { icon: Zap, label: "Tigger Precision", value: "98.4%" },
            { icon: ShieldAlert, label: "Fraud Prevented", value: "₹4.2M" },
            { icon: BadgeCheck, label: "Average Rating", value: "4.9/5" },
          ].map((stat, i) => ( stat &&
            <div key={i} className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 border border-white/5">
                <stat.icon size={24} />
              </div>
              <p className="text-2xl font-black text-white tabular-nums">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-[800px] mx-auto px-6 pb-40">
        <div className="text-center mb-16">
          <h3 className="text-2xl font-black text-white mb-4 flex items-center justify-center gap-3">
            <HelpCircle className="text-indigo-400" /> Common Questions
          </h3>
          <p className="text-slate-500 text-sm">Everything you need to know about Aegis Protection.</p>
        </div>
        
        <div className="space-y-6">
          {[
            { q: "How are payouts triggered?", a: "Our AI monitor nodes in your city. If rainfall > 50mm or AQI > 250 are recorded by verified sensors, your payout is automatically pushed to your wallet." },
            { q: "Can I cancel mid-week?", a: "Yes. You can disable auto-renewal anytime. Coverage remains active until the end of your 7-day cycle." },
            { q: "Is this traditional insurance?", a: "No. This is decentralized parametric protection powered by ML triggers, designed specifically for the high-speed gig economy." },
            { q: "How fast is the settlement?", a: "Payouts are usually processed within 60 seconds of a trigger event being validated by the Aegis Neural Network." }
          ].map((faq, i) => (
            <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-white/10 transition-colors group">
              <h4 className="text-white font-bold mb-3 flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {faq.q}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed pl-5 font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Pricing;
