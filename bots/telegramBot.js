// DEPRECATED: Puppeteer-based Telegram bot is now replaced by Axios + Telegram Bot API.

const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const mongoUri = process.env.MONGO_URI;

async function logToMongo(activity) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('automation');
    await db.collection('telegram_logs').insertOne({
      ...activity,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`[TelegramBot] MongoDB log error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function getProfile() {
  const resp = await axios.get(
    `https://api.telegram.org/bot${botToken}/getMe`
  );
  logger.info(`[TelegramBot] Profile: ${JSON.stringify(resp.data)}`);
  await logToMongo({ action: 'getProfile', data: resp.data });
  return resp.data;
}

async function postContent(message) {
  await axios.post(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    { chat_id: chatId, text: message }
  );
  logger.info('[TelegramBot] Message sent');
  await logToMongo({ action: 'postContent', message });
}

async function autoReplyToMessages() {
  // Telegram Bot API: getUpdates and reply to new messages
  try {
    const resp = await axios.get(
      `https://api.telegram.org/bot${botToken}/getUpdates`
    );
    const updates = resp.data.result || [];
    for (const update of updates) {
      if (update.message && update.message.text && update.message.text.toLowerCase().includes('hello')) {
        await postContent('Hi! This is an auto-reply.');
        logger.info('[TelegramBot] Auto-replied to message');
        await logToMongo({ action: 'autoReplyToMessages', update });
      }
    }
  } catch (err) {
    logger.error(`[TelegramBot] autoReplyToMessages error: ${err.message}`);
  }
}

async function runTelegramBot() {
  logger.info('[TelegramBot] Starting (Axios-based)');
  if (!botToken || !chatId) {
    logger.error('[TelegramBot] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in .env');
    return;
  }
  try {
    await getProfile();
    await postContent('Hello from Axios Telegram bot!');
    await autoReplyToMessages();
    logger.info('[TelegramBot] Task complete');
    await logToMongo({ action: 'runTelegramBot', status: 'complete' });
  } catch (error) {
    logger.error(`[TelegramBot] Error: ${error.response?.data?.description || error.message}`);
    await logToMongo({ action: 'runTelegramBot', error: error.message });
  }
}

module.exports = runTelegramBot;
