import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LiveBackground from "../components/LiveBackground";
import {
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Shield,
  User,
} from "lucide-react";
import { api } from "../utils/api";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => localStorage.getItem("aegis_token") ? "session" : "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const user = JSON.parse(localStorage.getItem("aegis_user") || "{}");

  const handleLogout = () => {
    localStorage.setItem("aegis_token", "");
    localStorage.setItem("aegis_user", "");
    setMode("login");
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    platform: "Swiggy",
    avg_daily_deliveries: "20",
    earnings_per_delivery: "40",
  });

  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [fetchingCity, setFetchingCity] = useState(false);

  // Debounced City Fetching
  React.useEffect(() => {
    if (!form.city || form.city.length < 3) {
      setApiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setFetchingCity(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.city)}&addressdetails=1&limit=5&featuretype=city`);
        const data = await res.json();
        const cities = data.map(item => ({
          display_name: item.display_name,
          city: item.address.city || item.address.town || item.address.village || item.address.state || item.name
        })).filter(c => c.city);
        
        // Remove duplicates and keep unique city names
        const unique = Array.from(new Map(cities.map(c => [c.city.toLowerCase(), c])).values());
        setApiSuggestions(unique);
      } catch (e) {
        console.error("City Fetch Error:", e);
      } finally {
        setFetchingCity(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.city]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "city") {
      setShowCitySuggestions(value.length >= 3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const signupRes = await api.post("/api/auth/signup", {
          ...form,
          avg_daily_deliveries: Number(form.avg_daily_deliveries),
          earnings_per_delivery: Number(form.earnings_per_delivery),
          weekly_income: Number(form.avg_daily_deliveries) * Number(form.earnings_per_delivery) * 7,
        });
        localStorage.setItem("aegis_token", signupRes.data.token);
        localStorage.setItem("aegis_user", JSON.stringify(signupRes.data.user));
      } else {
        const loginRes = await api.post("/api/auth/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("aegis_token", loginRes.data.token);
        localStorage.setItem("aegis_user", JSON.stringify(loginRes.data.user));
      }

      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Authentication failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#020617] text-slate-50 relative">
      <LiveBackground />
      
      {/* LEFT SECTION */}
      <aside className="hidden lg:flex flex-1 flex-col relative z-10 p-6 bg-slate-900/40 backdrop-blur-md border-r border-white/10">
        <div className="flex-none">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <Shield size={16} />
            </span>
            <span className="font-black tracking-tight text-lg">Aegis AI</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
          <div className="text-lg font-black tracking-[0.2em] text-indigo-400/80 uppercase mb-0">WELCOME</div>
          <h1 className="text-7xl font-black text-white leading-[0.8] mb-5 uppercase tracking-tighter">back</h1>
          <p className="text-sm text-slate-300 mb-8 font-medium max-w-sm leading-relaxed">
            Secure access to your personal dashboard for parametric protection insights.
          </p>

          <div className="space-y-3">
            <div className="flex gap-4 items-center p-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 shrink-0">
                <Shield size={16} />
              </span>
              <div>
                <div className="font-bold text-sm text-white">Dashboard Access</div>
                <div className="text-xs text-slate-400 mt-0.5">View risk signals, events, and wallet payouts.</div>
              </div>
            </div>

            <div className="flex gap-4 items-center p-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shrink-0">
                <Shield size={16} />
              </span>
              <div>
                <div className="font-bold text-sm text-white">Parametric Protection</div>
                <div className="text-xs text-slate-400 mt-0.5">Automated payouts based on real-time data triggers.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-none text-xs text-slate-400 mt-auto text-center">
          Need help? Contact support
        </div>
      </aside>

      {/* RIGHT SECTION */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4 h-full">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-1">
            <div className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">SECURE ACCESS</div>
            <h2 className="text-3xl font-bold text-white">
              {mode === "login" ? "Log in to Aegis" : "Create account"}
            </h2>
            <p className="text-sm text-slate-400">
              Choose your access method below to continue.
            </p>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 p-4 rounded-xl space-y-3 w-full">
            <div className="flex gap-3 items-start mb-1">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 shrink-0">
                <Shield size={16} />
              </span>
              <div>
                <div className="font-bold text-sm text-white">
                  {mode === "login" ? "Gig Worker Login" : "Gig Worker Signup"}
                </div>
                <div className="text-xs text-slate-400">
                  Access your dashboard, policies, and payout wallet.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-white/10 bg-black/20">
              <button
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === "login" ? "bg-indigo-500/20 border border-indigo-500/30 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                onClick={() => setMode("login")}
                type="button"
              >
                Login
              </button>
              <button
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === "signup" ? "bg-indigo-500/20 border border-indigo-500/30 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                onClick={() => setMode("signup")}
                type="button"
              >
                Sign Up
              </button>
            </div>

            {mode === "session" ? (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                    <Shield size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Identity Verified</h3>
                    <p className="text-sm text-slate-400 mt-1">Welcome back, <span className="text-indigo-300 font-bold">{user.name || "Gig Worker"}</span></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    Proceed to Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full h-11 bg-slate-800/40 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 text-slate-400 hover:text-rose-200 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                  >
                    Not you? Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <User size={14} />
                      </span>
                      <input
                        name="name"
                        placeholder="Full name"
                        value={form.name}
                        onChange={onChange}
                        required
                        className="w-full h-10 text-sm px-3 pl-9 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                     <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <MapPin size={14} />
                      </span>
                      <input
                        name="city"
                        placeholder="City"
                        value={form.city || ""}
                        onChange={onChange}
                        onFocus={() => form.city?.length >= 3 && setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                        autoComplete="off"
                        required
                        className="w-full h-10 text-sm px-3 pl-9 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                      {fetchingCity && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                      {showCitySuggestions && apiSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-11 bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl backdrop-blur-xl">
                          {apiSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full px-4 py-2 text-left text-[11px] font-semibold text-slate-300 hover:bg-indigo-500/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
                              onClick={() => {
                                setForm(f => ({ ...f, city: item.city }));
                                setShowCitySuggestions(false);
                              }}
                            >
                              <span className="block truncate">{item.city}</span>
                              <span className="block text-[9px] text-slate-500 truncate">{item.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative col-span-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Briefcase size={14} />
                      </span>
                      <select
                        name="platform"
                        value={form.platform}
                        onChange={onChange}
                        className="w-full h-10 text-sm px-3 pl-9 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none"
                      >
                        <option className="bg-slate-900">Swiggy</option>
                        <option className="bg-slate-900">Zomato</option>
                        <option className="bg-slate-900">Rapido</option>
                        <option className="bg-slate-900">Uber</option>
                        <option className="bg-slate-900">Dunzo</option>
                        <option className="bg-slate-900">Porter</option>
                        <option className="bg-slate-900">Zepto</option>
                        <option className="bg-slate-900">Blinkit</option>
                      </select>
                    </div>
  
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Monitor size={14} />
                      </span>
                      <input
                        name="avg_daily_deliveries"
                        type="number"
                        placeholder="Daily Deliveries"
                        value={form.avg_daily_deliveries}
                        onChange={onChange}
                        required
                        className="w-full h-10 text-sm px-3 pl-9 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ₹/D
                      </span>
                      <input
                        name="earnings_per_delivery"
                        type="number"
                        placeholder="₹ Per Order"
                        value={form.earnings_per_delivery}
                        onChange={onChange}
                        required
                        className="w-full h-10 text-sm px-3 pl-9 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                )}
  
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={14} />
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={onChange}
                    required
                    className="w-full h-10 text-sm px-3 pl-9 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
  
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={14} />
                  </span>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={onChange}
                    required
                    className="w-full h-10 text-sm px-3 pl-9 pr-10 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
  
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">
                    {mode === "login" ? "" : "Details can be edited later."}
                  </span>
                  <button type="button" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300" disabled>
                    Forgot password?
                  </button>
                </div>
  
                {error && <p className="text-rose-400 text-xs">{error}</p>}
  
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Login"}
                </button>
              </form>
            )}
          </div>

          {mode === "login" && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl mx-auto max-w-sm">
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Shield size={12} />
                </span>
                <div className="text-[11px] text-slate-400 font-medium">
                  Enterprise-grade encryption protecting your payouts.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AuthPage;
