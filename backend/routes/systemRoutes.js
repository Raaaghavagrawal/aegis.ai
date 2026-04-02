const express = require("express");
const { getSystemStatus, getSystemLogs } = require("../controllers/systemController");

const router = express.Router();

router.get("/status", getSystemStatus);
router.get("/logs", getSystemLogs);

module.exports = router;
