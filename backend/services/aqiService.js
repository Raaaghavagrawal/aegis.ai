const axios = require("axios");

function mapPollutionLevel(aqi) {
  const value = Number(aqi || 0);
  if (value <= 50) return "Good";
  if (value <= 100) return "Moderate";
  if (value <= 150) return "Unhealthy for Sensitive Groups";
  if (value <= 200) return "Unhealthy";
  if (value <= 300) return "Very Unhealthy";
  return "Hazardous";
}

async function fetchWithRetry(url, options, retries = 1) {
  try {
    return await axios.get(url, options);
  } catch (error) {
    if (retries <= 0) throw error;
    return fetchWithRetry(url, options, retries - 1);
  }
}

async function fetchAqiByCity(city) {
  const apiKey = process.env.AQICN_API_KEY;
  if (!apiKey) {
    throw new Error("AQICN_API_KEY is missing");
  }

  const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/`;
  const response = await fetchWithRetry(url, {
    params: { token: apiKey },
    timeout: 10000,
  });

  const payload = response.data || {};
  if (payload.status !== "ok") {
    throw new Error(`AQICN API returned status: ${payload.status || "unknown"}`);
  }

  const aqi = Number(payload?.data?.aqi || 0);
  const pollutionLevel = mapPollutionLevel(aqi);

  const { addSystemLog } = require("../models/systemLogModel");
  await addSystemLog("aqi_fetch", `Extracted AQI for ${city}: ${aqi} index (${pollutionLevel})`, "success");

  return {
    aqi,
    pollutionLevel,
    raw: payload,
  };
}

module.exports = {
  fetchAqiByCity,
};
