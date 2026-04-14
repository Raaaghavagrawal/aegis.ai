import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Bell, Lock, MapPin, CreditCard, ChevronRight, Save, Loader2, AlertCircle, CheckCircle2, Key, Smartphone, Zap, Globe } from 'lucide-react';
import { api } from '../../utils/api';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    city: '',
    weekly_income: 0,
    platform: '',
    notify_risk: true,
    notify_payout: true,
    notify_audit: true,
    notify_weekly: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/user/profile/me');
      setProfile(res.data.user);
      setFormData({
        name: res.data.user.name || '',
        email: res.data.user.email || '',
        city: res.data.user.city || '',
        weekly_income: res.data.user.weekly_income || 0,
        platform: res.data.user.platform || 'General',
        notify_risk: !!res.data.user.notify_risk,
        notify_payout: !!res.data.user.notify_payout,
        notify_audit: !!res.data.user.notify_audit,
        notify_weekly: !!res.data.user.notify_weekly,
      });
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      setError("User profile synchronization failed. Check synchronization node status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weekly_income' ? Number(value) : value
    }));
  };

  const togglePreference = (key) => {
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      const res = await api.post('/api/user/profile/update-profile', formData);
      setProfile(res.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Update Error:", err);
      alert("Verification failed: Could not synchronize neural parameters.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-slate-500 font-poppins">
        <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
        <p className="text-[11px] font-bold uppercase tracking-widest">Decrypting user profile node...</p>
      </div>
    );
  }

  if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-32 text-center font-poppins">
         <AlertCircle size={48} className="text-rose-500 mb-6" />
         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error}</h3>
         <button onClick={fetchData} className="mt-8 px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg">Retry Decryption</button>
       </div>
     );
  }

  const sections = [
    { id: 'profile', icon: <User size={18} />, label: 'Neural Profile' },
    { id: 'security', icon: <Lock size={18} />, label: 'Encryption Keys' },
    { id: 'nodes', icon: <Shield size={18} />, label: 'Active Guard Nodes' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Alert Protocols' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-5xl mx-auto space-y-8 font-poppins pb-20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === section.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {section.icon}
              <span className="truncate">{section.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div 
                key="profile-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="border border-gray-200 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group shadow-sm transition-colors"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-8 tracking-tight uppercase">Profile Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Identity Vector</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Uplink Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Localized Node</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input 
                        type="text" 
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-4 pl-12 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Financial Variable</label>
                    <div className="relative">
                      <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                      <input 
                        type="number" 
                        name="weekly_income"
                        value={formData.weekly_income}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-4 pl-12 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                 <div className="mt-12 flex items-center justify-between border-t border-gray-200 dark:border-white/5 pt-8">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest max-w-[200px]">Node synchronization active. Read and Write access verified via JWT.</p>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition shadow-2xl active:scale-95 disabled:opacity-50 ${
                      success ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-500/20 hover:bg-indigo-500'
                    }`}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : (success ? <CheckCircle2 size={16} /> : <Save size={16} />)}
                    {saving ? 'Syncing...' : (success ? 'Vector Updated' : 'Update Node')}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                key="security-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="border border-gray-200 dark:border-white/5 rounded-3xl p-8 space-y-8 shadow-sm"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight uppercase">Encryption Keys</h3>
                   <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 uppercase tracking-widest">Active AES-256</span>
                </div>
                
                <div className="space-y-6">
                   <div className="p-6 bg-gray-50/50 dark:bg-slate-950/40 rounded-2xl border border-gray-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Key size={18}/></div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Aegis Public Key</span>
                         </div>
                         <button className="text-[10px] font-bold text-indigo-600 dark:text-blue-400 hover:text-indigo-700 dark:hover:text-white uppercase tracking-widest transition-colors" onClick={() => alert("Rotating encryption vectors...")}>Rotate Key</button>
                      </div>
                      <code className="text-[11px] text-slate-500 break-all font-mono block p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-white/5">
                        ae_live_8f23...k92z1_pub_node_{profile?.id || '001'}
                      </code>
                   </div>

                   <div className="p-6 bg-gray-50/50 dark:bg-slate-950/40 rounded-2xl border border-gray-200 dark:border-white/5 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Shield size={18}/></div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Neural Signature</span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-widest italic">Verified via Swiggy/Zomato</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium uppercase tracking-[0.1em]">Your identity is cryptographically bound to your gig platform account. Any attempt at record drift will trigger an automatic audit protocol.</p>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'nodes' && (
              <motion.div 
                key="nodes-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="border border-gray-200 dark:border-white/5 rounded-3xl p-8 space-y-8 shadow-sm"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight uppercase">Active Guard Nodes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { name: profile?.city || 'Delhi', status: 'Online', ip: '192.168.1.104', icon: <MapPin size={20} className="text-indigo-500"/> },
                     { name: 'Mobile Node (iPhone 14)', status: 'Online', ip: '10.0.0.42', icon: <Smartphone size={20} className="text-indigo-500"/> },
                     { name: 'Gateway Node', status: 'Standby', ip: 'Aegis Network', icon: <Globe size={20} className="text-emerald-500"/> },
                   ].map((node, i) => (
                     <div key={i} className="p-5 bg-gray-50 dark:bg-slate-950/40 rounded-2xl border border-gray-200 dark:border-white/5 flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-slate-900/40 transition-all shadow-inner">
                        <div className="flex items-center gap-4">
                           <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">{node.icon}</div>
                           <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider leading-none mb-1">{node.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-600 font-mono tracking-tight">{node.ip}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`}></div>
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{node.status}</span>
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center gap-4">
                   <Zap size={24} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                   <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium uppercase tracking-widest leading-relaxed">Network topology optimized for parametric insurance. Latency between your localized node and Aegis-HQ is currently 14ms.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                key="alert-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="border border-gray-200 dark:border-white/5 rounded-3xl p-8 space-y-8 shadow-sm"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight uppercase">Alert Protocols</h3>
                   <button 
                    onClick={handleSave}
                    className="text-[10px] font-bold text-indigo-600 dark:text-blue-400 hover:text-indigo-700 dark:hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
                   >
                     {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                     {saving ? 'Syncing...' : 'Save Protocols'}
                   </button>
                </div>
                <div className="space-y-4">
                   {[
                     { id: 'notify_risk', label: 'Risk Disruption Alerts', desc: 'Notify when atmospheric risk exceeds 50%' },
                     { id: 'notify_payout', label: 'Instant Payout Confirms', desc: 'Auto-broadcast when claims are disbursed' },
                     { id: 'notify_audit', label: 'Integrity Audits', desc: 'Critical alerts regarding record drift' },
                     { id: 'notify_weekly', label: 'Weekly Summary', desc: 'Digest of neural performance scores' },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-slate-950/20 rounded-2xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-slate-950/40 transition-all shadow-inner">
                        <div className="space-y-1">
                           <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{item.label}</h4>
                           <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">{item.desc}</p>
                        </div>
                        <div 
                          onClick={() => togglePreference(item.id)}
                          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData[item.id] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-800'}`}
                        >
                           <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData[item.id] ? 'ml-6 shadow-lg shadow-white/20' : 'ml-0'}`} />
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border border-gray-200 dark:border-white/5 rounded-3xl p-8 hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-all duration-300 group cursor-pointer shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
             <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-indigo-500/5 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors border border-indigo-500/10"><Shield size={20}/></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Aegis Guard Protocol</h4>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Enhanced biometric encryption status</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em]">Validated</span>
                   <ChevronRight size={18} className="text-slate-400 dark:text-slate-700 group-hover:translate-x-1 group-hover:text-gray-900 dark:group-hover:text-white transition-all" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
