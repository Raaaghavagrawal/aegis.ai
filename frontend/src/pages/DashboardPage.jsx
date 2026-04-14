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
  Package,
  Home,
} from "lucide-react";

import Overview from "./dashboard/Overview";
import PolicyCenter from "./dashboard/PolicyCenter";
import EnvironmentalAnalytics from "./dashboard/EnvironmentalAnalytics";
import AICoPilot from "./dashboard/AICoPilot";
import FraudDetection from "./dashboard/FraudDetection";
import WalletAndClaims from "./dashboard/WalletAndClaims";
import NotificationsCenter from "./dashboard/NotificationsCenter";
import Settings from "./dashboard/Settings";
import ProfilePage from "./ProfilePage";
import OrdersPage from "./OrdersPage";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import ThemeToggle from "../components/ThemeToggle";

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, filter: "blur(2px)", transition: { duration: 0.2 } },
};

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { id: "overview", label: "Overview", icon: <TrendingUp size={18} /> },
    { id: "policy", label: "Policy Center", icon: <FileText size={18} /> },
    { id: "analytics", label: "Env. Analytics", icon: <BarChart3 size={18} /> },
    { id: "predictor", label: "Risk Predictor", icon: <BrainCircuit size={18} /> },
    { id: "fraud", label: "Fraud Detection", icon: <ShieldAlert size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "wallet", label: "Wallet & History", icon: <WalletIcon size={18} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
  ];

  // flat list for finding current label
  const allNavItems = navGroups.flatMap(g => g.items);

  const handleLogout = () => {
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-100 selection:bg-blue-500/30 font-poppins">
      {/* Sidebar */}
      <aside className="w-72 fixed h-full bg-[#020617]/40 backdrop-blur-2xl border-r border-white/5 hidden lg:flex flex-col z-50">
        <div className="p-8 flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div 
            className="flex items-center gap-3 mb-10 transition-transform duration-300 hover:scale-[1.01] cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">Aegis.ai</h1>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mt-1">Parametric Net</p>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[--bg-surface] animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight" style={{ color: "var(--text-bright)" }}>
              GigShield
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
              Aegis Network ✦
            </p>
          </div>

          {/* Scrollable Nav Area */}
          <nav className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
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
      </div>

        {/* Fixed Bottom Profile Section */}
        <div className="p-6 border-t border-white/5 bg-[#0B1120]">
          <div 
            onClick={() => setActiveTab("profile")}
            className="bg-slate-800/20 p-4 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                {user.name?.[0] || 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-white">{user.name || "Gig Worker"}</p>
                <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{user.platform || "Active Node"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
              <MapPin size={9} />
              {user.city?.split(" ")[0] || "City"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] px-3 mb-2" style={{ color: "var(--text-dim)" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-[#020617]/40 backdrop-blur-2xl sticky top-0 z-40 px-8 flex items-center justify-between">
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
              onClick={() => navigate("/")}
              className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"
              title="Back to Home"
            >
              <Home size={18} />
            </button>
             <button
              onClick={() => window.location.reload()}
              className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"
              title="Refresh Interface"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30 text-[10px] font-black uppercase tracking-widest text-rose-400 rounded-xl transition-all group active:scale-95"
            >
              <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" /> 
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeTab === "overview" && <Overview />}
              {activeTab === "policy" && <PolicyCenter />}
              {activeTab === "analytics" && <EnvironmentalAnalytics />}
              {activeTab === "predictor" && <AIRiskPredictor />}
              {activeTab === "fraud" && <FraudDetection />}
              {activeTab === "wallet" && <WalletAndClaims />}
              {activeTab === "notifications" && <NotificationsCenter />}
              { activeTab === "profile" && <ProfilePage isDashboard={true} /> }
              { activeTab === "settings" && <Settings /> }
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative group/nav ${
        active
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]"
          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent"
      }`}
    >
      {active && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/5 rounded-xl -z-10" />}
      <div className={`transition-colors duration-200 shrink-0 ${active ? 'text-white' : 'group-hover/nav:text-blue-400'}`}>
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default DashboardPage;
