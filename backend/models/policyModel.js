const { pool } = require("../config/db");

async function createPolicy({
  userId,
  premium,
  coveragePercentage,
  startDate,
  status = "active",
}) {
  const [result] = await pool.execute(
    `INSERT INTO policies (user_id, premium, coverage_percentage, start_date, status)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, premium, coveragePercentage, startDate, status]
  );
  return result.insertId;
}

async function getPoliciesByUserId(userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM policies WHERE user_id = ? ORDER BY id DESC",
    [userId]
  );
  return rows;
}

async function hasActivePolicy(userId) {
  const [rows] = await pool.execute(
    `SELECT id FROM policies
     WHERE user_id = ? AND status = 'active'
     LIMIT 1`,
    [userId]
  );
  return Boolean(rows.length);
}

async function syncPolicyTableSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS policies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      premium DECIMAL(10,2) NOT NULL,
      coverage_percentage DECIMAL(5,2) NOT NULL,
      start_date DATE NOT NULL,
      status ENUM('active', 'inactive', 'cancelled') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_policy_user_ref
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function updatePolicyCoverage(id, userId, newCoverage, newPremium) {
  const [result] = await pool.execute(
    `UPDATE policies 
     SET coverage_percentage = ?, premium = ? 
     WHERE id = ? AND user_id = ? AND status = 'active'`,
    [newCoverage, newPremium, id, userId]
  );
  return result.affectedRows > 0;
}

async function deactivateAllUserPolicies(userId) {
  await pool.execute(
    "UPDATE policies SET status = 'inactive' WHERE user_id = ? AND status = 'active'",
    [userId]
  );
}

module.exports = {
  syncPolicyTableSchema,
  createPolicy,
  getPoliciesByUserId,
  hasActivePolicy,
  updatePolicyCoverage,
  deactivateAllUserPolicies,
};
