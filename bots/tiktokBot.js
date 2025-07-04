// DEPRECATED: Puppeteer-based TikTok bot replaced with Axios-based scraping (limited functionality)

const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');
const puppeteer = require('puppeteer');

const tiktokAuthHeader = process.env.TIKTOK_AUTH_HEADER;
const mongoUri = process.env.MONGO_URI;

async function logToMongo(activity) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('automation');
    await db.collection('tiktok_logs').insertOne({
      ...activity,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`[TikTokBot] MongoDB log error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function getProfile() {
  logger.info('[TikTokBot] getProfile: Not supported via public API');
}

async function postContentPuppeteer(page, text) {
  // TikTok web does not support posting via browser automation due to file upload and anti-bot.
  logger.info('[TikTokBot] postContent: Not supported via Puppeteer');
}

async function likeContentPuppeteer(page) {
  try {
    await page.goto('https://www.tiktok.com/foryou', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[data-e2e="like-icon"]', { visible: true, timeout: 10000 });
    await page.click('button[data-e2e="like-icon"]');
    logger.info('[TikTokBot] Liked a video');
    await logToMongo({ action: 'likeContent' });
  } catch (err) {
    logger.error(`[TikTokBot] Puppeteer likeContent error: ${err.message}`);
  }
}

async function commentOnContentPuppeteer(page, comment) {
  try {
    await page.waitForSelector('input[data-e2e="comment-input"]', { visible: true, timeout: 10000 });
    await page.type('input[data-e2e="comment-input"]', comment);
    await page.click('button[data-e2e="post-comment"]');
    logger.info('[TikTokBot] Commented on a video');
    await logToMongo({ action: 'commentOnContent', comment });
  } catch (err) {
    logger.error(`[TikTokBot] Puppeteer commentOnContent error: ${err.message}`);
  }
}

async function autoReplyToComments() {
  logger.info('[TikTokBot] autoReplyToComments: Not supported');
}

async function runTikTokBot() {
  logger.info('[TikTokBot] Starting');
  if (!tiktokAuthHeader) {
    logger.info('[TikTokBot] No TIKTOK_AUTH_HEADER, falling back to Puppeteer');
    // Puppeteer fallback
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await page.goto('https://www.tiktok.com/login', { waitUntil: 'domcontentloaded' });
      // Skipping login automation for demo
      await likeContentPuppeteer(page);
      await commentOnContentPuppeteer(page, 'Nice video!');
      await autoReplyToComments();
      logger.info('[TikTokBot] Puppeteer fallback complete');
      await logToMongo({ action: 'runTikTokBot', status: 'complete' });
    } catch (err) {
      logger.error(`[TikTokBot] Puppeteer error: ${err.message}`);
      await logToMongo({ action: 'runTikTokBot', error: err.message });
    } finally {
      await browser.close();
    }
    return;
  }

  try {
    // Example: Fetch trending video feed (limited support due to unofficial API)
    const resp = await axios.get('https://www.tiktok.com/api/recommend/item_list/', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Cookie': tiktokAuthHeader
      },
      params: { count: 1 }
    });
    logger.info(`[TikTokBot] Trending video: ${JSON.stringify(resp.data)}`);
    await logToMongo({ action: 'getTrending', data: resp.data });
    // Like/comment endpoints are not publicly supported by TikTok API.
    logger.info('[TikTokBot] Task complete');
    await logToMongo({ action: 'runTikTokBot', status: 'complete' });
  } catch (error) {
    logger.error(`[TikTokBot] Error: ${error.response?.data || error.message}`);
    await logToMongo({ action: 'runTikTokBot', error: error.message });
  }
}

module.exports = runTikTokBot;
