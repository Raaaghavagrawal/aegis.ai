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

async function syncEventTableSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      city VARCHAR(120) NOT NULL,
      rainfall DECIMAL(8,2) NOT NULL,
      aqi DECIMAL(8,2) NOT NULL,
      event_date DATE NOT NULL,
      triggered BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await ensureColumn("events", "temperature", "DECIMAL(8,2) NOT NULL DEFAULT 0");
  await ensureColumn("events", "pollution_level", "VARCHAR(50) NULL");
  await ensureColumn("events", "humidity", "DECIMAL(8,2) NOT NULL DEFAULT 0");
  await ensureColumn("events", "wind_speed", "DECIMAL(8,2) NOT NULL DEFAULT 0");
}

async function createEvent({
  city,
  rainfall,
  temperature,
  aqi,
  pollutionLevel,
  humidity = 0,
  windSpeed = 0,
  eventDate,
  triggered,
}) {
  const [result] = await pool.execute(
    `INSERT INTO events (city, rainfall, temperature, aqi, pollution_level, humidity, wind_speed, event_date, triggered)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [city, rainfall, temperature, aqi, pollutionLevel, humidity, windSpeed, eventDate, triggered]
  );
  return result.insertId;
}

async function getLatestEventByCity(city) {
  const [rows] = await pool.execute(
    `SELECT * FROM events
     WHERE city = ?
     ORDER BY event_date DESC, id DESC
     LIMIT 1`,
    [city]
  );
  return rows[0] || null;
}

async function getRecentEventsByCity(city, limit = 10) {
  const limitValue = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const [rows] = await pool.query(
    `SELECT * FROM events
     WHERE city = ?
     ORDER BY event_date DESC, created_at DESC, id DESC
     LIMIT ${limitValue}`,
    [city]
  );
  const data = Array.isArray(rows) ? rows : [];
  console.log("ENV HISTORY DATA:", data);
  return data;
}

async function getEventById(eventId) {
  const [rows] = await pool.execute("SELECT * FROM events WHERE id = ?", [
    eventId,
  ]);
  return rows[0] || null;
}

async function getLatestTriggeredEventByCity(city) {
  const [rows] = await pool.execute(
    `SELECT * FROM events
     WHERE city = ? AND triggered = TRUE
     ORDER BY event_date DESC, id DESC
     LIMIT 1`,
    [city]
  );
  return rows[0] || null;
}

module.exports = {
  syncEventTableSchema,
  createEvent,
  getLatestEventByCity,
  getRecentEventsByCity,
  getLatestTriggeredEventByCity,
  getEventById,
};
