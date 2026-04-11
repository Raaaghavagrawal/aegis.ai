const { pool } = require("../config/db");

async function syncNotificationTableSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('risk_alert', 'payout', 'fraud_alert', 'system') DEFAULT 'system',
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function getNotificationsByUserId(userId, limit = 20) {
  await syncNotificationTableSchema();
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ${safeLimit}`,
    [userId]
  );
  return rows;
}

async function createNotification({ userId, type, message }) {
  await syncNotificationTableSchema();
  const [result] = await pool.execute(
    `INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)`,
    [userId, type, message]
  );
  return result.insertId;
}

async function markNotificationAsRead(id, userId) {
  await pool.execute(
    `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
}

module.exports = {
  syncNotificationTableSchema,
  getNotificationsByUserId,
  createNotification,
  markNotificationAsRead
};
