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

    // 1. Non-blocking ingestion (background update)
    const { ingestEnvironmentForCity } = require("../controllers/environmentController");
    ingestEnvironmentForCity(city).catch(e => console.error("[BG_INGEST_FAILED]", e.message));

    // 2. Parallel Database Fetching
    const [
      globalStats, 
      wallet, 
      eventData, 
      [eventsToday], 
      [policyRows]
    ] = await Promise.all([
      getDashboardStats(),
      getWalletByUserId(userId),
      getLatestEventByCity(city),
      pool.execute(
        `SELECT HOUR(created_at) as hour, AVG(aqi) as avg_aqi, AVG(rainfall) as avg_rainfall, AVG(temperature) as avg_temp 
         FROM events 
         WHERE city = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
         GROUP BY HOUR(created_at) ORDER BY hour ASC`,
        [city]
      ),
      pool.execute(
        "SELECT * FROM policies WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1",
        [userId]
      )
    ]);

    // 3. AI Intelligence (depends on latest event data)
    const aiResponse = await getIntegratedAIPredictions({
      city,
      platform: req.user.platform,
      avg_daily_deliveries: req.user.avg_daily_deliveries || 20,
      earnings_per_delivery: req.user.earnings_per_delivery || 40,
      rainfall: eventData?.rainfall || 0,
      aqi: eventData?.aqi || 50,
      temperature: eventData?.temperature || 25,
    });

    const currentHour = new Date().getHours();
    const history = [];
    for (let i = 23; i >= 0; i--) {
      const h = (currentHour - i + 24) % 24;
      const match = eventsToday.find(e => e.hour === h);
      
      // Realistic synthetic fallbacks for detailed visualization
      const fallbackAqi = 45 + ((userId + h * 9) % 30);
      const fallbackTemp = 24 + Math.sin((h - 8) * (Math.PI / 12)) * 6;

      history.push({
        time: `${String(h).padStart(2, '0')}:00`,
        aqi: match ? Math.round(match.avg_aqi) : Math.round(fallbackAqi),
        rainfall: match ? Number(match.avg_rainfall).toFixed(2) : "0.00",
        temperature: match ? Number(match.avg_temp).toFixed(2) : fallbackTemp.toFixed(1),
        timestamp: new Date(new Date().setHours(h, 0, 0, 0)).getTime()
      });
    }

    const weeklyIncome = req.user.weekly_income || 5000;
    const estimatedLoss = aiResponse?.estimated_loss || 0;
    const activePolicy = policyRows[0] || null;
    const coverageMult = activePolicy ? (activePolicy.coverage_percentage / 100) : 0;
    const protectedAmount = estimatedLoss * coverageMult;
    
    return res.json({
      user: { id: userId, name: req.user.name, city, wallet_balance: wallet.balance, weekly_income: weeklyIncome },
      ai_metrics: { 
        ...aiResponse, 
        weekly_income: weeklyIncome, 
        net_protected_forecast: Math.max(0, weeklyIncome - estimatedLoss + protectedAmount) 
      },
      environment: { rainfall: eventData?.rainfall || 0, aqi: eventData?.aqi || 50, temperature: eventData?.temperature || 25, city },
      history,
      system_stats: globalStats,
      active_policy: activePolicy
    });
  } catch (error) {
    console.error("[STATS_CONTROLLER_ERROR]", error);
    return res.status(500).json({ error: error.message, stack: error.stack });
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
