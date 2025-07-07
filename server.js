require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const authRoutes = require("./routes/authRoutes")
const trapRoutes = require("./routes/trapRoutes")
const adminRoutes = require("./routes/adminRoutes")
const startCronJobs = require("./cron/scheduleBots")
const cleanupInactive = require("./cron/cleanupInactive")
const logger = require("./utils/logger")
const path = require("path")

const app = express()
app.use(express.json())

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("[MongoDB] Connected")
  })
  .catch((err) => {
    logger.error("[MongoDB] Connection error:", err)
  })

app.use("/auth", authRoutes)
app.use("/trap", trapRoutes)
app.use("/admin", adminRoutes)

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"))
})

app.use(express.static("public"))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info(`[Server] Listening on port ${PORT}`)
})

// Start cron job for cleaning up inactive users
cleanupInactive()
// Start cron jobs for all bots
startCronJobs()
