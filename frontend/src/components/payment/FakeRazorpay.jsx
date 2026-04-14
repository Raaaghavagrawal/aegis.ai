import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Smartphone, CreditCard, Landmark, X, Lock, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

const FakeRazorpay = ({ isOpen, onClose, plan, onPaymentSuccess }) => {
  const [step, setStep] = useState('method'); // 'method', 'details', 'processing', 'success'
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [inputDetails, setInputDetails] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedMethod(null);
      setInputDetails('');
    }
  }, [isOpen]);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setStep('details');
  };

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 2000);
    }, 2500);
  };

  if (!isOpen) return null;

  const methods = [
    { id: 'upi', name: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, BHIM', placeholder: 'akshay@okaxis' },
    { id: 'card', name: 'Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay', placeholder: 'xxxx xxxx xxxx xxxx' },
    { id: 'net', name: 'Netbanking', icon: Landmark, desc: 'All Indian Banks', placeholder: 'Select your bank' },
  ];

  const currentMethod = methods.find(m => m.id === selectedMethod);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Razorpay Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-[420px] bg-white rounded-xl shadow-2xl overflow-hidden font-poppins"
        style={{ color: '#1a1a1b' }}
      >
        {/* Header */}
        <div className="bg-[#1b223a] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/5">
              <Shield className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Aegis AI Protection</h3>
              <p className="text-[10px] text-blue-300 font-medium tracking-widest uppercase">Secured by Razorpay</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Amount bar */}
        <div className="bg-[#f2f4f7] px-6 py-4 border-b border-black/5">
          <div className="flex justify-between items-center mb-3">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Plan Summary</div>
              <div className="text-base font-black">₹{plan?.price}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan?.features.map((f, i) => (
              <span key={i} className="text-[9px] font-bold bg-white px-2 py-1 rounded-md border border-black/5 text-slate-600">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[360px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 'method' && (
              <motion.div 
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 flex-1"
              >
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Payment Methods</h4>
                <div className="space-y-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleMethodSelect(m.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 group`}
                    >
                      <div className={`p-2.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-colors`}>
                        <m.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{m.desc}</div>
                      </div>
                      <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 flex-1 flex flex-col"
              >
                <button 
                  onClick={() => setStep('method')}
                  className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 mb-6 hover:underline"
                >
                  <ChevronRight size={12} className="rotate-180" /> Change Method
                </button>
                
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Enter {currentMethod?.name} Details</h4>
                
                <div className="space-y-4 flex-1">
                  {selectedMethod === 'net' ? (
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold appearance-none outline-none focus:border-blue-500"
                      value={inputDetails}
                      onChange={(e) => setInputDetails(e.target.value)}
                    >
                      <option value="">Select your bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                    </select>
                  ) : (
                    <div className="relative">
                       <input 
                         type="text"
                         autoFocus
                         placeholder={currentMethod?.placeholder}
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 placeholder:text-slate-300 tabular-nums"
                         value={inputDetails}
                         onChange={(e) => setInputDetails(e.target.value)}
                       />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200">
                         {selectedMethod === 'card' ? <CreditCard size={18} /> : <Smartphone size={18} />}
                       </div>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                    {selectedMethod === 'card' ? 'Your card details are encrypted and never stored.' : 'Safe and secure payments via encrypted channels.'}
                  </p>
                </div>

                <div className="mt-8">
                  <button
                    disabled={!inputDetails}
                    onClick={handlePay}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:grayscale text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mb-2"
                  >
                    Pay ₹{plan?.price} <CheckCircle2 size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin mb-6" />
                <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
                <p className="text-sm text-slate-500">Contacting your bank... Please do not refresh.</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-xl font-bold text-emerald-700 mb-2">Payment Successful</h3>
                <p className="text-sm text-slate-500">Your {plan?.name} protection is now active.</p>
                <div className="mt-6 text-[11px] font-bold text-blue-500 uppercase tracking-widest">Aegis AI ID: TXN_AGS_{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-[#fcfdfe] p-4 flex items-center justify-center gap-4 border-t border-black/5">
          <div className="flex items-center gap-1.5 opacity-40">
            <Lock size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure 256-bit SSL</span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4 opacity-50 gray-scale" />
        </div>
      </motion.div>
    </div>
  );
};

export default FakeRazorpay;
