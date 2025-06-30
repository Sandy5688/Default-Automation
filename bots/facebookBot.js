const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

async function runFacebookBot() {
  logger.info('[FacebookBot] Starting');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });

    logger.info('[FacebookBot] At login page');

    // Login
    await page.waitForSelector('#email');
    await page.type('#email', process.env.FB_USER || 'your_email');
    await page.type('#pass', process.env.FB_PASS || 'your_password');
    await page.click('button[name="login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Post (navigate to home and post)
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('div[aria-label="Create a post"]', { visible: true });
    await page.click('div[aria-label="Create a post"]');
    await page.waitForSelector('div[aria-label="What\'s on your mind?"]', { visible: true });
    await page.type('div[aria-label="What\'s on your mind?"]', 'Hello from bot!');
    // Wait for the post button to be enabled and click it
    await page.waitForSelector('div[aria-label="Post"]', { visible: true });
    await page.click('div[aria-label="Post"]');
    await page.waitForTimeout(2000);

    // Like a post (navigate to a post and click like)
    // Replace POST_ID with a real post id or use a selector for the first post
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('div[aria-label="Like"]', { visible: true });
    await page.click('div[aria-label="Like"]');
    await page.waitForTimeout(1000);

    // Comment on a post
    await page.waitForSelector('div[aria-label="Write a comment"]', { visible: true });
    await page.type('div[aria-label="Write a comment"]', 'Nice post!');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    logger.info('[FacebookBot] Task complete');
  } catch (error) {
    logger.error(`[FacebookBot] Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = runFacebookBot;
