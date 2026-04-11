const express = require("express");
const { getNotifications, readNotification } = require("../controllers/notificationController");
const { protect } = require("./userRoutes");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/:id/read", readNotification);

module.exports = router;
