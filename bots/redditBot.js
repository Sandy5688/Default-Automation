const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

async function runRedditBot() {
  logger.info('[RedditBot] Starting');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.reddit.com/login/', { waitUntil: 'networkidle2' });

    logger.info('[RedditBot] At login page');

    // Example: login, post, upvote, comment
    await page.waitForSelector('#loginUsername');
    await page.type('#loginUsername', process.env.REDDIT_USER || 'your_username');
    await page.type('#loginPassword', process.env.REDDIT_PASS || 'your_password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Post (navigate to subreddit and create post)
    await page.goto('https://www.reddit.com/r/test/submit', { waitUntil: 'networkidle2' });
    await page.waitForSelector('textarea[name="title"]', { visible: true });
    await page.type('textarea[name="title"]', 'Bot post title');
    await page.type('div[role="textbox"]', 'Bot post body');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Upvote a post (navigate to post and click upvote)
    await page.goto('https://www.reddit.com/r/test/comments/POST_ID', { waitUntil: 'networkidle2' }); // Replace POST_ID
    await page.waitForSelector('button[aria-label="upvote"]', { visible: true });
    await page.click('button[aria-label="upvote"]');
    await page.waitForTimeout(1000);

    // Comment on a post
    await page.waitForSelector('div[role="textbox"]', { visible: true });
    await page.type('div[role="textbox"]', 'Nice post!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(4000);

    logger.info('[RedditBot] Automation complete');
  } catch (error) {
    logger.error(`[RedditBot] Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = runRedditBot;
