
```markdown
# Default-Automation

## 🚀 Overview

**Default-Automation** is a Node.js-based modular automation framework for executing bots across multiple social media platforms. It includes:

- API-based automation (Axios-powered)
- Scheduled bot execution (via cron)
- Trap detection endpoints
- Multi-channel alerting (email, SMS, WhatsApp, Telegram)
- MongoDB logging for traceability

---

## 🧠 Key Features

- ✅ **Axios-Based Bots**: Automate tasks on Instagram, Twitter, TikTok, Telegram, Reddit via API calls (no Puppeteer).
- ✅ **Trap Triggering**: Trap suspicious login attempts and notify administrators.
- ✅ **Multichannel Notifications**: Email, Twilio (SMS, WhatsApp), and Telegram support.
- ✅ **MongoDB Activity Logging**: All bot actions are logged to a central MongoDB database.
- ✅ **Modular Structure**: Add new bots, notification services, or scheduling logic with minimal effort.


---

## ⚙️ Setup Instructions

### 1. Requirements

- Node.js v18+
- MongoDB URI (Atlas or local)
- Access tokens from your social platforms (Graph API, Reddit API, etc.)

### 2. Installation

```bash
git clone https://github.com/your-org/default-automation.git
cd default-automation
npm install
````

---

## 🔐 .env Configuration (Sample)

```env
# Express Server
PORT=3000

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/default-automation

# Notification (Email via Gmail)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASS=your_app_password
NOTIFY_EMAIL=recipient@example.com

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=123456789

# Twilio (SMS/WhatsApp)
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_SMS_FROM=+1234567890
ALERT_SMS_TO=+2547xxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
ALERT_WHATSAPP_TO=whatsapp:+2547xxxxxxx

# Instagram Graph API
FB_ACCESS_TOKEN=EAAGxxxxx...
IG_BUSINESS_ID=1784xxxxxxxxx
FB_PAGE_ID=123456789

# Reddit
REDDIT_ACCESS_TOKEN=...
REDDIT_USER=...

# TikTok (uses cookie header)
TIKTOK_AUTH_HEADER=tt_webid=...; sessionid=...

# Twitter
TWITTER_BEARER_TOKEN=...
TWITTER_USER_ID=...

# Telegram Messaging
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

---

## 🧪 Usage

### Start the Server

```bash
node server.js
```

* Express will launch on `http://localhost:PORT`
* Traps and bots will be initialized
* Cron jobs will run scheduled tasks for each platform

---

## 🔐 Trap API

### Trigger a Trap Manually

```http
POST /api/v1/trap/:platform
Content-Type: application/json

{
  "user": "attacker@example.com"
}
```

* Triggers a decoy login event and sends alerts via Telegram, Email, and SMS.
* Logs the event to `logs/trapEvents.log` and MongoDB.

---

## 🤖 Bot Examples

Each bot supports:

* Auto-posting (text/media)
* Auto-liking
* Auto-commenting
* Auto-reply to DMs/comments
* MongoDB logging

Bots live in `bots/` directory and can be run independently or via cron.

---

## 📊 Mongo Logging

All bot activity is logged to a MongoDB database for auditability.

Collection example: `bot_logs.instagram`

```json
{
  "action": "post",
  "mediaId": "17921312312",
  "timestamp": "2025-07-04T10:15:00Z"
}
```

Utility file: `utils/mongoLogger.js`

---

## 📅 Cron Scheduling

Jobs are scheduled using `node-cron` in `cron/scheduleBots.js`. Example:

```js
cron.schedule('*/30 * * * *', runInstagramBot); // every 30 min
```

---

## 🧩 Extending Functionality

You can add:

* New bots in `/bots` (just export a function)
* New routes in `/routes`
* New notification methods in `services/notificationService.js`
* New traps in `/traps`
