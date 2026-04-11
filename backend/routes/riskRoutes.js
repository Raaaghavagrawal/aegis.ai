const express = require("express");
const { 
  getRiskScore, 
  predictRisk, 
  getForecast, 
  fraudCheck, 
  getFraudOverview, 
  flaggedPayouts,
  analyzeCityRisk
} = require("../controllers/riskController");
const { protect } = require("./userRoutes");

const router = express.Router();

router.use(protect);

// Risk & Prediction
router.post("/analyze", analyzeCityRisk);
router.get("/predict", predictRisk);
router.get("/score/:city", getRiskScore);
router.get("/forecast/:user_id", getForecast);

// Fraud & Integrity
router.get("/fraud-overview", getFraudOverview);
router.get("/fraud-check/:user_id/:event_id", fraudCheck);
router.get("/flagged-payouts", flaggedPayouts);

module.exports = router;
