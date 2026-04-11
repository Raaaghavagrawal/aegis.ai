const axios = require("axios");

// In-memory cache: city -> { rainfall, temperature, weatherCondition, cachedAt }
const weatherCache = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function mapWeatherCondition(rawCondition) {
  const value = (rawCondition || "").toLowerCase();
  if (value.includes("rain")) return "Rain";
  if (value.includes("cloud")) return "Cloudy";
  if (value.includes("clear")) return "Clear";
  if (value.includes("storm")) return "Storm";
  if (value.includes("drizzle")) return "Rain";
  if (value.includes("snow")) return "Snow";
  if (value.includes("mist") || value.includes("fog")) return "Foggy";
  return rawCondition || "Unknown";
}

/**
 * Exponential-backoff retry wrapper.
 * @param {Function} fn         Async function to retry
 * @param {number}   retries    Total attempts
 * @param {number}   baseMs     Base delay in ms
 */
async function withRetry(fn, retries = 3, baseMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = baseMs * Math.pow(2, attempt - 1); // 500, 1000, 2000...
        console.warn(
          `[WEATHER] Attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Check if the in-memory cache entry is still fresh.
 */
function isCacheFresh(city) {
  const entry = weatherCache[city];
  return entry && Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

/**
 * Fetch last weather values from DB as final fallback.
 */
async function fetchFallbackFromDb(city) {
  try {
    const { getLatestEventByCity } = require("../models/eventModel");
    const event = await getLatestEventByCity(city);
    if (event) {
      console.warn(`[WEATHER] Using DB fallback for ${city}`);
      return {
        rainfall: Number(event.rainfall) || 0,
        temperature: Number(event.temperature) || 25,
        weatherCondition: "Unknown (DB Fallback)",
        source: "db_fallback",
      };
    }
  } catch (dbErr) {
    console.error("[WEATHER] DB fallback failed:", dbErr.message);
  }
  return null;
}

async function fetchWeatherByCity(city) {
  // 1. Return fresh cache if available
  if (isCacheFresh(city)) {
    console.log(`[WEATHER] Serving from cache for ${city}`);
    return { ...weatherCache[city].data, source: "cache" };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const url = "https://api.openweathermap.org/data/2.5/weather";

  try {
    const response = await withRetry(
      () =>
        axios.get(url, {
          params: { q: city, appid: apiKey, units: "metric" },
          timeout: 10000,
        }),
      3,
      500
    );

    const payload = response.data || {};
    const rainfall = Number(
      payload?.rain?.["1h"] || payload?.rain?.["3h"] || 0
    );
    const temperature = Number(payload?.main?.temp || 0);
    const humidity = Number(payload?.main?.humidity || 0);
    const windSpeed = Number(payload?.wind?.speed || 0);
    const weatherCondition = mapWeatherCondition(
      payload?.weather?.[0]?.main
    );

    const result = { rainfall, temperature, humidity, windSpeed, weatherCondition, source: "api" };

    // Update in-memory cache
    weatherCache[city] = { data: result, cachedAt: Date.now() };

    const { addSystemLog } = require("../models/systemLogModel");
    await addSystemLog(
      "weather_fetch",
      `Weather OK for ${city}: ${rainfall}mm, ${temperature}°C`,
      "success"
    );

    return result;
  } catch (err) {
    console.error(`[WEATHER] All retries failed for ${city}: ${err.message}`);

    // 2. Stale cache fallback (prefer real-but-old over nothing)
    if (weatherCache[city]) {
      console.warn(`[WEATHER] Using stale cache for ${city}`);
      return { ...weatherCache[city].data, source: "stale_cache" };
    }

    // 3. DB fallback – last known good value
    const dbFallback = await fetchFallbackFromDb(city);
    if (dbFallback) return dbFallback;

    // 4. Hard default (logged clearly, never silently faked)
    console.error(`[WEATHER] No fallback available for ${city}. Using safe defaults.`);
    const { addSystemLog } = require("../models/systemLogModel");
    await addSystemLog(
      "weather_fetch",
      `Weather fetch FAILED for ${city}. Safe defaults used.`,
      "error"
    );
    return { rainfall: 0, temperature: 25, weatherCondition: "Unknown", source: "default" };
  }
}

module.exports = { fetchWeatherByCity };
