// Admin Dashboard JavaScript

let currentSection = "dashboard"
let refreshInterval

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation()
  loadDashboardData()
  startAutoRefresh()
})

// Navigation handling
function initializeNavigation() {
  const menuItems = document.querySelectorAll(".menu-item")

  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault()
      const section = this.getAttribute("data-section")
      switchSection(section)
    })
  })
}

function switchSection(section) {
  // Update active menu item
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active")
  })
  document.querySelector(`[data-section="${section}"]`).classList.add("active")

  // Update active content section
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active")
  })
  document.getElementById(section).classList.add("active")

  // Update page title
  const titles = {
    dashboard: "Dashboard",
    users: "User Management",
    bots: "Bot Management",
    cron: "Cron Jobs",
    logs: "System Logs",
    traps: "Trap Management",
    settings: "Settings",
  }
  document.getElementById("page-title").textContent = titles[section]

  currentSection = section

  // Load section-specific data
  loadSectionData(section)
}

// Load data for specific sections
function loadSectionData(section) {
  switch (section) {
    case "dashboard":
      loadDashboardData()
      break
    case "users":
      loadUsers()
      break
    case "bots":
      loadBotStatus()
      break
    case "logs":
      loadLogs()
      break
    case "traps":
      loadTrapData()
      break
  }
}

// Dashboard functions
async function loadDashboardData() {
  try {
    showLoading()

    // Load stats
    const stats = await fetchAPI("/admin/stats")
    updateStats(stats)

    // Load system status
    const status = await fetchAPI("/admin/status")
    updateSystemStatus(status)

    // Load recent activity
    const activity = await fetchAPI("/admin/activity")
    updateRecentActivity(activity)
  } catch (error) {
    showToast("Failed to load dashboard data", "error")
  } finally {
    hideLoading()
  }
}

function updateStats(stats) {
  document.getElementById("total-users").textContent = stats.totalUsers || 0
  document.getElementById("active-bots").textContent = stats.activeBots || 0
  document.getElementById("trap-triggers").textContent = stats.trapTriggers || 0
}

function updateSystemStatus(status) {
  document.getElementById("mongo-status").textContent = status.mongodb ? "Connected" : "Disconnected"
  document.getElementById("mongo-status").className = `status-badge ${status.mongodb ? "connected" : "disconnected"}`

  document.getElementById("server-status").textContent = "Running"
  document.getElementById("server-status").className = "status-badge connected"

  document.getElementById("cron-status").textContent = status.cronJobs ? "Active" : "Inactive"
  document.getElementById("cron-status").className = `status-badge ${status.cronJobs ? "connected" : "disconnected"}`
}

function updateRecentActivity(activities) {
  const container = document.getElementById("recent-activity")
  container.innerHTML = ""

  activities.forEach((activity) => {
    const item = document.createElement("div")
    item.className = "activity-item"
    item.innerHTML = `
            <i class="fas fa-robot"></i>
            <span>${activity.message}</span>
            <small>${formatTime(activity.timestamp)}</small>
        `
    container.appendChild(item)
  })
}

// User management functions
async function loadUsers() {
  try {
    showLoading()
    const users = await fetchAPI("/admin/users")
    updateUsersTable(users)
  } catch (error) {
    showToast("Failed to load users", "error")
  } finally {
    hideLoading()
  }
}

