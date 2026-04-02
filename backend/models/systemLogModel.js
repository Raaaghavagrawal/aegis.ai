const { pool } = require("../config/db");

async function syncSystemLogTableSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      level ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
}

async function addSystemLog(eventType, message, level = 'info') {
  await pool.execute(
    "INSERT INTO system_logs (event_type, message, level) VALUES (?, ?, ?)",
    [eventType, message, level]
  );
}

async function getRecentLogs(limit = 10) {
  const [rows] = await pool.execute(
    "SELECT * FROM system_logs ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows;
}

module.exports = {
  syncSystemLogTableSchema,
  addSystemLog,
  getRecentLogs,
};
