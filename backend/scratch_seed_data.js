require("dotenv").config();
const { pool } = require("./config/db");
async function seed() {
  try {
    const userId = 7; // Based on previous USERS check
    const [result] = await pool.execute(
      `INSERT INTO policies (user_id, premium, coverage_percentage, start_date, status)
       VALUES (?, ?, ?, NOW(), ?)`,
      [userId, 250.00, 85.00, 'active']
    );
    console.log("SEEDED POLICY ID:", result.insertId);
    
    // Also seed a wallet if not exists
    const [wallets] = await pool.execute("SELECT * FROM wallets WHERE user_id = ?", [userId]);
    if (wallets.length === 0) {
       await pool.execute("INSERT INTO wallets (user_id, balance) VALUES (?, ?)", [userId, 5000.00]);
       console.log("SEEDED WALLET");
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
seed();
