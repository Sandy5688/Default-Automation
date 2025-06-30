const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

async function runInstagramBot() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  logger.info('[InstagramBot] Launching');

  try {
    await page.goto('https://instagram.com', { waitUntil: 'domcontentloaded' });

    // Perform login, post, like, comment automation

    // Login
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', process.env.INSTAGRAM_USER || 'your_username');
    await page.type('input[name="password"]', process.env.INSTAGRAM_PASS || 'your_password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Post (navigate to post page, simplified)
    // Instagram web does not support direct posting via browser automation due to file upload restrictions.
    // We'll skip actual posting, but here's how you would like and comment:

    // Like a post (navigate to a post and click like)
    await page.goto('https://instagram.com/p/CODE/', { waitUntil: 'domcontentloaded' }); // Replace CODE with a real post code
    await page.waitForSelector('svg[aria-label="Like"]', { visible: true });
    await page.click('svg[aria-label="Like"]');
    await page.waitForTimeout(1000);

    // Comment on a post
    await page.waitForSelector('textarea[aria-label="Add a comment…"]', { visible: true });
    await page.type('textarea[aria-label="Add a comment…"]', 'Nice post!');
    await page.click('button[type="submit"]');

    logger.info('[InstagramBot] Task complete');
  } catch (err) {
    logger.error('[InstagramBot] Error:', err);
  } finally {
    await browser.close();
  }
}

module.exports = runInstagramBot;
