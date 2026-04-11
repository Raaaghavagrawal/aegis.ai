const express = require("express");
const {
  getRiskScore: getAiRiskScore,
  fraudCheck,
  getFraudOverview,
  flaggedPayouts,
  getForecast,
} = require("../controllers/riskController");

const { protect } = require("./userRoutes");

const router = express.Router();

router.get("/fraud-check", protect, getFraudOverview);
router.get("/risk-score/:city", protect, getAiRiskScore);
router.get("/fraud-check/:user_id/:event_id", protect, fraudCheck);
router.get("/flagged-payouts", protect, flaggedPayouts);
router.get("/forecast/:user_id", protect, getForecast);

module.exports = router;
