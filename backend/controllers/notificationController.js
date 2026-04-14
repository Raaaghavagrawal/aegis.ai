const { getNotificationsByUserId, markNotificationAsRead } = require("../models/notificationModel");

async function getNotifications(req, res, next) {
  try {
    const userId = req.user?.id;
    console.log(`[NOTIFICATIONS] Fetching for userId: ${userId}`);
    
    if (!userId) {
      console.warn("[NOTIFICATIONS] Unauthorized request: userId missing");
      return res.status(401).json({ message: "Authentication required" });
    }

    const notifications = await getNotificationsByUserId(userId);
    
    // Inject Live Weather Broadcast
    const { getLatestEventByCity } = require("../models/eventModel");
    const event = await getLatestEventByCity(req.user.city || "Mumbai");
    
    if (event) {
      notifications.unshift({
        id: 'env-live',
        message: `Env Update: AQI - ${Math.round(event.aqi)} | Rain - ${Number(event.rainfall).toFixed(2)}mm`,
        event_type: 'environment_sync',
        type: 'live_broadcast',
        created_at: new Date().toISOString(),
        is_read: false
      });
    }

    console.log(`[NOTIFICATIONS] Found ${notifications.length} records`);
    return res.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_ERROR]", error.message);
    return next(error);
  }
}

async function readNotification(req, res, next) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    await markNotificationAsRead(id, userId);
    return res.json({ message: "Notification marked as read" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNotifications,
  readNotification
};
