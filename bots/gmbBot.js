const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

async function runGmbBot() {
  logger.info('[GmbBot] Starting');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://business.google.com/', { waitUntil: 'networkidle2' });

    logger.info('[GmbBot] At GMB dashboard/login');

    // Option: inject session cookies here to bypass login

    // Login
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', process.env.GMB_USER || 'your_email');
    await page.click('#identifierNext');
    await page.waitForTimeout(2000);
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', process.env.GMB_PASS || 'your_password');
    await page.click('#passwordNext');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Post an update (navigate to post section and create post)
    await page.goto('https://business.google.com/posts', { waitUntil: 'networkidle2' });
    await page.waitForSelector('button[aria-label="Create post"]', { visible: true });
    await page.click('button[aria-label="Create post"]');
    await page.waitForSelector('textarea', { visible: true });
    await page.type('textarea', 'Bot update!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    logger.info('[GmbBot] Task completed');
  } catch (error) {
    logger.error(`[GmbBot] Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = runGmbBot;
