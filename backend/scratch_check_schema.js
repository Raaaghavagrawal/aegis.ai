require('dotenv').config();
const { pool } = require("./config/db");

async function check() {
  try {
    const [rows] = await pool.execute("SHOW TABLES");
    console.log("TABLES:", rows.map(r => Object.values(r)[0]));
    
    // Also check system_logs
    const [logs] = await pool.execute("DESCRIBE system_logs").catch(() => [[]]);
    if (logs.length) console.log("system_logs schema:", logs.map(l => `${l.Field} (${l.Type})`));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
