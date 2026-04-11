const mysql = require("mysql2/promise");

// The pool can take the DATABASE_URL connection string directly as its configuration.
// We then append the required SSL settings for Railway compatibility.
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testDbConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
    console.log(`[DB] Connected to Railway MySQL 🚀 (Public URL)`);
  } catch (err) {
    console.error("DB connection failed:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testDbConnection,
};
