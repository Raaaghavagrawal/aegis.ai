import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  MapPin,
  RefreshCcw,
  Shield,
  TrendingUp,
  Wallet as WalletIcon,
  FileText,
  History,
  BarChart3,
  BrainCircuit,
  ShieldAlert,
  Bell,
  Settings as SettingsIcon,
  ChevronRight,
} from "lucide-react";

// Import Modular Components
import Overview from "./dashboard/Overview";
import PolicyCenter from "./dashboard/PolicyCenter";
import ClaimsHistory from "./dashboard/ClaimsHistory";
import EnvironmentalAnalytics from "./dashboard/EnvironmentalAnalytics";
import AIRiskPredictor from "./dashboard/AIRiskPredictor";
import FraudDetection from "./dashboard/FraudDetection";
import WalletProtection from "./dashboard/WalletProtection";
import NotificationsCenter from "./dashboard/NotificationsCenter";
import Settings from "./dashboard/Settings";

function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");
  const [activeTab, setActiveTab] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview", icon: <TrendingUp size={18} /> },
    { id: "policy", label: "Policy Center", icon: <FileText size={18} /> },
    { id: "analytics", label: "Env. Analytics", icon: <BarChart3 size={18} /> },
    { id: "predictor", label: "Risk Predictor", icon: <BrainCircuit size={18} /> },
    { id: "fraud", label: "Fraud Detection", icon: <ShieldAlert size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "claims", label: "Claims History", icon: <History size={18} /> },
    { id: "wallet", label: "Wallet & Earnings", icon: <WalletIcon size={18} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-100 selection:bg-blue-500/30 font-poppins">
      {/* Sidebar */}
      <aside className="w-72 fixed h-full bg-[#0B1120] border-r border-white/5 hidden lg:flex flex-col z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 transition-transform duration-300 hover:scale-[1.01] cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">Aegis.ai</h1>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mt-1">Parametric Net</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <div className="bg-slate-800/20 p-4 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                {user.name?.[0] || 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-white">{user.name || "Gig Worker"}</p>
                <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{user.platform || "Active Node"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 bg-slate-900/40 px-3 py-2 rounded-lg border border-white/5">
              <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-[9px]"><MapPin size={12} className="text-blue-500" /> {user.city || "Mumbai"}</span>
              <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight uppercase">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 ml-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Live Network</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button
              onClick={() => window.location.reload()}
              className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"
              title="Refresh Interface"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/40 border border-white/10 hover:border-blue-500/30 text-xs font-bold uppercase tracking-widest text-slate-300 rounded-xl transition-all group"
            >
              <LogOut size={16} className="text-slate-400 group-hover:text-blue-400" /> 
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 pb-12 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && <Overview />}
              {activeTab === "policy" && <PolicyCenter />}
              {activeTab === "claims" && <ClaimsHistory />}
              {activeTab === "analytics" && <EnvironmentalAnalytics />}
              {activeTab === "predictor" && <AIRiskPredictor />}
              {activeTab === "fraud" && <FraudDetection />}
              {activeTab === "wallet" && <WalletProtection />}
              {activeTab === "notifications" && <NotificationsCenter />}
              {activeTab === "settings" && <Settings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// Sidebar Component
function NavItem({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent font-medium"
      }`}
    >
      <div className={`transition-colors duration-200 shrink-0 ${active ? 'text-white' : 'group-hover:text-slate-300'}`}>
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default DashboardPage;
