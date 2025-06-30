const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

async function runTelegramBot() {
  logger.info('[TelegramBot] Starting');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://web.telegram.org/k/', { waitUntil: 'domcontentloaded' });

    logger.info('[TelegramBot] At Telegram Web');

    // Optional: Use phone number login automation
    // Login (phone number)
    // await page.waitForSelector('input[name="phone_number"]');
    // await page.type('input[name="phone_number"]', process.env.TELEGRAM_PHONE || 'your_phone');
    // await page.click('button[type="submit"]');
    // await page.waitForTimeout(2000);
    // Enter code, etc.

    // Send a message (navigate to chat and send)
    await page.goto('https://web.telegram.org/k/#@username', { waitUntil: 'domcontentloaded' }); // Replace @username
    await page.waitForSelector('div[contenteditable="true"]', { visible: true });
    await page.type('div[contenteditable="true"]', 'Hello from bot!');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(7000);

    logger.info('[TelegramBot] Completed');
  } catch (error) {
    logger.error(`[TelegramBot] Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = runTelegramBot;
