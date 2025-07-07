const User = require("../models/User")
const fs = require("fs")
const path = require("path")
const logger = require("../utils/logger")

// Import all bot functions
const runInstagramBot = require("../bots/instagramBot")
const runTwitterBot = require("../bots/twitterBot")
const runTikTokBot = require("../bots/tiktokBot")
const runTelegramBot = require("../bots/telegramBot")
const runFacebookBot = require("../bots/facebookBot")
const runRedditBot = require("../bots/redditBot")
const runGmbBot = require("../bots/gmbBot")
const runPinterestBot = require("../bots/pinterestBot")

const botFunctions = {
  instagram: runInstagramBot,
  twitter: runTwitterBot,
  tiktok: runTikTokBot,
  telegram: runTelegramBot,
  facebook: runFacebookBot,
  reddit: runRedditBot,
  gmb: runGmbBot,
  pinterest: runPinterestBot,
}

// Dashboard stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeBots = Object.keys(botFunctions).length

    // Count trap triggers from logs
    const logPath = path.join(__dirname, "../logs/trapEvents.log")
    let trapTriggers = 0

    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, "utf8")
      trapTriggers = (logContent.match(/Trap triggered/g) || []).length
    }

    res.json({
      totalUsers,
      activeBots,
      trapTriggers,
      cronJobs: 8,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" })
  }
}

// System status
exports.getStatus = async (req, res) => {
  try {
    const mongoose = require("mongoose")

    res.json({
      mongodb: mongoose.connection.readyState === 1,
      server: true,
      cronJobs: true,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to get status" })
  }
}

// Recent activity
exports.getActivity = async (req, res) => {
  try {
    const logPath = path.join(__dirname, "../logs/trapEvents.log")
    const activities = []

    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, "utf8")
      const lines = logContent.split("\n").filter((line) => line.trim())

      // Get last 10 log entries
      const recentLines = lines.slice(-10).reverse()

      recentLines.forEach((line) => {
        const match = line.match(/\[(.*?)\] INFO: (.*)/)
        if (match) {
          activities.push({
            timestamp: match[1],
            message: match[2],
          })
        }
      })
    }

    res.json(activities)
  } catch (error) {
    res.status(500).json({ error: "Failed to get activity" })
  }
}

// User management
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -magicToken")
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: "Failed to get users" })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params
    await User.findByIdAndDelete(userId)
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" })
  }
}

// Bot management
exports.getBotStatus = async (req, res) => {
  try {
    const status = {}

    Object.keys(botFunctions).forEach((bot) => {
      status[bot] = {
        status: "Idle",
        lastRun: null,
      }
    })

    res.json(status)
  } catch (error) {
    res.status(500).json({ error: "Failed to get bot status" })
  }
}

exports.runBot = async (req, res) => {
  try {
    const { botName } = req.params

    if (!botFunctions[botName]) {
      return res.status(400).json({ error: "Invalid bot name" })
    }

    logger.info(`[Admin] Running ${botName} bot manually`)

    // Run bot asynchronously
    botFunctions[botName]().catch((err) => {
      logger.error(`[Admin] ${botName} bot error: ${err.message}`)
    })

    res.json({ message: `${botName} bot started successfully` })
  } catch (error) {
    res.status(500).json({ error: "Failed to run bot" })
  }
}

// Cron job management
exports.restartCronJobs = async (req, res) => {
  try {
    logger.info("[Admin] Cron jobs restart requested")
    // In a real implementation, you would restart the cron jobs here
    res.json({ message: "Cron jobs restarted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to restart cron jobs" })
  }
}

exports.pauseCronJob = async (req, res) => {
  try {
    const { botName } = req.params
    logger.info(`[Admin] Pausing ${botName} cron job`)
    // In a real implementation, you would pause the specific cron job here
    res.json({ message: `${botName} cron job paused` })
  } catch (error) {
    res.status(500).json({ error: "Failed to pause cron job" })
  }
}

// Logs management
exports.getLogs = async (req, res) => {
  try {
    const { filter } = req.query
    const logPath = path.join(__dirname, "../logs/trapEvents.log")

    if (!fs.existsSync(logPath)) {
      return res.json({ content: "No logs available" })
    }

    let content = fs.readFileSync(logPath, "utf8")

    // Filter logs if specified
    if (filter && filter !== "all") {
      const lines = content.split("\n")
      const filteredLines = lines.filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
      content = filteredLines.join("\n")
    }

    res.json({ content })
  } catch (error) {
    res.status(500).json({ error: "Failed to get logs" })
  }
}

exports.clearLogs = async (req, res) => {
  try {
    const logPath = path.join(__dirname, "../logs/trapEvents.log")
    fs.writeFileSync(logPath, "")
    logger.info("[Admin] Logs cleared")
    res.json({ message: "Logs cleared successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to clear logs" })
  }
}

// Trap management
exports.getTrapData = async (req, res) => {
  try {
    const logPath = path.join(__dirname, "../logs/trapEvents.log")
    let magicLoginTriggers = 0
    const recentEvents = []

    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, "utf8")
      const lines = logContent.split("\n").filter((line) => line.trim())

      // Count magic login triggers
      magicLoginTriggers = lines.filter(
        (line) => line.includes("Trap triggered") && line.includes("magic-login"),
      ).length

      // Get recent trap events
      const trapLines = lines.filter((line) => line.includes("Trap triggered")).slice(-5)

      trapLines.forEach((line) => {
        const match = line.match(/\[(.*?)\].*platform=(\w+).*user=([^,\s]+)/)
        if (match) {
          recentEvents.push({
            timestamp: match[1],
            platform: match[2],
            user: match[3],
          })
        }
      })
    }

    res.json({
      magicLoginTriggers,
      recentEvents,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to get trap data" })
  }
}

// Settings management
exports.saveSettings = async (req, res) => {
  try {
    const settings = req.body
    logger.info("[Admin] Settings updated")

    // In a real implementation, you would save these settings to a database
    // or update environment variables

    res.json({ message: "Settings saved successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to save settings" })
  }
}
