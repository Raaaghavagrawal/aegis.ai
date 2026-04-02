const express = require("express");
const { getUnifiedEnvironmentData } = require("../controllers/environmentController");

const router = express.Router();

// GET /api/environment/:city (Combined data + real-time trigger)
router.get("/:city", getUnifiedEnvironmentData);

module.exports = router;
