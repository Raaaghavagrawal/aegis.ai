const axios = require("axios");
const { preprocessEnvironmentData } = require("./dataPreprocessor");
const { buildFeatureVector } = require("./featureEngineering");
const { logModelPrediction } = require("../models/modelLogModel");

const AI_SERVICE_URL = process.env.ML_URL || process.env.AI_SERVICE_URL;

if (!AI_SERVICE_URL) {
  console.warn("[WARNING] ML_URL / AI_SERVICE_URL is not set. AI predictions may fail in production.");
}

async function getIntegratedAIPredictions(rawFeatures) {
  try {
    const city = rawFeatures.city || "Mumbai";

    // 1. Data Quality: Preprocess raw input
    const preprocessed = preprocessEnvironmentData(city, {
      rainfall: parseFloat(rawFeatures.rainfall || 0),
      aqi: parseFloat(rawFeatures.aqi || 0),
      temperature: parseFloat(rawFeatures.temperature || 25),
    });

    // 2. Feature Engineering: Enrich data
    const features = buildFeatureVector(preprocessed, {
      platform: rawFeatures.platform,
      avg_daily_deliveries: rawFeatures.avg_daily_deliveries,
      earnings_per_delivery: rawFeatures.earnings_per_delivery,
    });

    // 3. Call AI Service
    const response = await axios.post(`${AI_SERVICE_URL}/predict`, features);
    const aiData = response.data;

    // 4. Post-process for Compound Risk
    const contributing_factors = [];
    if (features.rainfall > 50) contributing_factors.push("Rainfall");
    if (features.aqi > 300) contributing_factors.push("Air Quality");
    if (features.temperature > 40) contributing_factors.push("Extreme Heat");

    const compound_risk = (contributing_factors.length >= 2) ? "HIGH" : "NORMAL";

    // 5. Continuous Learning: Log prediction to DB
    await logModelPrediction(city, "integrated_risk_loss", features, aiData);

    return {
      ...aiData,
      compound_risk,
      contributing_factors
    };
  } catch (err) {
    console.error("API ERROR:", err.message);
    // Safe Fallback logic
    return {
      risk_score: 50,
      confidence: 0.5,
      risk_level: "Medium",
      loss_percentage: 15,
      estimated_loss: 300,
      anomaly: false,
      compound_risk: "NORMAL",
      contributing_factors: [],
      explanation: "AI service connection failed. Using fallback vectors."
    };
  }
}

/**
 * Predict disruption risk probability and level using ML service (Legacy wrapper)
 */
async function predictDisruption(features) {
  const result = await getIntegratedAIPredictions(features);
  return {
    probability: result.risk_score / 100,
    confidence: result.confidence,
    risk_level: result.risk_level,
    explanation: result.explanation
  };
}

/**
 * Estimate expected income loss using ML service (Legacy wrapper)
 */
async function predictLoss(features) {
  const result = await getIntegratedAIPredictions(features);
  return {
    loss_percentage: result.loss_percentage,
    estimated_loss_per_day: result.estimated_loss
  };
}

/**
 * Detect operational anomalies using ML service (Legacy wrapper)
 */
async function detectAnomaly(payoutData) {
  const result = await getIntegratedAIPredictions({
      earnings_per_delivery: payoutData.amount, // Approximate map
      avg_daily_deliveries: 1 // Default to trigger inference
  });
  return {
    is_anomaly: result.anomaly,
    anomaly_score: result.anomaly ? -1 : 1
  };
}

module.exports = {
  getIntegratedAIPredictions,
  predictDisruption,
  predictLoss,
  detectAnomaly
};
