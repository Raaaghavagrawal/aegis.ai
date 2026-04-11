const express = require("express");
const { protect } = require("./userRoutes");
const {
  createPolicyForUser,
  getMyPolicies,
  scalePolicy,
} = require("../controllers/policyController");

const router = express.Router();

router.post("/", protect, createPolicyForUser);
router.post("/scale", protect, scalePolicy);
router.get("/me", protect, getMyPolicies);

module.exports = router;
