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

  // C. Abnormal Pattern
  const payoutCount7d = await countUserPayoutsLast7Days(userId);
  if (payoutCount7d > 3) {
    flagged = true;
    reason = "Abnormal pattern: >3 payouts in last 7 days";
    await createFraudLog({ userId, type: 'high_frequency', severity: 'medium', metadata: { count: payoutCount7d, reason } });
  }

  // D. Location Mismatch
  if ((user.city || "").toLowerCase() !== (event.city || "").toLowerCase()) {
    flagged = true;
    reason = `Location mismatch: user in ${user.city}, event in ${event.city}`;
    await createFraudLog({ userId, type: 'location_mismatch', severity: 'medium', metadata: { user_city: user.city, event_city: event.city, reason } });
  }

  // E. Inactive User
  const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const inactive = !lastActive || Date.now() - lastActive.getTime() > sevenDaysMs;
  if (inactive) {
    // Note: Don't always flag as full fraud, but log as anomaly
    await createFraudLog({ userId, type: 'inactive_pattern', severity: 'low', metadata: { last_active: lastActive } });
  }

  // Record activity for all attempts
  await touchUserActivity(userId);

  return { flagged, reason };
}

module.exports = {
  detectFraud,
};

