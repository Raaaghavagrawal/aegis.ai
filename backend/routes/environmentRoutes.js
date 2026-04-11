const express = require("express");
const { 
  getUnifiedEnvironmentData, 
  getHistoricalEnvironmentData,
  fetchAndStoreEnvironment,
  getLatestEvent,
  simulateEvent
} = require("../controllers/environmentController");
const { protect } = require("./userRoutes");

const router = express.Router();

router.get("/:city/history", protect, getHistoricalEnvironmentData);
router.get("/fetch-environment/:city", protect, fetchAndStoreEnvironment);
router.get("/:city", protect, getUnifiedEnvironmentData);
router.get("/latest/:city", protect, getLatestEvent);
router.post("/simulate", protect, simulateEvent);

module.exports = router;
