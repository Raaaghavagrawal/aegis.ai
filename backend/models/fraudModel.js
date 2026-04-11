const { pool } = require("../config/db");

async function syncFraudTableSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS fraud_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      severity ENUM('low', 'medium', 'high') DEFAULT 'low',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function getFraudLogsByUserId(userId) {
  await syncFraudTableSchema();
  const [rows] = await pool.execute(
    `SELECT * FROM fraud_logs WHERE user_id = ? ORDER BY timestamp DESC`,
    [userId]
  );
  return rows;
}

async function createFraudLog({ userId, type, severity, metadata }) {
  await syncFraudTableSchema();
  const [result] = await pool.execute(
    `INSERT INTO fraud_logs (user_id, type, severity, metadata) VALUES (?, ?, ?, ?)`,
    [userId, type, severity, JSON.stringify(metadata || {})]
  );
  return result.insertId;
}

module.exports = {
  syncFraudTableSchema,
  getFraudLogsByUserId,
  createFraudLog
};
