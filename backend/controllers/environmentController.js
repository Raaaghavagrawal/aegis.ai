const { createEvent, getLatestEventByCity, getRecentEventsByCity, getLatestTriggeredEventByGeo } = require("../models/eventModel");
const { fetchWeatherByCity, fetchWeatherByCoords } = require("../services/weatherService");
const { fetchAqiByCity, fetchAqiByCoords } = require("../services/aqiService");

function computeTriggered(rainfall, aqi) {
  const isDemo = process.env.DEMO_MODE === "true";
  if (isDemo) return true;
  return Number(rainfall) > 5 || Number(aqi) > 150;
}

function getZone(lat, lon) {
  if (!lat || !lon) return null;
  // Radius-based zone logic: group by approx 3km grid (0.027 deg ~ 3km)
  const zoneLat = (Math.round(lat / 0.027) * 0.027).toFixed(4);
  const zoneLon = (Math.round(lon / 0.027) * 0.027).toFixed(4);
  return `z_${zoneLat}_${zoneLon}`;
}

async function ingestEnvironment({ city, lat, lon }) {
  const [weather, aqiData] = await Promise.all([
    lat && lon ? fetchWeatherByCoords(lat, lon) : fetchWeatherByCity(city),
    lat && lon ? fetchAqiByCoords(lat, lon) : fetchAqiByCity(city),
  ]);

  const triggered = computeTriggered(weather.rainfall, aqiData.aqi);
  const eventDate = new Date().toISOString().slice(0, 10);
  const zoneId = lat && lon ? getZone(lat, lon) : null;

  const eventId = await createEvent({
    city: weather.city || city || "Unknown",
    rainfall: weather.rainfall,
    temperature: weather.temperature,
    aqi: aqiData.aqi,
    pollutionLevel: aqiData.pollutionLevel,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    eventDate,
    triggered,
    latitude: lat ? Number(lat) : null,
    longitude: lon ? Number(lon) : null,
    zoneId
  });

  return {
    event_id: eventId,
    city: weather.city || city,
    lat,
    lon,
    zone_id: zoneId,
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

async function ingestEnvironmentForCity(city) {
  return ingestEnvironment({ city });
}

async function getUnifiedEnvironmentData(req, res, next) {
  try {
    const { lat, lon } = req.query;
    const cityParam = (req.params.city || "").trim();
    
    if (!cityParam && (!lat || !lon)) {
      return res.status(400).json({ message: "city or lat/lon required" });
    }

    const liveData = await ingestEnvironment({ 
      city: cityParam, 
      lat: lat ? Number(lat) : null, 
      lon: lon ? Number(lon) : null 
    });
    
    // Optional: Hyper-local triggered event check
    let nearbyAlert = null;
    if (lat && lon) {
      nearbyAlert = await getLatestTriggeredEventByGeo(Number(lat), Number(lon), 5); // 5km radius
    }

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
    const events = await getRecentEventsByCity(liveData.city, 24);

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
      nearby_alert: nearbyAlert,
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
    const events = await getRecentEventsByCity(city, 24);

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
  ingestEnvironment,
  ingestEnvironmentForCity,
  simulateEvent,
  fetchAndStoreEnvironment,
  getLatestEvent
};
