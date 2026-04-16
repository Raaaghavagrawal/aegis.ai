const { getLatestTriggeredEventByCity, createEvent, getEventById } = require("../models/eventModel");
const { getUsersByCityWithActivePolicy, getAllActiveUsersWithGeo } = require("../models/userModel");
const { hasDuplicatePayout, createPayout } = require("../models/payoutModel");
const { detectFraud } = require("./fraudService");
const { addBalance } = require("./walletService");

async function processPayoutsForCity(city) {
  const event = await getLatestTriggeredEventByCity(city);
  if (!event) {
    return { message: "No triggered event found for this city", total_users: 0, total_payout: 0 };
  }

  const eligibleUsers = await getUsersByCityWithActivePolicy(city);
  return await processEligibleUsers(eligibleUsers, event);
}

async function processPayoutsByGeo(eventId, radiusKm = 5) {
  const event = await getEventById(eventId);
  if (!event || !event.triggered) {
    return { message: "Invalid or non-triggered event", total_users: 0, total_payout: 0 };
  }

  const allGeoUsers = await getAllActiveUsersWithGeo();
  
  // Calculate distance for each user and filter
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const eligibleUsers = allGeoUsers.filter(u => {
    const dist = calculateDistance(u.latitude, u.longitude, event.latitude, event.longitude);
    return dist <= radiusKm;
  }).map(u => ({
    user_id: u.id,
    weekly_income: u.weekly_income,
    policy_id: u.policy_id,
    coverage_percentage: u.coverage_percentage
  }));

  return await processEligibleUsers(eligibleUsers, event);
}

async function processEligibleUsers(eligibleUsers, event) {
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
        message: `✅ Hyper-Local Payout Credited: ₹${payoutAmount.toFixed(2)} added to your wallet for the node disruption at ${event.city}.` 
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
  await addSystemLog("payout_process", `Disbursed ₹${totalPayout} to ${processedCount} users for event ${event.id}`, "success");

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
  processPayoutsByGeo,
  simulateEventAndPayout
};
