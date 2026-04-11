const { getDashboardStats } = require("../models/statsModel");
const { getLatestEventByCity } = require("../models/eventModel");
const { getIntegratedAIPredictions } = require("../services/aiService");
const { getWalletByUserId } = require("../models/walletModel");
const { pool } = require("../config/db");
const { getRecentLogs } = require("../models/systemLogModel");

async function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    const city = req.user.city || "Mumbai";

    const { ingestEnvironmentForCity } = require("../controllers/environmentController");
    await ingestEnvironmentForCity(city).catch(e => console.error("Auto-ingest failed:", e.message));

    const [globalStats, wallet] = await Promise.all([
      getDashboardStats(),
      getWalletByUserId(userId)
    ]);

    const eventData = await getLatestEventByCity(city);
    const aiResponse = await getIntegratedAIPredictions({
      city,
      platform: req.user.platform,
      avg_daily_deliveries: req.user.avg_daily_deliveries || 20,
      earnings_per_delivery: req.user.earnings_per_delivery || 40,
      rainfall: eventData?.rainfall || 0,
      aqi: eventData?.aqi || 50,
      temperature: eventData?.temperature || 25,
    });

    const [eventsToday] = await pool.execute(
      `SELECT HOUR(created_at) as hour, AVG(aqi) as avg_aqi, AVG(rainfall) as avg_rainfall, AVG(temperature) as avg_temp 
       FROM events WHERE city = ? AND event_date = CURDATE() GROUP BY HOUR(created_at) ORDER BY hour ASC`,
      [city]
    );

    const currentHour = new Date().getHours();
    const history = [];
    for (let h = 0; h <= currentHour; h++) {
      const match = eventsToday.find(e => e.hour === h);
      history.push({
        time: `${String(h).padStart(2, '0')}:00`,
        aqi: match ? Math.round(match.avg_aqi) : 0,
        rainfall: match ? Number(match.avg_rainfall).toFixed(2) : 0,
        temperature: match ? Number(match.avg_temp).toFixed(2) : 25,
        timestamp: new Date().setHours(h, 0, 0, 0)
      });
    }

    const weeklyIncome = req.user.weekly_income || 5000;
    const estimatedLoss = aiResponse?.estimated_loss || 0;
    
    return res.json({
      user: { id: userId, name: req.user.name, city, wallet_balance: wallet.balance, weekly_income: weeklyIncome },
      ai_metrics: { ...aiResponse, weekly_income: weeklyIncome, net_protected_forecast: Math.max(0, weeklyIncome - estimatedLoss) },
      environment: { rainfall: eventData?.rainfall || 0, aqi: eventData?.aqi || 50, temperature: eventData?.temperature || 25, city },
      history,
      system_stats: globalStats
    });
  } catch (error) {
    return next(error);
  }
}

async function getSystemStatus(req, res, next) {
  try {
    const [eventRows] = await pool.query("SELECT COUNT(*) as count FROM events WHERE created_at >= CURDATE()");
    const [payoutRows] = await pool.query("SELECT COUNT(*) as count FROM payouts WHERE created_at >= CURDATE()");
    const [userRows] = await pool.query("SELECT COUNT(*) as count FROM users");
    
    const uptimeSecs = process.uptime();
    const uptimeDisplay = uptimeSecs > 3600 
      ? `${Math.floor(uptimeSecs / 3600)}h ${Math.floor((uptimeSecs % 3600) / 60)}m` 
      : `${Math.floor(uptimeSecs / 60)}m`;

    return res.json({
      uptime: uptimeDisplay,
      events_today: eventRows[0].count,
      payouts_today: payoutRows[0].count,
      total_users: userRows[0].count,
      system_health: "Healthy",
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
}

async function getSystemLogs(req, res, next) {
  try {
    const logs = await getRecentLogs(10);
    return res.json(logs);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getStats,
  getSystemStatus,
  getSystemLogs
};
