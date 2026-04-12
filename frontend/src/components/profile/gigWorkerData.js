/** Shared formatters & synthetic gig metrics for the profile dashboard (UI / demo). */

export function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₹${Math.round(x).toLocaleString("en-IN")}`;
}

export const ORDER_STATUS_STYLES = {
  delivered: {
    label: "Delivered",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  en_route: {
    label: "En route",
    className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    dot: "bg-cyan-400 animate-pulse",
  },
  picked_up: {
    label: "Picked up",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-400",
  },
  assigned: {
    label: "New",
    className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
    dot: "bg-indigo-400",
  },
};

/** Deterministic “live” scores from worker id so they stay stable per user. */
export function deriveWorkerScores(userId) {
  const id = Number(userId) || 7;
  const seed = (id * 9301 + 49297) % 233280;
  const rating = 4.15 + (seed % 65) / 100;
  const trust = 76 + (seed % 20);
  const successRate = 93.5 + (seed % 55) / 10;
  const totalDeliveries = 420 + (seed % 380) + id * 3;
  return {
    rating: Math.round(rating * 10) / 10,
    trust: Math.min(99, trust),
    successRate: Math.round(successRate * 10) / 10,
    totalDeliveries,
  };
}

/** Hour buckets for demand chart (24-hour rolling window ending at current hour). */
export function buildHourlyDemandSeries(userId) {
  const id = Number(userId) || 1;
  const currentHour = new Date().getHours();
  const data = [];

  for (let i = 23; i >= 0; i--) {
    const h = (currentHour - i + 24) % 24;
    // Detirministic synthetic demand curve
    // Peaks around lunch (13) and dinner (20)
    const lunchEffect = 8 * Math.exp(-Math.pow(h - 13, 2) / 4);
    const dinnerEffect = 10 * Math.exp(-Math.pow(h - 20, 2) / 6);
    const lateNightEffect = 4 * Math.exp(-Math.pow(h - 1, 2) / 8);
    
    const base = 4 + lunchEffect + dinnerEffect + lateNightEffect;
    const noise = ((id * 7 + h * 13) % 4) - 2;
    const demand = Math.max(2, Math.round(base + noise));

    data.push({
      slot: `${h}:00`,
      demand,
      short: `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h >= 12 ? "p" : "a"}`,
      hour: h,
    });
  }
  return data;
}

export function buildSyntheticOrders(platform, city, earningsPerDelivery) {
  const zone = city?.trim() || "Metro North";
  const partner = platform?.trim() || "Gig partner";
  const baseFee = Number.isFinite(Number(earningsPerDelivery)) ? Math.round(Number(earningsPerDelivery)) : 42;

  return [
    {
      id: "ORD-8K2M91",
      merchant: "South Indian Kitchen",
      pickup: `${zone} · Indiranagar`,
      dropoff: "RMZ Ecoworld · Tower 2",
      fee: baseFee + 12,
      distanceKm: 4.1,
      items: 2,
      status: "delivered",
      minutesAgo: 14,
      tip: 20,
    },
    {
      id: "ORD-7J4P03",
      merchant: "Thali & Co.",
      pickup: `${zone} · Koramangala 5th`,
      dropoff: "Prestige Tech Park",
      fee: baseFee + 6,
      distanceKm: 2.8,
      items: 1,
      status: "delivered",
      minutesAgo: 38,
      tip: 0,
    },
    {
      id: "ORD-9Q1L44",
      merchant: "Late Night Biryani",
      pickup: `${zone} · HSR Layout`,
      dropoff: "Sarjapur Rd · Apt 12B",
      fee: baseFee + 18,
      distanceKm: 5.6,
      items: 3,
      status: "en_route",
      minutesAgo: 6,
      tip: 0,
      priority: true,
    },
    {
      id: "ORD-6R8N77",
      merchant: "Fresh Salad Bar",
      pickup: `${zone} · MG Road`,
      dropoff: "UB City drop-off",
      fee: baseFee + 4,
      distanceKm: 3.4,
      items: 1,
      status: "picked_up",
      minutesAgo: 3,
      tip: 15,
    },
    {
      id: "ORD-5T3H22",
      merchant: "Ice cream lab",
      pickup: `${zone} · Commercial St`,
      dropoff: "Richmond Circle",
      fee: baseFee - 6,
      distanceKm: 1.9,
      items: 1,
      status: "assigned",
      minutesAgo: 1,
      tip: 0,
    },
  ].map((o) => ({ ...o, partner }));
}

export function summarizeOrders(orders) {
  const completed = orders.filter((o) => o.status === "delivered").length;
  const live = orders.filter((o) => o.status !== "delivered").length;
  const gross = orders.reduce((sum, o) => sum + o.fee + (o.tip || 0), 0);
  return { completed, live, gross };
}

/** Copy for AI-style insight cards (mix of synthetic + city/platform). */
const STREAM_MERCHANTS = [
  "Masala Box",
  "Urban Tiffin",
  "Moonlight Dosa",
  "Green Bowl Co.",
  "Kebab Express",
  "Sugar Rush Bakery",
  "Noodle Yard",
];

const STREAM_AREAS = [
  "Indiranagar",
  "Koramangala",
  "HSR Layout",
  "Whitefield",
  "Jayanagar",
  "MG Road",
  "Bellandur",
];

/**
 * Synthetic “live” order appended on a timer (Orders page stream).
 */
export function createStreamOrder(city, earningsPerDelivery, seq) {
  const zone = city?.trim() || "Metro North";
  const baseFee = Number.isFinite(Number(earningsPerDelivery)) ? Math.round(Number(earningsPerDelivery)) : 42;
  const i = Math.abs(seq) % 1000;
  const merchant = STREAM_MERCHANTS[i % STREAM_MERCHANTS.length];
  const area = STREAM_AREAS[(i * 3) % STREAM_AREAS.length];
  const dist = Math.round((1.4 + (i % 7) * 0.55) * 10) / 10;
  const fee = baseFee + (i % 5) * 8 + (i % 3) * 5;
  const priority = i % 6 === 0;

  return {
    id: `ORD-LV-${Date.now().toString(36)}-${seq}`,
    merchant,
    pickup: `${zone} · ${area}`,
    dropoff: `${STREAM_AREAS[(i + 2) % STREAM_AREAS.length]} · Hub ${(i % 4) + 1}`,
    fee,
    distanceKm: dist,
    items: 1 + (i % 3),
    status: "assigned",
    minutesAgo: 0,
    tip: i % 4 === 0 ? 15 + (i % 5) * 5 : 0,
    priority,
    partner: "stream",
  };
}

/** Orders-page AI strip: peak + geo hotspots. */
export function buildOrdersDashboardInsights(city, platform) {
  const zone = city?.trim() || "your city";
  const p = platform?.trim() || "your app";

  return {
    peak: {
      title: "Peak dispatch window",
      body: `Live model: strongest match rate in ${zone} between 11:45 AM – 2:15 PM. ${p} batches cluster near tech parks in that band.`,
      metric: "Lunch surge",
    },
    hotspots: {
      title: "High demand pockets",
      body: `Heat building near ${zone} · Koramangala 5th Block and ORR service lanes. Short-radius offers pay +12–18% vs baseline this hour (synthetic).`,
      metric: "Geo pulse",
    },
  };
}

export function buildAIInsightCopy(city, platform, scores) {
  const zone = city?.trim() || "your zone";
  const partner = platform?.trim() || "your platform";

  return {
    peakHours: {
      title: "Peak earning windows",
      body: `Model suggests strongest order density in ${zone} around 12:00–2:00 PM and 7:30–9:30 PM. Align breaks before lunch rush on ${partner}.`,
      metric: "High demand",
    },
    risk: {
      title: "Route & weather risk",
      body:
        scores.trust >= 85
          ? "Trust band is healthy — prioritize short hops during rain spikes to protect on-time rate."
          : "Build buffer between stacked orders when AQI or rain triggers are elevated in your city.",
      metric: scores.trust >= 85 ? "Low friction" : "Watch triggers",
      variant: scores.trust >= 85 ? "calm" : "warn",
    },
    earnings: {
      title: "Earnings nudge",
      body: `Batching 2 extra deliveries in the evening peak could lift daily gross ~8–12% in ${zone} (illustrative).`,
      metric: "Opportunity",
    },
  };
}
