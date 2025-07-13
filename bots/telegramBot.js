const axios = require('axios');
const logger = require('../utils/logger');
const { supabase } = require('../services/supabaseClient');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function logToSupabase(activity) {
  try {
    await supabase.from('engagements').insert([{
      platform: 'telegram',
      ...activity,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    logger.error(`[TelegramBot] Supabase log error: ${err.message}`);
  }
}

async function getProfile() {
  try {
    const resp = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    logger.info(`[TelegramBot] Profile: ${JSON.stringify(resp.data)}`);
    await logToSupabase({ action: 'getProfile', data: resp.data });
    return resp.data;
  } catch (err) {
    logger.error(`[TelegramBot] getProfile error: ${err.message}`);
    await logToSupabase({ action: 'getProfile', error: err.message });
  }
}

async function postContent(message) {
  try {
    const resp = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      { chat_id: chatId, text: message }
    );
    logger.info('[TelegramBot] Message sent');
    await logToSupabase({ action: 'postContent', message, response: resp.data });
  } catch (err) {
    logger.error(`[TelegramBot] postContent error: ${err.message}`);
    await logToSupabase({ action: 'postContent', error: err.message });
  }
}

async function autoReplyToMessages() {
  try {
    const resp = await axios.get(
      `https://api.telegram.org/bot${botToken}/getUpdates`
    );
    const updates = resp.data.result || [];
    for (const update of updates) {
      if (update.message && update.message.text && update.message.text.toLowerCase().includes('hello')) {
        await postContent('Hi! This is an auto-reply.');
        logger.info('[TelegramBot] Auto-replied to message');
        await logToSupabase({ action: 'autoReplyToMessages', update });
      }
    }
  } catch (err) {
    logger.error(`[TelegramBot] autoReplyToMessages error: ${err.message}`);
    await logToSupabase({ action: 'autoReplyToMessages', error: err.message });
  }
}

async function runTelegramBot() {
  logger.info('[TelegramBot] Starting (Supabase + Axios)');
  if (!botToken || !chatId) {
    logger.error('[TelegramBot] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in .env');
    return;
  }

  try {
    await getProfile();
    await postContent('Hello from Supabase-integrated Telegram bot!');
    await autoReplyToMessages();
    logger.info('[TelegramBot] Task complete');
    await logToSupabase({ action: 'runTelegramBot', status: 'complete' });
  } catch (error) {
    const msg = error.response?.data?.description || error.message;
    logger.error(`[TelegramBot] Error: ${msg}`);
    await logToSupabase({ action: 'runTelegramBot', error: msg });
  }
}

module.exports = runTelegramBot;
