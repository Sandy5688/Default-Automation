```markdown
# Default-Automation

## 🚀 Overview

**Default-Automation** is a modular Node.js automation system for social media and blog management, powered by Supabase. It supports multi-platform bots, blog generation, engagement tracking, rewards, traps, reminders, notifications, and analytics.

---

## 🧠 System Flow Overview

**Default-Automation** orchestrates a complete automation pipeline for social media and blog management. Here is the high-level flow of the system:

1. **Input & Content Creation**
   - Admin/user provides input (text, prompts, images, etc.) via dashboard or API.
   - For blogs: input is sent to the blog generator (OpenAI, Replicate).
   - For social posts: input is used to generate captions, images, or videos.

2. **Blog Generation**
   - Blog content is generated using AI (OpenAI GPT-4 for text, Replicate/DALL·E for images).
   - Blog metadata (tags, images, prompts) is attached.
   - Blog is saved in the database and previewed in the dashboard.

3. **Post Scheduling & Publishing**
   - Posts (social or blog) are scheduled via the dashboard or API.
   - Scheduled posts are queued in the `post_queue` table.
   - Bots pick up queued posts and publish to respective platforms (Instagram, Twitter, TikTok, Facebook, Reddit, Telegram, Pinterest, GMB).
   - Status of each post is tracked (pending, posted, failed).

4. **Blog Syndication**
   - Generated blogs are syndicated to platforms like Medium, Substack, Reddit, GMB.
   - Syndication status and URLs are tracked.

5. **Engagement & Analytics**
   - Engagements (likes, shares, comments, views) are tracked for each post via the `engagements` table.
   - Analytics dashboards show platform performance, top users, and engagement metrics.

6. **Rewards System**
   - When engagement thresholds are met, rewards are automatically issued to users (silver, gold, viral).
   - Rewards are tracked in the `rewards` table and notifications are sent.

7. **Notifications & Reminders**
   - System sends notifications for rewards, traps, reminders, and system events via email, Telegram, SMS, WhatsApp.

8. **Admin Dashboard**
   - Central dashboard for managing posts, blogs, bots, rewards, analytics, notifications, and system settings.

---

**Flow Diagram:**

```
Input (Prompt/Text/Image)
      |
      v
Blog Generation (AI) ----> Blog Preview ----> Blog Syndication (Medium, Substack, Reddit, GMB)
      |
      v
Post Creation (Caption/Image/Video)
      |
      v
Post Scheduling ----> Post Queue ----> Bots ----> Social Platforms
      |
      v
Engagement Tracking (Likes, Shares, Comments, Views)
      |
      v
Reward Issuance ----> Notifications
      |
      v
Analytics Dashboard (Performance, Top Users, Rewards)
```

---

## 🧠 Key Features

- **Social Media Bots** (`/bots`)
  - Instagram, TikTok, Twitter, Telegram, Reddit, GMB
  - Auto-post, auto-like, auto-comment, auto-reply, scheduling
- **Blog Generator** (`/blog`)
  - `generateBlog.js`, `imageGenerator.js`, `blogScheduler.js`
  - Uses OpenAI GPT-4 for writing, DALL·E or Replicate for images
  - Blog syndication (Medium, Substack, Reddit, GMB)
- **Reward & Engagement Tracker**
  - Tracks engagement via Supabase `engagements` and `rewards` tables
  - Automatically issues rewards when thresholds are met
- **Traps & Reminder System** (`/traps`, `/cron/reminderScheduler.js`)
  - Detects suspicious logins, triggers notifications and follow-ups
- **Supabase Integration**
  - All data, RLS, authentication, and RPC logic handled in Supabase
  - No MongoDB dependency
- **Cron Jobs**
  - Automated scheduling via `scheduleBots.js`, `blogCron.js`, `reminderScheduler.js`
- **Notification System**
  - Alerts via email, Telegram, SMS, WhatsApp
- **Settings & Analytics**
  - Admin dashboard for configuration, analytics, and reward management

---

## ⚙️ Setup Instructions

### 1. Requirements

- Node.js v18+
- Supabase project (URL & service key)
- API tokens for social platforms (Instagram Graph, Twitter, Reddit, etc.)
- OpenAI API key (for blog generation)
- Replicate API key (for image generation)
- Email/Twilio/Telegram credentials for notifications

### 2. Installation

```bash
git clone https://github.com/your-org/default-automation.git
cd default-automation
npm install
```

---

## 🔐 .env Configuration (Sample)

```env
# Express Server
PORT=3000

# Supabase
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

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

# OpenAI
OPENAI_API_KEY=sk-...

# Replicate
REPLICATE_API_KEY=...

# Blog Syndication
MEDIUM_TOKEN=...
SUBSTACK_TOKEN=...
REDDIT_TOKEN=...
GMB_TOKEN=...
```

---

## 🧪 Usage

### Start the Server

```bash
node server.js
```

* Express will launch on `http://localhost:PORT`
* Bots, blog generator, traps, and cron jobs will initialize automatically

---

## 📦 Directory Structure

```
default-automation/
├── bots/                     # Social media bots
│   ├── instagramBot.js
│   ├── twitterBot.js
│   └── ...
├── blog/                     # Blog generation
│   ├── generateBlog.js
│   ├── imageGenerator.js
│   └── ...
├── cron/                     # Cron jobs
│   ├── scheduleBots.js
│   ├── blogCron.js
│   └── reminderScheduler.js
├── traps/                    # Trap detection and reminders
│   ├── trapController.js
│   └── ...
├── services/                 # External services integration
│   ├── notificationService.js
│   └── ...
├── logs/                     # Log files
│   ├── botLogs.log
│   ├── trapEvents.log
│   └── ...
├── .env.sample               # Sample environment configuration
├── package.json              # Node.js dependencies and scripts
└── server.js                 # Entry point for the application
```

---


---

## 🧩 Extending Functionality

You can add:

* New bots in `/bots` (just export a function)
* New routes in `/routes`
* New notification methods in `services/notificationService.js`
* New traps in `/traps`
