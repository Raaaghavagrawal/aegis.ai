require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Database & Model Initializations
const { testDbConnection } = require("./config/db");
const { syncUserTableSchema } = require("./models/userModel");
const { syncEventTableSchema } = require("./models/eventModel");
const { syncPolicyTableSchema } = require("./models/policyModel");
const { syncPayoutTableSchema } = require("./models/payoutModel");
const { syncWalletTableSchema } = require("./models/walletModel");
const { syncSystemLogTableSchema } = require("./models/systemLogModel");
const { syncFraudTableSchema } = require("./models/fraudModel");
const { syncNotificationTableSchema } = require("./models/notificationModel");
const { startCronJobs } = require("./jobs/cronJob");

// Route Management
const authRoutes = require("./routes/authRoutes");
const policyRoutes = require("./routes/policyRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const riskRoutes = require("./routes/riskRoutes");
const environmentRoutes = require("./routes/environmentRoutes");
const statsRoutes = require("./routes/statsRoutes");
const systemRoutes = require("./routes/systemRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { router: userRoutes, protect: protectMiddleware } = require("./routes/userRoutes");

const app = express();

// Global Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

// System & Health Endpoints
app.get("/", (req, res) => res.send("GigShield Intelligence API Running"));
app.get("/health", (req, res) => res.json({ status: "active", engine: "v1.4.2" }));

// User Context Context
app.get("/api/me", protectMiddleware, (req, res) => {
  res.json({
    status: "authenticated",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      city: req.user.city,
      platform: req.user.platform,
      weekly_income: req.user.weekly_income,
      coverage_percentage: req.user.coverage_percentage
    }
  });
});

// Feature Routing
app.use("/api/auth", authRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/environment", environmentRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

// Insurance & Financial Processing
app.use("/api/payouts", payoutRoutes);
app.use("/api/claims", payoutRoutes); // Alias
app.use("/api/wallet", payoutRoutes); // Alias

// AI Intelligence & Risk Engineering
app.use("/api/risk", riskRoutes);
app.use("/api/fraud", riskRoutes);    // Consolidated into riskRoutes
app.use("/api/ai", riskRoutes);       // Consolidated into riskRoutes
app.use("/api/analyze", riskRoutes);  // Consolidated into riskRoutes

// UI/UX Aliases
app.use("/api/dashboard/overview", statsRoutes);
app.use("/api/user/profile", userRoutes);
app.use("/dashboard", statsRoutes);

// Error Handling
app.use((req, res) => res.status(404).json({ message: "Node route not found" }));
app.use((err, req, res, next) => {
  console.error("[CRITICAL_SYSTEM_ERROR]", err);
  res.status(err.status || 500).json({
    message: err.message || "Primary intelligence engine failure",
  });
});

// Server Initialization
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
    await syncFraudTableSchema();
    await syncNotificationTableSchema();
    
    app.listen(PORT, () => {
      console.log(`[gigshield-api] Synchronized on http://localhost:${PORT}`);
      startCronJobs();
    });
  } catch (error) {
    console.error("[STARTUP_FAILURE]", error.message);
    process.exit(1);
  }
}

startServer();
