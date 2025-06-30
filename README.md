# Default-Automation

## Overview

Default-Automation is a Node.js-based automation framework designed to run scheduled bots for various social media platforms (Instagram, Twitter, TikTok, Telegram, Facebook, Reddit, Google My Business) and handle trap events with notification support. It uses Puppeteer for browser automation, Express for the API, and supports notifications via email, Telegram, and Twilio (SMS/WhatsApp).

---

## Features

- **Scheduled Social Media Bots**: Automates login, posting, liking, commenting, and other actions on supported platforms.
- **Trap Event API**: Exposes an API endpoint to trigger "trap" events for monitoring or honeypot purposes.
- **Multi-channel Notifications**: Sends alerts via email, Telegram, and Twilio when traps are triggered.
- **Logging**: Centralized logging to both console and file.
- **Extensible**: Easily add new bots or notification channels.

---

## Directory Structure

```
.
├── bots/                # Social media automation bots
├── cron/                # Cron job scheduler for bots
├── logs/                # Log files (gitignored)
├── routes/              # Express route handlers
├── services/            # Notification and Puppeteer helpers
├── traps/               # Trap logic
├── utils/               # Logger utility
├── .env                 # Environment variables (not committed)
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js            # Main entry point
```

---

## Setup

### 1. Prerequisites

- Node.js v18+
- npm

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server
PORT=3000

# Email (Gmail example)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASS=your_email_password
NOTIFY_EMAIL=recipient_email@gmail.com

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Twilio
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SMS_FROM=+1234567890
ALERT_SMS_TO=+1234567890
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
ALERT_WHATSAPP_TO=whatsapp:+1234567890

# Social Media Credentials (for bots)
INSTAGRAM_USER=your_instagram_username
INSTAGRAM_PASS=your_instagram_password
TWITTER_USER=your_twitter_username
TWITTER_PASS=your_twitter_password
TIKTOK_USER=your_tiktok_username
TIKTOK_PASS=your_tiktok_password
TELEGRAM_PHONE=your_telegram_phone
FB_USER=your_facebook_email
FB_PASS=your_facebook_password
REDDIT_USER=your_reddit_username
REDDIT_PASS=your_reddit_password
GMB_USER=your_gmb_email
GMB_PASS=your_gmb_password
```

**Note:** Never commit your `.env` file.

---

## Usage

### Start the Server

```bash
node server.js
```

- The server will start on the port specified in `.env` or default to 3000.
- All bots will be scheduled automatically via cron.

### API

#### Trigger a Trap

```
POST /api/v1/trap/:platform
Content-Type: application/json

{
  "user": "attacker@example.com"
}
```

- Triggers a trap for the specified platform and sends notifications.

---

## Adding/Modifying Bots

- Each bot is a module in `bots/` and uses Puppeteer for automation.
- Update selectors and logic as needed for each platform.

---

## Logging

- Logs are written to both the console and `logs/trapEvents.log`.

---

## Extending Notifications

- Edit `services/notificationService.js` to add more notification channels.

---



---

## Disclaimer

This project is for educational and authorized automation/testing purposes only. Use responsibly and comply with the terms of service of each platform.
