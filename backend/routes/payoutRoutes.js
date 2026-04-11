const express = require("express");
const { protect } = require("./userRoutes");
const {
  runPayoutManual,
  simulatePayout,
  getWallet,
  getUserPayouts,
} = require("../controllers/payoutController");

const router = express.Router();

router.post("/run", protect, runPayoutManual);
router.post("/simulate", protect, simulatePayout);

// Standarized /me endpoints
router.get("/me", protect, (req, res, next) => {
  // baseUrl would be something like "/api/wallet" or "/api/claims"
  if (req.originalUrl.includes('wallet')) {
    return getWallet(req, res, next);
  }
  return getUserPayouts(req, res, next);
});

// Backward compatibility
router.get("/:user_id", protect, (req, res, next) => {
  if (req.originalUrl.includes('wallet')) {
    return getWallet(req, res, next);
  }
  return getUserPayouts(req, res, next);
});

module.exports = router;
