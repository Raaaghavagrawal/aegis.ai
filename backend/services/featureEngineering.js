/**
 * Aegis Feature Engineering
 * Converts preprocessed raw data into enriched ML feature vectors.
 *
 * Features produced:
 *   rainfall, rainfall_avg_3d,
 *   aqi, aqi_avg_3d, aqi_trend,
 *   temperature,
 *   is_peak_hour, is_weekend,
 *   platform, rain_weight, speed_sensitivity,
 *   avg_daily_deliveries, earnings_per_delivery
 */

// Peak delivery windows (local time)
const LUNCH_WINDOW = { start: 12, end: 15 };
const DINNER_WINDOW = { start: 19, end: 22 };

/**
 * Determine if the current hour is a peak delivery window.
 * @param {number} hour  0-23
 */
function isPeakHour(hour) {
  return (
    (hour >= LUNCH_WINDOW.start && hour <= LUNCH_WINDOW.end) ||
    (hour >= DINNER_WINDOW.start && hour <= DINNER_WINDOW.end)
  );
}

/**
 * Determine if today is a weekend (Sat=6, Sun=0).
 * @param {Date} [date]
 */
function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Platform-specific sensitivity weights.
 * Food delivery platforms (Swiggy/Zomato) weight rain heavily.
 * Quick-commerce (Blinkit/Zepto) weight speed/time sensitivity.
 */
function getPlatformWeights(platform = "") {
  const p = platform.toLowerCase();
  if (p === "swiggy" || p === "zomato") {
    return { rain_weight: 1.3, speed_sensitivity: 1.0 };
  }
  if (p === "blinkit" || p === "zepto") {
    return { rain_weight: 1.0, speed_sensitivity: 1.4 };
  }
  // Default
  return { rain_weight: 1.0, speed_sensitivity: 1.0 };
}

/**
 * Build the enriched feature vector for the ML service.
 *
 * @param {object} preprocessed  Output from dataPreprocessor
 * @param {object} userContext   { platform, avg_daily_deliveries, earnings_per_delivery }
 * @returns {object} Feature vector
 */
function buildFeatureVector(preprocessed, userContext = {}) {
  const now = new Date();
  const hour = now.getHours();
  const peak = isPeakHour(hour);
  const weekend = isWeekend(now);

  const platform = userContext.platform || "Swiggy";
  const { rain_weight, speed_sensitivity } = getPlatformWeights(platform);

  const avg_daily_deliveries = Number(userContext.avg_daily_deliveries) || 20;
  const earnings_per_delivery = Number(userContext.earnings_per_delivery) || 40;

  // Weighted rainfall considering platform sensitivity
  const rainfall_weighted = preprocessed.rainfall * rain_weight;

  return {
    // Core environmental
    rainfall: preprocessed.rainfall,
    rainfall_avg_3d: preprocessed.rainfall_avg_3d,
    rainfall_weighted,
    aqi: preprocessed.aqi,
    aqi_avg_3d: preprocessed.aqi_avg_3d,
    aqi_trend: preprocessed.aqi_trend,         // positive = worsening
    temperature: preprocessed.temperature,

    // Temporal
    is_peak_hour: peak ? 1 : 0,
    is_weekend: weekend ? 1 : 0,
    hour,

    // Platform
    platform,
    rain_weight,
    speed_sensitivity,
    is_swiggy: platform.toLowerCase() === "swiggy" ? 1 : 0,
    is_zomato: platform.toLowerCase() === "zomato" ? 1 : 0,
    is_quick_commerce: ["blinkit", "zepto"].includes(platform.toLowerCase()) ? 1 : 0,

    // Operational
    avg_daily_deliveries,
    earnings_per_delivery,
  };
}

module.exports = {
  buildFeatureVector,
  isPeakHour,
  isWeekend,
  getPlatformWeights,
};
