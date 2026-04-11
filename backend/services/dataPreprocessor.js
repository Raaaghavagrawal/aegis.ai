/**
 * Aegis Data Preprocessor
 * Cleans, normalizes, and smooths raw API data before it reaches the ML layer.
 */

// In-memory rolling buffer: { city -> { rainfall: [], aqi: [] } }
const rollingBuffer = {};
const BUFFER_SIZE = 3;

// --- Noise Filters ---
function isValidRainfall(val) {
  return typeof val === "number" && val >= 0 && val <= 500;
}

function isValidAqi(val) {
  return typeof val === "number" && val >= 0 && val <= 1000;
}

// --- Normalization Caps ---
const RAINFALL_CAP = 200;  // mm
const AQI_CAP = 500;

// --- Rolling Buffer Helpers ---
function pushToBuffer(city, key, value) {
  if (!rollingBuffer[city]) rollingBuffer[city] = {};
  if (!rollingBuffer[city][key]) rollingBuffer[city][key] = [];
  rollingBuffer[city][key].push(value);
  if (rollingBuffer[city][key].length > BUFFER_SIZE) {
    rollingBuffer[city][key].shift();
  }
}

function movingAvg(city, key) {
  const arr = (rollingBuffer[city] && rollingBuffer[city][key]) || [];
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function getPreviousValue(city, key) {
  const arr = (rollingBuffer[city] && rollingBuffer[city][key]) || [];
  if (arr.length < 2) return null;
  return arr[arr.length - 2]; // second-to-last = "previous"
}

/**
 * Preprocess raw environment data before feature engineering.
 * @param {string} city
 * @param {{ rainfall: number, aqi: number, temperature: number }} raw
 * @returns preprocessed object
 */
function preprocessEnvironmentData(city, raw) {
  // 1. Handle missing values
  let rainfall = typeof raw.rainfall === "number" ? raw.rainfall : 0;
  let aqi = typeof raw.aqi === "number" ? raw.aqi : 50;
  let temperature = typeof raw.temperature === "number" ? raw.temperature : 25;

  // 2. Filter noise – reject physically impossible values
  if (!isValidRainfall(rainfall)) {
    console.warn(`[PREPROCESS] Rejected noisy rainfall=${rainfall} for ${city}. Using 0.`);
    rainfall = 0;
  }
  if (!isValidAqi(aqi)) {
    console.warn(`[PREPROCESS] Rejected noisy AQI=${aqi} for ${city}. Using 50.`);
    aqi = 50;
  }

  // 3. Clamp to realistic operational maxima
  rainfall = Math.min(rainfall, RAINFALL_CAP);
  aqi = Math.min(aqi, AQI_CAP);

  // 4. Push clean values into rolling buffer
  pushToBuffer(city, "rainfall", rainfall);
  pushToBuffer(city, "aqi", aqi);

  // 5. Compute 3-day moving averages
  const rainfall_avg_3d = movingAvg(city, "rainfall") ?? rainfall;
  const aqi_avg_3d = movingAvg(city, "aqi") ?? aqi;

  // 6. Compute AQI trend (positive = worsening, negative = improving)
  const prev_aqi = getPreviousValue(city, "aqi");
  const aqi_trend = prev_aqi !== null ? aqi - prev_aqi : 0;

  return {
    rainfall,
    rainfall_avg_3d: Math.round(rainfall_avg_3d * 100) / 100,
    aqi,
    aqi_avg_3d: Math.round(aqi_avg_3d * 100) / 100,
    aqi_trend: Math.round(aqi_trend * 100) / 100,
    temperature,
  };
}

module.exports = {
  preprocessEnvironmentData,
  movingAvg,
  getPreviousValue,
};
