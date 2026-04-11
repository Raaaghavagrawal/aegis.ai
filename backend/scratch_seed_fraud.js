require('dotenv').config();
const { createFraudLog } = require("./models/fraudModel");

async function seed() {
  const userId = 7; // Raghav Agrawal
  
  const samples = [
    {
      userId,
      type: "duplicate_claim",
      severity: "high",
      metadata: { claimId: "CLM-902", attempt_count: 2 }
    },
    {
      userId,
      type: "location_mismatch",
      severity: "medium",
      metadata: { expected: "Mathura", actual: "Delhi", distance_diff: "145km" }
    },
    {
      userId,
      type: "high_frequency",
      severity: "low",
      metadata: { period: "10s", frequency_avg: 4.5 }
    }
  ];

  for (const s of samples) {
    await createFraudLog(s);
  }

  console.log("Seeded 3 fraud logs for user 7");
  process.exit(0);
}

seed();
