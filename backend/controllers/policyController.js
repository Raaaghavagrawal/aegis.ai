const { createPolicy, getPoliciesByUserId } = require("../models/policyModel");

async function createPolicyForUser(req, res, next) {
  try {
    const userId = req.user.id;
    const { premium, coverage_percentage, start_date, status } = req.body;

    if (!premium || !coverage_percentage || !start_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const policyId = await createPolicy({
      userId,
      premium: Number(premium),
      coveragePercentage: Number(coverage_percentage),
      startDate: start_date,
      status: status || "active",
    });

    return res.status(201).json({
      message: "Policy created successfully",
      policy_id: policyId,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyPolicies(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      console.error("[Policy Controller] User not found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }
    const userId = req.user.id;
    console.log(`[Policy Controller] Fetching policies for user_id: ${userId}`);
    
    const policies = await getPoliciesByUserId(userId);
    console.log(`[Policy Controller] Found ${policies ? policies.length : 0} policies`);
    
    return res.json({ 
      success: true,
      policies: policies || [] 
    });
  } catch (error) {
    console.error("[Policy Controller Error]", error.message);
    return res.status(500).json({ 
      message: "Failed to fetch policy data",
      error: error.message 
    });
  }
}

async function scalePolicy(req, res, next) {
  try {
    const userId = req.user.id;
    const { policyId, newCoverage, newPremium } = req.body;

    const { updatePolicyCoverage } = require("../models/policyModel");
    const success = await updatePolicyCoverage(policyId, userId, newCoverage, newPremium);

    if (!success) {
      return res.status(404).json({ message: "Active policy not found or update failed" });
    }

    return res.json({ message: "Protection scaled successfully" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPolicyForUser,
  getMyPolicies,
  scalePolicy,
};
