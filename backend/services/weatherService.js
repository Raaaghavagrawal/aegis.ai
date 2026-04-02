const axios = require("axios");

function mapWeatherCondition(rawCondition) {
  const value = (rawCondition || "").toLowerCase();
  if (value.includes("rain")) return "Rain";
  if (value.includes("cloud")) return "Cloudy";
  if (value.includes("clear")) return "Clear";
  if (value.includes("storm")) return "Storm";
  return rawCondition || "Unknown";
}

async function fetchWithRetry(url, options, retries = 1) {
  try {
    return await axios.get(url, options);
  } catch (error) {
    if (retries <= 0) throw error;
    return fetchWithRetry(url, options, retries - 1);
  }
}

async function fetchWeatherByCity(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const url = "https://api.openweathermap.org/data/2.5/weather";
  const response = await fetchWithRetry(url, {
    params: {
      q: city,
      appid: apiKey,
      units: "metric",
    },
    timeout: 10000,
  });

  const payload = response.data || {};
  const rainfall = Number(payload?.rain?.["1h"] || payload?.rain?.["3h"] || 0);
  const temperature = Number(payload?.main?.temp || 0);
  const weatherCondition = mapWeatherCondition(payload?.weather?.[0]?.main);

  const { addSystemLog } = require("../models/systemLogModel");
  await addSystemLog("weather_fetch", `Extracted weather data for ${city}: ${rainfall}mm rain, ${temperature}°C`, "success");

  return {
    rainfall,
    temperature,
    weatherCondition,
    raw: payload,
  };
}

module.exports = {
  fetchWeatherByCity,
};
