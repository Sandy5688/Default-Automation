const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

async function runTwitterBot() {
  logger.info('[TwitterBot] Starting');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://twitter.com/login', { waitUntil: 'networkidle2' });

    // Example: login logic (optional if using cookies/session later)
    await page.waitForSelector('input[name="text"]');
    await page.type('input[name="text"]', process.env.TWITTER_USER || 'your_username');
    await page.click('div[role="button"][data-testid="LoginForm_Login_Button"]');
    await page.waitForTimeout(1000);
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', process.env.TWITTER_PASS || 'your_password');
    await page.click('div[role="button"][data-testid="LoginForm_Login_Button"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Tweet
    await page.waitForSelector('a[aria-label="Tweet"]', { visible: true });
    await page.click('a[aria-label="Tweet"]');
    await page.waitForSelector('div[aria-label="Tweet text"]', { visible: true });
    await page.type('div[aria-label="Tweet text"]', 'Hello world from bot!');
    await page.click('div[data-testid="tweetButtonInline"]');
    await page.waitForTimeout(2000);

    // Like a tweet (navigate to a tweet and click like)
    await page.goto('https://twitter.com/username/status/TWEET_ID', { waitUntil: 'networkidle2' }); // Replace username and TWEET_ID
    await page.waitForSelector('div[data-testid="like"]', { visible: true });
    await page.click('div[data-testid="like"]');
    await page.waitForTimeout(1000);

    // Follow a user
    await page.goto('https://twitter.com/target_user', { waitUntil: 'networkidle2' }); // Replace target_user
    await page.waitForSelector('div[data-testid$="-follow"]', { visible: true });
    await page.click('div[data-testid$="-follow"]');

    logger.info('[TwitterBot] Automation complete');
  } catch (error) {
    logger.error(`[TwitterBot] Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = runTwitterBot;
