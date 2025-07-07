const express = require("express")
const router = express.Router()
const admin = require("../controllers/adminController")

// Dashboard routes
router.get("/stats", admin.getStats)
router.get("/status", admin.getStatus)
router.get("/activity", admin.getActivity)

// User management routes
router.get("/users", admin.getUsers)
router.delete("/users/:userId", admin.deleteUser)

// Bot management routes
router.get("/bots/status", admin.getBotStatus)
router.post("/bots/:botName/run", admin.runBot)

// Cron job management routes
router.post("/cron/restart", admin.restartCronJobs)
router.post("/cron/:botName/pause", admin.pauseCronJob)

// Logs management routes
router.get("/logs", admin.getLogs)
router.delete("/logs", admin.clearLogs)

// Trap management routes
router.get("/traps", admin.getTrapData)

// Settings management routes
router.post("/settings", admin.saveSettings)

module.exports = router
