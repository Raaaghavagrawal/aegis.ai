const cron = require("node-cron");
const { ingestEnvironmentForCity } = require("../controllers/environmentController");

function getPredefinedCities() {
  const raw = process.env.PREDEFINED_CITIES || "Delhi,Mumbai,Bangalore";
  return raw
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

function startCronJobs() {
  const cities = getPredefinedCities();
  if (!cities.length) {
    console.warn("[CRON] No cities configured for hourly fetch");
    return;
  }

  cron.schedule("0 * * * *", async () => {
    console.log(`[CRON] Hourly environment fetch started for: ${cities.join(", ")}`);
    for (const city of cities) {
      try {
        await ingestEnvironmentForCity(city);
      } catch (error) {
        console.error(`[CRON_ERROR] city=${city} reason=${error.message}`);
      }
    }
    console.log("[CRON] Hourly environment fetch completed");
  });

  console.log("[CRON] Scheduled hourly environment ingestion job");
}

module.exports = {
  startCronJobs,
};
