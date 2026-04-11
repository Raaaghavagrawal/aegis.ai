const { getLatestEventByCity } = require("../models/eventModel");
const { computeRiskScore } = require("../services/riskService");
const { detectFraud } = require("../services/fraudService");
const { getFlaggedPayouts } = require("../models/payoutModel");
const { getUserInternal } = require("../models/userModel");
const axios = require("axios");

function scoreToLabel(score) {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

async function getRiskScore(req, res, next) {
  try {
    const city = req.params.city;
    const event = await getLatestEventByCity(city);
    let score;
    let source;

    if (event) {
      const rainfallScore = Math.min(100, (Number(event.rainfall) / 100) * 50);
      const aqiScore = Math.min(100, (Number(event.aqi) / 500) * 50);
      score = Math.min(100, Math.round(rainfallScore + aqiScore));
      source = "event_data";
    } else {
      score = Math.floor(Math.random() * 61) + 20;
      source = "random_fallback";
    }

    return res.json({
      city,
      score,
      label: scoreToLabel(score),
      source,
    });
  } catch (error) {
    return next(error);
  }
}

async function predictRisk(req, res, next) {
  try {
    const city = (req.query.city || "").trim();
    if (!city) return res.status(400).json({ message: "city parameter is required" });

    const { ingestEnvironmentForCity } = require("./environmentController");
    const envData = await ingestEnvironmentForCity(city);
    if (!envData) return res.status(500).json({ message: "Atmospheric synchronization failed" });

    let risk = 0;
    const aqi = Number(envData.aqi || 0);
    const rainfall = Number(envData.rainfall || 0);
    const temp = Number(envData.temperature || 0);
    const humidity = Number(envData.humidity || 0);
    const windSpeed = Number(envData.wind_speed || 0);

    risk += (aqi / 300) * 40;
    risk += (rainfall / 50) * 25;
    if (temp > 40 || temp < 5) risk += 15;
    risk += (humidity / 100) * 10;
    risk += (windSpeed / 20) * 10;

    const riskScore = Math.min(Math.round(risk), 100);
    const disruptionProbability = (riskScore / 100) * 100;
    const weeklyIncome = Number(req.user.weekly_income || 5000);
    const lossEstimation = Number(((riskScore / 100) * weeklyIncome * 0.3).toFixed(2));

    if (riskScore > 50) {
      const { createNotification } = require("../models/notificationModel");
      await createNotification({
        userId: req.user.id,
        type: 'risk_alert',
        message: `🚨 HIGH RISK: Disruption probability at ${disruptionProbability.toFixed(0)}% in ${city}. Predicted loss: ₹${lossEstimation}.`
      }).catch(e => console.error("Notification failed:", e.message));
    }

    return res.json({
      riskScore,
      disruptionProbability,
      lossEstimation,
      confidence: Math.round(90 + (riskScore / 10)),
      recommendation: riskScore > 60 ? "🚨 RISK ELEVATED" : riskScore > 30 ? "⚠️ MONITORING" : "✅ OPTIMAL",
      metrics: { aqi, rainfall, temperature: temp, humidity },
      risk: {
        risk_score: riskScore,
        risk_level: riskScore > 60 ? "HIGH" : riskScore > 30 ? "MEDIUM" : "LOW",
        confidence: Math.round(90 + (riskScore / 10)),
        estimated_loss: lossEstimation
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getForecast(req, res, next) {
  try {
    const userId = Number(req.params.user_id || req.user?.id);
    const user = await getUserInternal(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const event = await getLatestEventByCity(user.city);
    const aiPayload = {
      rainfall: event ? Number(event.rainfall) : 0,
      aqi: event ? Number(event.aqi) : 50,
      temperature: 26,
      platform: user.platform || "unknown",
      avg_daily_deliveries: user.avg_daily_deliveries || 20,
      earnings_per_delivery: user.earnings_per_delivery || 40
    };

    const mlBaseUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const aiResult = await axios.post(`${mlBaseUrl}/predict`, aiPayload).catch(() => ({ data: { estimated_loss: 0, risk_score: 0 } }));
    const data = aiResult.data;

    const weekly_income = (user.avg_daily_deliveries || 20) * (user.earnings_per_delivery || 40) * 7;
    return res.json({
      weekly_income,
      estimated_loss: data.estimated_loss,
      net_protected_forecast: Math.round(weekly_income - data.estimated_loss),
      risk_score: data.risk_score,
    });
  } catch (error) {
    return next(error);
  }
}

async function fraudCheck(req, res, next) {
  try {
    const userId = Number(req.params.user_id);
    const eventId = Number(req.params.event_id);
    const result = await detectFraud(userId, eventId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function getFraudOverview(req, res, next) {
  try {
    const userId = req.user.id;
    const { getFraudLogsByUserId } = require("../models/fraudModel");
    const fraudData = await getFraudLogsByUserId(userId);
    const logs = fraudData.map(f => ({
      message: (f.type || "").replace(/_/g, ' ').toUpperCase() + ": " + (f.metadata?.reason || "Anomaly detected"),
      level: f.severity === 'high' ? 'error' : 'warning',
      event_type: f.type,
      created_at: f.timestamp,
      city: f.metadata?.actual || req.user.city || "Primary Node",
      severity: f.severity
    }));
    const high = fraudData.filter(f => f.severity === 'high').length;
    const medium = fraudData.filter(f => f.severity === 'medium').length;
    const low = fraudData.filter(f => f.severity === 'low').length;
    const riskScore = Math.min(100, (high * 40) + (medium * 20) + (low * 10));
    return res.json({ riskScore, alerts: logs, suspiciousCount: logs.length });
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

async function analyzeCityRisk(req, res, next) {
  try {
    const { city, weekly_income } = req.body;
    const event = await getLatestEventByCity(city);
    const rainfall = event ? Number(event.rainfall) : 0;
    const aqi = event ? Number(event.aqi) : 50;
    const riskScore = Math.min(100, Math.round((rainfall / 100) * 50 + (aqi / 500) * 50));
    return res.json({
      city,
      risk: { risk_level: riskScore > 60 ? "HIGH" : "LOW", risk_score: riskScore },
      weather: { rainfall, aqi }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getRiskScore,
  predictRisk,
  getForecast,
  fraudCheck,
  getFraudOverview,
  flaggedPayouts,
  analyzeCityRisk
};
