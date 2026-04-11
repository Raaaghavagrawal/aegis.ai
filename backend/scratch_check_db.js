require("dotenv").config();
const { pool } = require("./config/db");
async function check() {
  try {
    const [users] = await pool.execute("SELECT id, name, email FROM users");
    console.log("USERS:", JSON.stringify(users, null, 2));
    const [policies] = await pool.execute("SELECT * FROM policies");
    console.log("POLICIES:", JSON.stringify(policies, null, 2));
    const [payouts] = await pool.execute("SELECT * FROM payouts");
    console.log("PAYOUTS:", JSON.stringify(payouts, null, 2));
    const [events] = await pool.execute("SELECT * FROM events");
    console.log("EVENTS:", JSON.stringify(events, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
