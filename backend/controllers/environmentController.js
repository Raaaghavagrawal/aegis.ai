const { ingestEnvironmentForCity } = require("../controllers/eventController");
const { getLatestEventByCity } = require("../models/eventModel");
const { computeRiskScore } = require("../services/riskService");

async function getUnifiedEnvironmentData(req, res, next) {
  try {
    const city = (req.params.city || "").trim();
    if (!city) return res.status(400).json({ message: "city is required" });

    // 1. Fetch real-time data AND store it in DB (using existing flow)
    const liveData = await ingestEnvironmentForCity(city);

    // 2. Compute Smart Risk Calculation
    // Rainfall > 50 or AQI > 300 = High (as per existing logic in simulateEvent/payoutService)
    const riskInfo = await computeRiskScore(city, { forecast: false });

    return res.json({
      city: liveData.city,
      rainfall: liveData.rainfall,
      temperature: liveData.temperature,
      aqi: liveData.aqi,
      condition: liveData.weather_condition,
      pollution_level: liveData.pollution_level,
      risk_level: riskInfo.level,
      risk_score: riskInfo.score,
      timestamp: liveData.event_date
    });
  } catch (error) {
    console.error("[ENVIRONMENT_UNIFIED_ERROR]", error.message);
    return next(error);
  }
}

module.exports = {
  getUnifiedEnvironmentData,
};
