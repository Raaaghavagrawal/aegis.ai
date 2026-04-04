require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { testDbConnection } = require("./config/db");
const { syncUserTableSchema } = require("./models/userModel");
const { syncEventTableSchema } = require("./models/eventModel");
const { syncPolicyTableSchema } = require("./models/policyModel");
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
const { router: userRoutes, protect: protectMiddleware } = require("./routes/userRoutes");

const app = express();

// Allow direct browser calls to the API when the Vite dev server uses VITE_API_BASE_URL (CORS bypass for proxy issues).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const { FRONTEND_URL } = process.env;
  const allowedProductionOrigins = [
    "https://gigshield-o25b.vercel.app", // Your current Vercel frontend
    FRONTEND_URL,
  ].filter(Boolean);

  if (
    origin &&
    (/^http:\/\/localhost(:\d+)?$/i.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin) ||
      allowedProductionOrigins.includes(origin))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

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
app.use("/api/users", userRoutes);
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

const PORT = Number(process.env.PORT || 5001);

async function startServer() {
  try {
    await testDbConnection();
    await syncUserTableSchema();
    await syncEventTableSchema();
    await syncPolicyTableSchema();
    await syncWalletTableSchema();
    await syncPayoutTableSchema();
    await syncSystemLogTableSchema();
    app.listen(PORT, () => {
      console.log(
        `[gigshield-api] Express listening on http://localhost:${PORT} (PORT=${PORT})`
      );
      console.log(`[gigshield-api] Health: http://localhost:${PORT}/health`);
      console.log(
        `[gigshield-api] Example: http://localhost:${PORT}/api/system/status`
      );
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
