require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { testDbConnection } = require("./config/db");
const { syncEventTableSchema } = require("./models/eventModel");
const { syncPayoutTableSchema } = require("./models/payoutModel");
const { syncWalletTableSchema } = require("./models/walletModel");
const { syncSystemLogTableSchema } = require("./models/systemLogModel");
const { startCronJobs } = require("./jobs/cronJob");

const authRoutes = require("./routes/authRoutes");
const policyRoutes = require("./routes/policyRoutes");
const eventRoutes = require("./routes/eventRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const riskRoutes = require("./routes/riskRoutes");
const analyzeRoutes = require("./routes/analyzeRoutes");
const environmentRoutes = require("./routes/environmentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const statsRoutes = require("./routes/statsRoutes");
const systemRoutes = require("./routes/systemRoutes");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/environment", environmentRoutes); // Added integrated environment route
app.use("/api/system", systemRoutes); // Added system monitoring route
app.use("/payout", payoutRoutes);
app.use("/wallet", payoutRoutes);
app.use("/payouts", payoutRoutes);
app.use("/api/risk-score", riskRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/ai", aiRoutes);
app.use("/api/stats", statsRoutes);
app.use("/dashboard", statsRoutes); // Exact requirement from latest prompt


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await testDbConnection();
    await syncEventTableSchema();
    await syncPayoutTableSchema();
    await syncWalletTableSchema();
    await syncSystemLogTableSchema();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      startCronJobs();
    });
  } catch (error) {
    console.error("Failed to start server:", error.message || error);
    if (error.code) console.error("DB error code:", error.code);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

startServer();
