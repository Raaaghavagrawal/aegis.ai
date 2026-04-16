const { pool } = require("../config/db");

async function syncFraudTableSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS fraud_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      zone_id VARCHAR(50) NULL,
      type VARCHAR(50) NOT NULL,
      severity ENUM('low', 'medium', 'high') DEFAULT 'low',
      anomaly_score DECIMAL(8,2) DEFAULT 1.00,
      flagged BOOLEAN DEFAULT FALSE,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure columns exist (for migration)
  const { ensureColumn } = require("./eventModel");
  await ensureColumn("fraud_logs", "zone_id", "VARCHAR(50) NULL");
  await ensureColumn("fraud_logs", "anomaly_score", "DECIMAL(8,2) DEFAULT 1.00");
  await ensureColumn("fraud_logs", "flagged", "BOOLEAN DEFAULT FALSE");
}

async function getFraudLogsByUserId(userId) {
  await syncFraudTableSchema();
  const [rows] = await pool.execute(
    `SELECT * FROM fraud_logs WHERE user_id = ? ORDER BY timestamp DESC`,
    [userId]
  );
  return rows;
}

async function createFraudLog({ userId, zoneId, type, severity, anomalyScore, flagged, metadata }) {
  await syncFraudTableSchema();
  const [result] = await pool.execute(
    `INSERT INTO fraud_logs (user_id, zone_id, type, severity, anomaly_score, flagged, metadata) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, zoneId, type, severity, anomalyScore, flagged, JSON.stringify(metadata || {})]
  );
  return result.insertId;
}

async function getZoneStats(zoneId) {
  if (!zoneId) return { total_users: 0, claims_count: 0, claim_ratio: 0 };
  
  const [userCount] = await pool.execute(
    "SELECT COUNT(*) AS count FROM users WHERE city = (SELECT city FROM events WHERE zone_id = ? LIMIT 1)",
    [zoneId]
  );
  
  const [claimCount] = await pool.execute(
    "SELECT COUNT(*) AS count FROM payouts WHERE user_id IN (SELECT id FROM users WHERE city = (SELECT city FROM events WHERE zone_id = ? LIMIT 1))",
    [zoneId]
  );

  const total = userCount[0].count || 0;
  const claims = claimCount[0].count || 0;
  
  return {
    total_users: total,
    claims_count: claims,
    claim_ratio: total > 0 ? claims / total : 0
  };
}

async function getUserRecentActivity(userId) {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) as count FROM payouts WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
    [userId]
  );
  return { monthly_claims: rows[0].count };
}

module.exports = {
  syncFraudTableSchema,
  getFraudLogsByUserId,
  createFraudLog,
  getZoneStats,
  getUserRecentActivity
};
