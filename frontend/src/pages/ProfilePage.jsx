import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, LogOut, Package, Shield, Volume2, VolumeX } from "lucide-react";
import { api, getAuthHeaders } from "../utils/api";
import LiveBackground from "../components/LiveBackground";
import {
  ProfileIdentityHero,
  ProfileKpiGrid,
  ProfileDemandAndAI,
  ProfileLocationCard,
  ProfileAmbientLayer,
  ProfileOrdersSection,
  deriveWorkerScores,
  buildHourlyDemandSeries,
  buildSyntheticOrders,
  summarizeOrders,
  createStreamOrder,
  fadeUp,
  staggerWrap,
} from "../components/profile";

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 25000,
  maximumAge: 0,
};

function normalizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    city: u.city,
    platform: u.platform,
    weekly_income: Number(u.weekly_income),
    avg_daily_deliveries: u.avg_daily_deliveries ?? 20,
    earnings_per_delivery: u.earnings_per_delivery ?? 40,
  };
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Language": "en" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.display_name || null;
}

function requestPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

export default function ProfilePage({ isDashboard = false }) {
  const navigate = useNavigate();
  const cached = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("aegis_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [user, setUser] = useState(() => normalizeUser(cached) || {});
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  const [locStatus, setLocStatus] = useState("loading");
  const [coords, setCoords] = useState(null);
  const [accuracyM, setAccuracyM] = useState(null);
  const [locatedAt, setLocatedAt] = useState(null);
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [coordsCopied, setCoordsCopied] = useState(false);

  // Orders State (Moved from Logistics Hub)
  const streamSeq = useRef(0);
  const [orders, setOrders] = useState(() =>
    buildSyntheticOrders(cached.platform, cached.city, cached.earnings_per_delivery)
  );

  useEffect(() => {
    setOrders(buildSyntheticOrders(user.platform, user.city, user.earnings_per_delivery));
  }, [user.platform, user.city, user.earnings_per_delivery]);

  useEffect(() => {
    const id = window.setInterval(() => {
      streamSeq.current += 1;
      setOrders((prev) => {
        const next = [createStreamOrder(user.city, user.earnings_per_delivery, streamSeq.current), ...prev];
        return next.slice(0, 36);
      });
    }, 13000);
    return () => window.clearInterval(id);
  }, [user.city, user.earnings_per_delivery]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOrders((prev) =>
        prev.map((o, i) => {
          const minutesAgo = o.minutesAgo + 1;
          let status = o.status;
          if (o.status === "assigned" && minutesAgo > 2 && i % 4 === 0) status = "picked_up";
          else if (o.status === "picked_up" && minutesAgo > 5) status = "en_route";
          else if (o.status === "en_route" && minutesAgo > 14) status = "delivered";
          return { ...o, minutesAgo, status };
        })
      );
    }, 9000);
    return () => window.clearInterval(id);
  }, []);

  const orderSummary = useMemo(() => summarizeOrders(orders), [orders]);

  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem("aegis_profile_sound") !== "0";
    } catch {
      return true;
    }
  });
  const [weekPulse, setWeekPulse] = useState(0);

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const next = !v;
      try {
        localStorage.setItem("aegis_profile_sound", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWeekPulse((p) => p + Math.floor(6 + Math.random() * 24));
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  const fetchProfile = useCallback(async () => {
    setUserLoading(true);
    setUserError("");
    try {
      const res = await api.get("/api/users/me", { headers: getAuthHeaders() });
      const normalized = normalizeUser(res.data?.user);
      if (normalized) {
        setUser(normalized);
        try {
          localStorage.setItem("aegis_user", JSON.stringify(normalized));
        } catch {
          /* ignore */
        }
      }
    } catch {
      setUserError("Could not refresh profile from the server. Showing saved data.");
      const n = normalizeUser(cached);
      if (n) setUser(n);
    } finally {
      setUserLoading(false);
    }
  }, [cached]);

  const fetchWallet = useCallback(async () => {
    const uid = user?.id ?? cached?.id;
    if (!uid) return;
    try {
      const balanceRes = await api.get(`/api/payouts/wallet/${uid}`, { headers: getAuthHeaders() });
      setWalletBalance(balanceRes.data?.balance);
    } catch {
      setWalletBalance(null);
    }
  }, [user?.id, cached?.id]);

  const resolveAddress = useCallback(async (lat, lon) => {
    setAddressLoading(true);
    setAddress(null);
    try {
      const name = await reverseGeocode(lat, lon);
      setAddress(name);
    } catch {
      setAddress(null);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const refreshLocation = useCallback(() => {
    setLocStatus("loading");
    setLocError("");
    setCoords(null);
    setAccuracyM(null);
    setLocatedAt(null);
    setAddress(null);

    requestPosition()
      .then((pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        setAccuracyM(accuracy != null ? Math.round(accuracy) : null);
        setLocatedAt(new Date(pos.timestamp));
        setLocStatus("ok");
        resolveAddress(latitude, longitude);
      })
      .catch((err) => {
        const code = err?.code;
        if (code === 1) {
          setLocStatus("denied");
          setLocError("Location access was blocked. Enable it in your browser settings to see your live position.");
        } else if (code === 2) {
          setLocStatus("error");
          setLocError("Position could not be determined. Try again outdoors or check GPS.");
        } else if (code === 3) {
          setLocStatus("error");
          setLocError("Location request timed out. Try again.");
        } else {
          setLocStatus("error");
          setLocError(err?.message || "Could not read your location.");
        }
      });
  }, [resolveAddress]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user?.id || cached?.id) fetchWallet();
  }, [fetchWallet, user?.id, cached?.id]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const handleLogout = () => {
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
    navigate("/auth");
  };

  const initial = (user.name?.trim()?.[0] || user.email?.trim()?.[0] || "G").toUpperCase();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const workerScores = useMemo(() => deriveWorkerScores(user.id), [user.id]);

  const hourlyDemand = useMemo(() => buildHourlyDemandSeries(user.id), [user.id]);

  const copyCoordinates = useCallback(() => {
    if (!coords) return;
    const text = `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
    const done = () => {
      setCoordsCopied(true);
      window.setTimeout(() => setCoordsCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {});
    }
  }, [coords]);

  const mapsHref = coords != null ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}` : null;

  const embedBbox =
    coords != null
      ? `${coords.lon - 0.012},${coords.lat - 0.008},${coords.lon + 0.012},${coords.lat + 0.008}`
      : "";

  const cityMismatch =
    coords != null &&
    user.city &&
    address &&
    !String(address).toLowerCase().includes(String(user.city).toLowerCase().slice(0, 4));

  const deliveriesLive = workerScores.totalDeliveries;
  const weekEarningsLive = (user.weekly_income || 0) + weekPulse;

  const content = (
    <div className={`relative z-10 flex flex-col ${isDashboard ? 'w-full' : 'min-h-screen'}`}>
      {!isDashboard && (
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#020617]/80 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#020617]/65">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Link
                to="/dashboard"
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent text-slate-300 shadow-lg shadow-black/20 transition hover:border-indigo-500/40 hover:text-white"
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
              </Link>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/95">Aegis Logistics</p>
                <h1 className="truncate text-lg font-extrabold tracking-tight text-white sm:text-xl">Worker command center</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100 shadow-lg shadow-violet-500/10 transition hover:border-violet-400/50 hover:bg-violet-500/20"
              >
                <Package size={16} />
                <span className="hidden sm:inline">View Orders</span>
                <span className="sm:hidden">Orders</span>
              </Link>
              <button
                type="button"
                onClick={toggleSound}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 text-slate-300 transition hover:border-indigo-400/35 hover:text-white"
                aria-label={soundOn ? "Mute dispatch sounds" : "Enable dispatch sounds"}
                title={soundOn ? "Sound on" : "Sound off"}
              >
                {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-xs font-bold text-slate-200 shadow-lg transition hover:border-rose-500/35 hover:bg-rose-500/[0.12] hover:text-rose-100"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`mx-auto w-full max-w-7xl flex-1 ${isDashboard ? 'px-0 py-0' : 'px-4 py-6 sm:px-8 sm:py-10'}`}>
        <motion.div initial="hidden" animate="show" variants={staggerWrap} className="space-y-8">
          <ProfileIdentityHero
            motionCustom={0}
            fadeUpVariants={fadeUp}
            userLoading={userLoading}
            initial={initial}
            user={user}
            greeting={greeting}
            onSync={fetchProfile}
            rating={workerScores.rating}
            trustScore={workerScores.trust}
          />

          {userError && (
            <motion.div
              custom={1}
              variants={fadeUp}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.08] to-transparent px-4 py-3.5 text-sm text-amber-100/95"
            >
              <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
              <p className="leading-relaxed">{userError}</p>
            </motion.div>
          )}

          <ProfileKpiGrid
            motionCustom={2}
            fadeUpVariants={fadeUp}
            totalDeliveries={deliveriesLive}
            weekEarnings={weekEarningsLive}
            successRate={workerScores.successRate}
            walletBalance={walletBalance}
            liveOrderCount={orderSummary.live}
          />

          <ProfileDemandAndAI
            motionCustom={3}
            fadeUpVariants={fadeUp}
            hourlyDemand={hourlyDemand}
            city={user.city}
            platform={user.platform}
            scores={workerScores}
          />

          <ProfileLocationCard
            motionCustom={4}
            fadeUpVariants={fadeUp}
            locStatus={locStatus}
            locError={locError}
            coords={coords}
            accuracyM={accuracyM}
            locatedAt={locatedAt}
            address={address}
            addressLoading={addressLoading}
            cityMismatch={cityMismatch}
            userCity={user.city}
            embedBbox={embedBbox}
            mapsHref={mapsHref}
            coordsCopied={coordsCopied}
            onCopyCoords={copyCoordinates}
            onRefresh={refreshLocation}
            cityLabel={user.city}
          />

          <ProfileOrdersSection
            motionCustom={5}
            fadeUpVariants={fadeUp}
            orders={orders}
            summary={orderSummary}
            hubTitle="Live Logistics Stream"
            hubSubtitle="Real-time order tracking and dispatch logs integrated into your profile."
            hubBadge="Integrated Hub"
          />

          <motion.footer
            custom={6}
            variants={fadeUp}
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-slate-950/50 px-4 py-5 text-center sm:flex-row sm:justify-between sm:text-left"
          >
            <p className="max-w-xl text-xs leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-400">Privacy:</span> GPS is in-browser. KPI pulses and AI rotation are{" "}
              <span className="text-slate-400">simulated</span> for a live-ops feel — swap with real streams when ready.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <Shield size={14} className="text-indigo-500/60" /> Secure session
            </div>
          </motion.footer>
        </motion.div>
      </main>
    </div>
  );

  if (isDashboard) return content;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 relative overflow-x-hidden">
      <LiveBackground />
      <ProfileAmbientLayer />
      {content}
    </div>
  );
}
