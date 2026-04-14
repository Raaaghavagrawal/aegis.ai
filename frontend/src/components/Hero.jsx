import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-6 sm:px-10">
      {/* Background Ambient Lighting */}
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-cyan-400/10 blur-[100px] rounded-full -z-10"></div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 text-blue-400 text-[11px] font-black uppercase tracking-widest shadow-xl">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
             Powered by Parametric Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-8 text-white">
            Protect Your <br className="hidden sm:block" />
            <span className="gradient-text">Income Core</span>
          </h1>
          
          <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg mb-12">
            Parametric insurance that pays out instantly when environmental triggers hit your city. No forms, no wait — just AI-synchronized protection.
          </p>
          
          <div className="flex flex-wrap items-center gap-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link 
                to="/auth" 
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-3"
              >
                Analyze My Risk <ArrowRight size={20} />
              </Link>
            </motion.div>
            
            <button className="px-8 py-4 bg-transparent border border-white/10 hover:border-white/25 text-white/80 hover:text-white rounded-2xl font-bold transition-all flex items-center gap-3">
              <Play size={18} fill="currentColor" /> Watch Keynote
            </button>
          </div>

          <div className="mt-16 flex gap-10 border-t border-white/5 pt-10">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">50M+</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gig Nodes Protected</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-blue-400">₹0</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Claims Friction</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.1 }}
          className="relative flex justify-center"
        >
          <div className="glass-card relative z-10 w-full max-w-md p-10 text-center overflow-hidden group">
             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="text-8xl mb-10 drop-shadow-[0_0_50px_rgba(99,102,241,0.3)] select-none"
             >
               🛡️
             </motion.div>
             <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">System Shield: Online</h3>
             <p className="text-sm text-slate-400 font-medium leading-relaxed">Monitoring atmospheric triggers across 500+ secure node districts in real-time.</p>
             
             <div className="mt-10 flex items-center justify-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Network Synchronized</span>
             </div>
          </div>
          
          {/* Orbital Decorations */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full animate-[spin_30s_linear_infinite] -z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-white/5 rounded-full animate-[spin_20s_linear_infinite_reverse] -z-10"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
