const { createEvent, getLatestEventByCity, getRecentEventsByCity } = require("../models/eventModel");
const { fetchWeatherByCity } = require("../services/weatherService");
const { fetchAqiByCity } = require("../services/aqiService");

function computeTriggered(rainfall, aqi) {
  const isDemo = process.env.DEMO_MODE === "true";
  if (isDemo) return true;
  return Number(rainfall) > 5 || Number(aqi) > 150;
}

async function ingestEnvironmentForCity(city) {
  const [weather, aqiData] = await Promise.all([
    fetchWeatherByCity(city),
    fetchAqiByCity(city),
  ]);

  const triggered = computeTriggered(weather.rainfall, aqiData.aqi);
  const eventDate = new Date().toISOString().slice(0, 10);

  const eventId = await createEvent({
    city,
    rainfall: weather.rainfall,
    temperature: weather.temperature,
    aqi: aqiData.aqi,
    pollutionLevel: aqiData.pollutionLevel,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    eventDate,
    triggered,
  });

  return {
    event_id: eventId,
    city,
    rainfall: weather.rainfall,
    temperature: weather.temperature,
    humidity: weather.humidity,
    wind_speed: weather.windSpeed,
    weather_condition: weather.weatherCondition,
    aqi: aqiData.aqi,
    pollution_level: aqiData.pollutionLevel,
    event_date: eventDate,
    triggered,
  };
}

async function getUnifiedEnvironmentData(req, res, next) {
  try {
    const city = (req.params.city || "").trim();
    if (!city) return res.status(400).json({ message: "city is required" });

    const liveData = await ingestEnvironmentForCity(city);
    
    // AI Forecast Integration
    const hour = new Date().getHours();
    const isPeak = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
    const userFeatures = {
      city: liveData.city,
      rainfall: liveData.rainfall,
      aqi: liveData.aqi,
      temperature: liveData.temperature,
      platform: req.user?.platform || "Swiggy",
      avg_daily_deliveries: req.user?.avg_daily_deliveries || 20,
      earnings_per_delivery: req.user?.earnings_per_delivery || 40,
      is_peak_hour: isPeak,
    };

    const aiPrediction = await require("../services/aiService").getIntegratedAIPredictions(userFeatures);
    const events = await getRecentEventsByCity(city, 20);

    const history = events.map((ev) => ({
      rainfall: Number(ev.rainfall),
      aqi: Number(ev.aqi),
      temperature: Number(ev.temperature),
      created_at: ev.created_at,
      city: ev.city
    }));

    return res.json({
      current: {
        air_quality: liveData.aqi,
        rain_mm: liveData.rainfall,
        temp_c: liveData.temperature,
        condition: liveData.weather_condition,
        pollution: liveData.pollution_level,
        risk_level: aiPrediction.risk_level,
        risk_score: aiPrediction.risk_score,
        confidence: aiPrediction.confidence,
        ai_insight: aiPrediction.explanation,
        city: liveData.city
      },
      history: history,
      timestamp: liveData.event_date
    });
  } catch (error) {
    console.error("[ENVIRONMENT_UNIFIED_ERROR]", error.message);
    return next(error);
  }
}

async function getHistoricalEnvironmentData(req, res, next) {
  try {
    const city = (req.params.city || "").trim();
    if (!city) return res.status(400).json({ message: "city is required" });

    const liveData = await ingestEnvironmentForCity(city);
    const events = await getRecentEventsByCity(city, 20);

    const history = events.map((ev) => ({
      rainfall: Number(ev.rainfall),
      aqi: Number(ev.aqi),
      temperature: Number(ev.temperature),
      created_at: ev.created_at,
      city: ev.city,
      risk_score: Math.min(100, Math.round((Number(ev.rainfall) / 100) * 50 + (Number(ev.aqi) / 500) * 50)),
    }));

    return res.json({
      current: {
        air_quality: liveData.aqi,
        rain_mm: liveData.rainfall,
        temp_c: liveData.temperature,
        condition: liveData.weather_condition,
        pollution: liveData.pollution_level,
        city: liveData.city
      },
      history: history
    });
  } catch (error) {
    console.error("[ENVIRONMENT_HISTORY_ERROR]", error.message);
    return next(error);
  }
}

async function simulateEvent(req, res, next) {
  try {
    const { city, rainfall, aqi, temperature } = req.body;
    if (!city || rainfall === undefined || aqi === undefined) {
      return res.status(400).json({ message: "city, rainfall and aqi are required" });
    }

    const eventDate = new Date().toISOString().slice(0, 10);
    const eventId = await createEvent({
      city,
      rainfall: Number(rainfall),
      temperature: Number(temperature || 25),
      aqi: Number(aqi),
      pollutionLevel: Number(aqi) > 300 ? "Hazardous" : "Moderate",
      eventDate,
      triggered: true,
    });

    const { processPayoutsForCity } = require("../services/payoutService");
    const payoutResult = await processPayoutsForCity(city);

    return res.status(201).json({
      message: "Simulated event created and payouts triggered",
      data: { event_id: eventId, city, payouts: payoutResult },
    });
  } catch (error) {
    return next(error);
  }
}

async function fetchAndStoreEnvironment(req, res, next) {
  try {
    const city = (req.params.city || "").trim();
    if (!city) return res.status(400).json({ message: "city is required" });
    const result = await ingestEnvironmentForCity(city);
    return res.status(201).json({ message: "Environment data synchronized", data: result });
  } catch (error) {
    return next(error);
  }
}

async function getLatestEvent(req, res, next) {
  try {
    const city = (req.params.city || "").trim();
    if (!city) return res.status(400).json({ message: "city is required" });
    const latest = await getLatestEventByCity(city);
    if (!latest) return res.status(404).json({ message: "No data found" });
    return res.json({ data: latest });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUnifiedEnvironmentData,
  getHistoricalEnvironmentData,
  ingestEnvironmentForCity,
  simulateEvent,
  fetchAndStoreEnvironment,
  getLatestEvent
};
