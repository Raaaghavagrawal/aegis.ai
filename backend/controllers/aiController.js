const { computeRiskScore } = require("../services/riskService");
const { detectFraud } = require("../services/fraudService");
const { getFlaggedPayouts } = require("../models/payoutModel");
const axios = require("axios");
const { getUserInternal } = require("../models/userModel");
const { getLatestEventByCity } = require("../models/eventModel");

async function getAiRiskScore(req, res, next) {
  try {
    const city = req.params.city;
    const forecast = req.query.forecast !== "0";
    const result = await computeRiskScore(city, { forecast });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function fraudCheck(req, res, next) {
  try {
    const userId = Number(req.params.user_id);
    const eventId = Number(req.params.event_id);
    if (!userId || !eventId) {
      return res.status(400).json({ message: "user_id and event_id are required" });
    }
    const result = await detectFraud(userId, eventId);
    if (result.flagged) {
      console.log("⚠️ Fraud detected:", userId, result.reason);
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function flaggedPayouts(req, res, next) {
  try {
    const payouts = await getFlaggedPayouts();
    return res.json({ payouts });
  } catch (error) {
    return next(error);
  }
}

async function getForecast(req, res, next) {
  try {
    const userId = Number(req.params.user_id);
    if (!userId) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const user = await getUserInternal(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const event = await getLatestEventByCity(user.city);
    const rainfall = event ? Number(event.rainfall) : 0;
    const aqi = event ? Number(event.aqi) : 50;
    const temperature = 26;
    const platform = (user.platform || "").toLowerCase();

    const aiPayload = {
      rainfall: rainfall,
      rainfall_avg_3d: rainfall,
      rainfall_weighted: rainfall,
      aqi: aqi,
      aqi_avg_3d: aqi,
      aqi_trend: 0,
      temperature: temperature,
      is_peak_hour: 1,
      is_weekend: 0,
      hour: 14,
      platform: user.platform || "unknown",
      rain_weight: 1.0,
      speed_sensitivity: 1.0,
      is_swiggy: platform === "swiggy" ? 1 : 0,
      is_zomato: platform === "zomato" ? 1 : 0,
      is_quick_commerce: ["blinkit", "zepto", "instamart"].includes(platform) ? 1 : 0,
      avg_daily_deliveries: user.avg_daily_deliveries || 20,
      earnings_per_delivery: user.earnings_per_delivery || 40
    };

    const mlResponse = await axios.post("http://localhost:8000/predict", aiPayload);
    const data = mlResponse.data;

    const weekly_income = (user.avg_daily_deliveries || 20) * (user.earnings_per_delivery || 40) * 7;
    const net_protected_forecast = weekly_income - data.estimated_loss;

    return res.json({
      weekly_income: weekly_income,
      estimated_loss: data.estimated_loss,
      net_protected_forecast: Math.round(net_protected_forecast),
      risk_score: data.risk_score,
      confidence: data.confidence,
    });
  } catch (error) {
    console.error("Forecast Error:", error);
    return res.status(500).json({ message: "Forecast service failed" });
  }
}

module.exports = {
  getAiRiskScore,
  fraudCheck,
  flaggedPayouts,
  getForecast,
};
