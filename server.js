require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const trapRoutes = require("./routes/trapRoutes");
const adminRoutes = require("./routes/adminRoutes");
const startCronJobs = require("./cron/scheduleBots");
const cleanupInactive = require("./cron/cleanupInactive");
const dispatcherCron = require("./cron/dispatcher");
const reminderCron = require("./cron/reminderScheduler"); // ✅ match file name
const blogCron = require("./cron/blogCron");

const logger = require("./utils/logger");
const path = require("path");

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/trap", trapRoutes);
app.use("/admin", adminRoutes);

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`[Server] Listening on port ${PORT}`);
});

//  Start cron jobs
cleanupInactive();
startCronJobs();
dispatcherCron();
reminderCron();
blogCron(); 