function updateUsersTable(users) {
  const tbody = document.getElementById("users-table-body")
  tbody.innerHTML = ""

  users.forEach((user) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${user._id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${formatTime(user.lastActive)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return

  try {
    showLoading()
    await fetchAPI(`/admin/users/${userId}`, "DELETE")
    showToast("User deleted successfully")
    loadUsers()
  } catch (error) {
    showToast("Failed to delete user", "error")
  } finally {
    hideLoading()
  }
}

async function deleteInactiveUsers() {
  if (!confirm("Are you sure you want to delete all inactive users (30+ days)?")) return

  try {
    showLoading()
    const result = await fetchAPI("/auth/delete-inactive", "DELETE")
    showToast(`Deleted ${result.deleted} inactive users`)
    loadUsers()
  } catch (error) {
    showToast("Failed to delete inactive users", "error")
  } finally {
    hideLoading()
  }
}

// Bot management functions
async function loadBotStatus() {
  try {
    const status = await fetchAPI("/admin/bots/status")
    updateBotStatus(status)
  } catch (error) {
    showToast("Failed to load bot status", "error")
  }
}

function updateBotStatus(status) {
  Object.keys(status).forEach((bot) => {
    const statusElement = document.getElementById(`${bot}-status`)
    if (statusElement) {
      statusElement.textContent = status[bot].status
      statusElement.className = `bot-status ${status[bot].status.toLowerCase()}`
    }
  })
}

async function runBot(botName) {
  try {
    showLoading()
    document.getElementById(`${botName}-status`).textContent = "Running"

    await fetchAPI(`/admin/bots/${botName}/run`, "POST")
    showToast(`${botName} bot executed successfully`)

    setTimeout(() => {
      document.getElementById(`${botName}-status`).textContent = "Idle"
    }, 5000)
  } catch (error) {
    showToast(`Failed to run ${botName} bot`, "error")
    document.getElementById(`${botName}-status`).textContent = "Error"
  } finally {
    hideLoading()
  }
}

async function runAllBots() {
  if (!confirm("Are you sure you want to run all bots?")) return

  const bots = ["instagram", "twitter", "tiktok", "facebook", "reddit", "telegram", "pinterest", "gmb"]

  for (const bot of bots) {
    await runBot(bot)
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds between bots
  }
}

function viewBotLogs(botName) {
  switchSection("logs")
  document.getElementById("log-filter").value = botName
  filterLogs()
}

// Cron job functions
async function restartCronJobs() {
  try {
    showLoading()
    await fetchAPI("/admin/cron/restart", "POST")
    showToast("Cron jobs restarted successfully")
  } catch (error) {
    showToast("Failed to restart cron jobs", "error")
  } finally {
    hideLoading()
  }
}

async function pauseCronJob(botName) {
  try {
    await fetchAPI(`/admin/cron/${botName}/pause`, "POST")
    showToast(`${botName} cron job paused`)
  } catch (error) {
    showToast(`Failed to pause ${botName} cron job`, "error")
  }
}

// Logs functions
async function loadLogs() {
  try {
    const logs = await fetchAPI("/admin/logs")
    document.getElementById("logs-content").textContent = logs.content || "No logs available"
  } catch (error) {
    document.getElementById("logs-content").textContent = "Failed to load logs"
  }
}

function filterLogs() {
  const filter = document.getElementById("log-filter").value
  loadLogs(filter)
}

function refreshLogs() {
  loadLogs()
  showToast("Logs refreshed")
}

async function clearLogs() {
  if (!confirm("Are you sure you want to clear all logs?")) return

  try {
    await fetchAPI("/admin/logs", "DELETE")
    document.getElementById("logs-content").textContent = "Logs cleared"
    showToast("Logs cleared successfully")
  } catch (error) {
    showToast("Failed to clear logs", "error")
  }
}

// Trap functions
async function loadTrapData() {
  try {
    const trapData = await fetchAPI("/admin/traps")
    updateTrapData(trapData)
  } catch (error) {
    showToast("Failed to load trap data", "error")
  }
}

function updateTrapData(data) {
  document.getElementById("magic-login-triggers").textContent = data.magicLoginTriggers || 0

  const eventsContainer = document.getElementById("trap-events")
  eventsContainer.innerHTML = ""

  if (data.recentEvents) {
    data.recentEvents.forEach((event) => {
      const eventDiv = document.createElement("div")
      eventDiv.className = "activity-item"
      eventDiv.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                <span>Trap triggered: ${event.platform} - ${event.user}</span>
                <small>${formatTime(event.timestamp)}</small>
            `
      eventsContainer.appendChild(eventDiv)
    })
  }
}

async function testTrap() {
  try {
    showLoading()
    await fetchAPI("/trap/test", "POST", { user: "admin@test.com" })
    showToast("Test trap triggered successfully")
    loadTrapData()
  } catch (error) {
    showToast("Failed to trigger test trap", "error")
  } finally {
    hideLoading()
  }
}

function viewTrapLogs(trapType) {
  switchSection("logs")
  document.getElementById("log-filter").value = "trap"
  filterLogs()
}

// Settings functions
function togglePassword(inputId) {
  const input = document.getElementById(inputId)
  const button = input.nextElementSibling
  const icon = button.querySelector("i")

  if (input.type === "password") {
    input.type = "text"
    icon.className = "fas fa-eye-slash"
  } else {
    input.type = "password"
    icon.className = "fas fa-eye"
  }
}

async function saveSettings() {
  try {
    showLoading()

    const settings = {
      mongoUri: document.getElementById("mongo-uri").value,
      telegramToken: document.getElementById("telegram-token").value,
      twitterToken: document.getElementById("twitter-token").value,
      emailNotifications: document.getElementById("email-notifications").checked,
      telegramNotifications: document.getElementById("telegram-notifications").checked,
      smsNotifications: document.getElementById("sms-notifications").checked,
    }

    await fetchAPI("/admin/settings", "POST", settings)
    showToast("Settings saved successfully")
  } catch (error) {
    showToast("Failed to save settings", "error")
  } finally {
    hideLoading()
  }
}

// Utility functions
async function fetchAPI(endpoint, method = "GET", data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(endpoint, options)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

function showLoading() {
  document.getElementById("loading-overlay").style.display = "flex"
}

function hideLoading() {
  document.getElementById("loading-overlay").style.display = "none"
}

function showToast(message, type = "success") {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.textContent = message

  document.getElementById("toast-container").appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 5000)
}

function formatTime(timestamp) {
  if (!timestamp) return "Never"
  return new Date(timestamp).toLocaleString()
}

function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    if (currentSection === "dashboard") {
      loadDashboardData()
    } else if (currentSection === "bots") {
      loadBotStatus()
    }
  }, 30000) // Refresh every 30 seconds
}

// Stop auto-refresh when page is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(refreshInterval)
  } else {
    startAutoRefresh()
  }
})
