const axios = require('axios');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// 1. Email (already working)
async function sendEmailAlert(subject, message) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to: process.env.NOTIFY_EMAIL,
    subject,
    text: message
  });
}

// 2. Telegram Bot API
async function sendTelegramAlert(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    });
  } catch (err) {
    logger.error(`[TELEGRAM] Failed to send: ${err.message}`);
  }
}

// 3. Twilio SMS / WhatsApp
async function sendTwilioAlert(message, via = 'sms') {
  const accountSid = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = via === 'whatsapp' ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;
  const to = via === 'whatsapp' ? process.env.ALERT_WHATSAPP_TO : process.env.ALERT_SMS_TO;

  const client = require('twilio')(accountSid, authToken);

  try {
    await client.messages.create({
      body: message,
      from,
      to
    });
  } catch (err) {
    logger.error(`[TWILIO-${via}] Failed to send: ${err.message}`);
  }
}

// Main entry
async function notifyTrap({ platform, user, message }) {
  logger.info(`[NOTIFY] ${message}`);

  const finalMessage = ` Trap Triggered \nPlatform: ${platform}\nUser: ${user}\nMessage: ${message}`;

  await sendEmailAlert(`Trap Alert: ${platform}`, finalMessage);
  await sendTelegramAlert(finalMessage);
  await sendTwilioAlert(finalMessage, 'sms');
  await sendTwilioAlert(finalMessage, 'whatsapp');
}

module.exports = { notifyTrap };
