const { createFraudLog } = require("../models/fraudModel");
const { hasActivePolicy } = require("../models/policyModel");
const { getUserInternal, syncUserTableSchema, touchUserActivity } = require("../models/userModel");
const { getEventById } = require("../models/eventModel");
const {
  hasDuplicatePayout,
  countUserPayoutsLast7Days,
} = require("../models/payoutModel");

async function detectFraud(userId, eventId) {
  await syncUserTableSchema();

  const user = await getUserInternal(userId);
  if (!user) {
    return { flagged: true, reason: "User not found" };
  }

  const event = await getEventById(eventId);
  if (!event) {
    return { flagged: true, reason: "Event not found" };
  }

  let flagged = false;
  let reason = null;

  // A. No Active Policy
  const active = await hasActivePolicy(userId);
  if (!active) {
    flagged = true;
    reason = "No active policy";
    await createFraudLog({ userId, type: 'policy_violation', severity: 'high', metadata: { reason } });
  }

  // B. Duplicate Payout
  const duplicate = await hasDuplicatePayout({ userId, eventId });
  if (duplicate) {
    flagged = true;
    reason = "Duplicate claim detected";
    await createFraudLog({ userId, type: 'duplicate_claim', severity: 'high', metadata: { eventId, reason } });
  }

  // C. Peer Group Pattern Analysis (Aggregate Logic)
  const { getZoneStats, getUserRecentActivity } = require("../models/fraudModel");
  const zoneStats = await getZoneStats(event.zone_id);
  const userActivity = await getUserRecentActivity(userId);
  
  // Anomaly score: user behavior vs zone average
  const zoneAvgRatio = zoneStats.claim_ratio || 0.01; // Avoid division by zero
  const anomalyScore = userActivity.monthly_claims / (zoneAvgRatio * 10); // Normalized
  
  if (userActivity.monthly_claims > 0 && zoneStats.claim_ratio < 0.05) {
     flagged = true;
     reason = "Peer discrepancy: Individual claim in low-incident aggregate zone";
     await createFraudLog({ 
       userId, 
       zoneId: event.zone_id, 
       type: 'peer_anomaly', 
       severity: 'high', 
       anomalyScore, 
       flagged: true, 
       metadata: { 
         user_monthly: userActivity.monthly_claims, 
         zone_ratio: zoneStats.claim_ratio,
         reason 
       } 
     });
  }

  // D. Geo-Aided Location Check
  if (user.latitude && user.longitude && event.latitude && event.longitude) {
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };
    const dist = calculateDistance(user.latitude, user.longitude, event.latitude, event.longitude);
    const MOBILITY_THRESHOLD = 15; // Allow 15km for inter-city mobility

    if (dist > MOBILITY_THRESHOLD) {
       flagged = true;
       reason = `Mobility Limit Exceeded: User is ${dist.toFixed(2)}km away from disruption node (Threshold: ${MOBILITY_THRESHOLD}km)`;
       await createFraudLog({ 
         userId, 
         zoneId: event.zone_id, 
         type: 'geo_drift', 
         severity: 'medium', 
         anomalyScore: 1.5, 
         flagged: true, 
         metadata: { distance: dist, reason } 
       });
    }
  } else if ((user.city || "").toLowerCase() !== (event.city || "").toLowerCase()) {
    // Only flag if GPS is missing AND city doesn't match
    flagged = true;
    reason = `City mismatch (GPS Unavailable): User registered in ${user.city}, event in ${event.city}`;
    await createFraudLog({ 
      userId, 
      zoneId: event.zone_id, 
      type: 'location_mismatch', 
      severity: 'medium', 
      anomalyScore: 2.0,
      flagged: true,
      metadata: { user_city: user.city, event_city: event.city, reason } 
    });
  }

  // E. Inactive User Patterns
  const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const inactive = !lastActive || Date.now() - lastActive.getTime() > sevenDaysMs;
  if (inactive) {
    await createFraudLog({ 
      userId, 
      zoneId: event.zone_id, 
      type: 'inactive_pattern', 
      severity: 'low', 
      anomalyScore: 1.2,
      flagged: false,
      metadata: { last_active: lastActive } 
    });
  }

  // F. High Frequency Analysis
  const payoutCount = await countUserPayoutsLast7Days(userId);
  if (payoutCount > 5) {
     flagged = true;
     reason = `High Frequency: User has ${payoutCount} payouts in the last 7 days. Limit is 5.`;
     await createFraudLog({ 
       userId, 
       zoneId: event.zone_id, 
       type: 'high_frequency', 
       severity: 'medium', 
       anomalyScore: 2.5,
       flagged: true,
       metadata: { last_7_days: payoutCount, reason } 
     });
  }

  // Record activity for all attempts
  await touchUserActivity(userId);

  return { flagged, reason, anomalyScore };
}

module.exports = {
  detectFraud,
};
