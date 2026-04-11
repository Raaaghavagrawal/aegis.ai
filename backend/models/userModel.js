const { pool } = require("../config/db");

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT 1 AS ok
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return Boolean(rows.length);
}

async function ensureColumn(tableName, columnName, columnDefinitionSql) {
  const exists = await columnExists(tableName, columnName);
  if (exists) return;
  try {
    await pool.execute(
      `ALTER TABLE \`${tableName}\`
       ADD COLUMN \`${columnName}\` ${columnDefinitionSql}`
    );
  } catch (error) {
    if (error && error.code === "ER_DUP_FIELDNAME") return;
    throw error;
  }
}

async function syncUserTableSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      city VARCHAR(120) NOT NULL,
      platform VARCHAR(120) NOT NULL,
      weekly_income DECIMAL(10,2) NOT NULL,
      last_active_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await ensureColumn("users", "last_active_at", "TIMESTAMP NULL DEFAULT NULL");
  await ensureColumn("users", "avg_daily_deliveries", "INT DEFAULT 20");
  await ensureColumn("users", "earnings_per_delivery", "INT DEFAULT 40");
  await ensureColumn("users", "notify_risk", "BOOLEAN DEFAULT TRUE");
  await ensureColumn("users", "notify_payout", "BOOLEAN DEFAULT TRUE");
  await ensureColumn("users", "notify_audit", "BOOLEAN DEFAULT TRUE");
  await ensureColumn("users", "notify_weekly", "BOOLEAN DEFAULT FALSE");
}

async function createUser({
  name,
  email,
  passwordHash,
  city,
  platform,
  weeklyIncome,
  avgDailyDeliveries = 20,
  earningsPerDelivery = 40,
}) {
  await syncUserTableSchema();
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password, city, platform, weekly_income, last_active_at, avg_daily_deliveries, earnings_per_delivery)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [name, email, passwordHash, city, platform, weeklyIncome, avgDailyDeliveries, earningsPerDelivery]
  );
  return result.insertId;
}

async function getUserByEmail(email) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0] || null;
}

async function getUserById(id) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, city, platform, weekly_income, avg_daily_deliveries, earnings_per_delivery, notify_risk, notify_payout, notify_audit, notify_weekly FROM users WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

async function getUserInternal(id) {
  await syncUserTableSchema();
  const [rows] = await pool.execute(
    "SELECT id, name, email, city, platform, weekly_income, last_active_at, avg_daily_deliveries, earnings_per_delivery, notify_risk, notify_payout, notify_audit, notify_weekly FROM users WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

async function touchUserActivity(userId) {
  await syncUserTableSchema();
  await pool.execute("UPDATE users SET last_active_at = NOW() WHERE id = ?", [
    userId,
  ]);
}

async function getUsersByCityWithActivePolicy(city) {
  const [rows] = await pool.execute(
    `SELECT 
       u.id AS user_id,
       u.name,
       u.city,
       u.weekly_income,
       p.id AS policy_id,
       p.coverage_percentage
     FROM users u
     INNER JOIN policies p ON p.user_id = u.id
     WHERE u.city = ?
       AND p.status = 'active'`,
    [city]
  );
  return rows;
}

async function updateUserProfile(id, { name, email, city, platform, weekly_income, notify_risk, notify_payout, notify_audit, notify_weekly }) {
  await syncUserTableSchema();
  await pool.execute(
    `UPDATE users 
     SET name = ?, email = ?, city = ?, platform = ?, weekly_income = ?, 
         notify_risk = ?, notify_payout = ?, notify_audit = ?, notify_weekly = ?
     WHERE id = ?`,
    [name, email, city, platform, weekly_income, notify_risk, notify_payout, notify_audit, notify_weekly, id]
  );
  return getUserById(id);
}

module.exports = {
  syncUserTableSchema,
  createUser,
  getUserByEmail,
  getUserById,
  getUserInternal,
  touchUserActivity,
  getUsersByCityWithActivePolicy,
  updateUserProfile,
};
