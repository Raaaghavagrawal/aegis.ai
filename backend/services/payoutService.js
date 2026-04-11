const { getLatestTriggeredEventByCity, createEvent } = require("../models/eventModel");
const { getUsersByCityWithActivePolicy } = require("../models/userModel");
const { hasDuplicatePayout, createPayout } = require("../models/payoutModel");
const { detectFraud } = require("./fraudService");
const { addBalance } = require("./walletService");

async function processPayoutsForCity(city) {
  const event = await getLatestTriggeredEventByCity(city);
  if (!event) {
    return { message: "No triggered event found for this city", total_users: 0, total_payout: 0 };
  }

  const eligibleUsers = await getUsersByCityWithActivePolicy(city);
  let totalPayout = 0;
  let processedCount = 0;

  for (const user of eligibleUsers) {
    // Prevent duplicates
    const duplicate = await hasDuplicatePayout({ userId: user.user_id, eventId: event.id });
    if (duplicate) {
      console.log("⚠️ Skipped duplicate payout:", user.user_id);
      continue;
    }

    // Calculate payout
    const payoutAmount = (Number(user.weekly_income) * Number(user.coverage_percentage)) / 100;
    
    // Fraud check
    const fraudResult = await detectFraud(user.user_id, event.id);
    const status = fraudResult.flagged ? "under_review" : "credited";

    // Insert payout record
    await createPayout({
      userId: user.user_id,
      policyId: user.policy_id,
      eventId: event.id,
      amount: payoutAmount,
      flagged: fraudResult.flagged,
      reason: fraudResult.reason,
      status: status
    });

    // Update wallet if not under review
    const { createNotification } = require("../models/notificationModel");
    if (status === "credited") {
      await addBalance(user.user_id, payoutAmount);
      await createNotification({ 
        userId: user.user_id, 
        type: 'payout', 
        message: `✅ Payout Credited: ₹${payoutAmount.toFixed(2)} added to your wallet for the ${event.city} environmental event.` 
      }).catch(e => console.error("Notification failed:", e.message));
    } else {
      await createNotification({ 
        userId: user.user_id, 
        type: 'fraud_alert', 
        message: `⚠️ Payout Audit: Your disbursement for ${event.city} node is under manual review for potential record drift.` 
      }).catch(e => console.error("Notification failed:", e.message));
    }

    console.log("💰 Payout processed for user:", user.user_id);
    totalPayout += payoutAmount;
    processedCount++;
  }

  const { addSystemLog } = require("../models/systemLogModel");
  await addSystemLog("payout_process", `Disbursed ₹${totalPayout} to ${processedCount} users in ${city}`, "success");

  return {
    message: "Payouts processed",
    total_users: processedCount,
    total_payout: totalPayout
  };
}

async function simulateEventAndPayout(city, rainfall, aqi) {
  const triggered = rainfall > 50 || aqi > 300;
  const eventDate = new Date().toISOString().split('T')[0];
  
  await createEvent({
    city,
    rainfall,
    temperature: 25,
    aqi,
    pollutionLevel: aqi > 300 ? "Severe" : "Moderate",
    eventDate,
    triggered
  });

  if (triggered) {
    return await processPayoutsForCity(city);
  } else {
    return { message: "Event created but not triggered", total_users: 0, total_payout: 0 };
  }
}

module.exports = {
  processPayoutsForCity,
  simulateEventAndPayout
};
