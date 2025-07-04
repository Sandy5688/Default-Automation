// DEPRECATED: Puppeteer-based bot. Migrated to Axios-based Reddit API automation.

const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const redditToken = process.env.REDDIT_ACCESS_TOKEN;
const redditUser = process.env.REDDIT_USER;
const mongoUri = process.env.MONGO_URI;

async function logToMongo(activity) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('automation');
    await db.collection('reddit_logs').insertOne({
      ...activity,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`[RedditBot] MongoDB log error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function getProfile() {
  const resp = await axios.get(
    'https://oauth.reddit.com/api/v1/me',
    { headers: { Authorization: `bearer ${redditToken}`, 'User-Agent': `RedditBot/1.0 by ${redditUser}` } }
  );
  logger.info(`[RedditBot] Profile: ${JSON.stringify(resp.data)}`);
  await logToMongo({ action: 'getProfile', data: resp.data });
  return resp.data;
}

async function postContent(subreddit, title, text) {
  const resp = await axios.post(
    'https://oauth.reddit.com/api/submit',
    new URLSearchParams({
      sr: subreddit,
      kind: 'self',
      title,
      text
    }),
    {
      headers: {
        'Authorization': `bearer ${redditToken}`,
        'User-Agent': `RedditBot/1.0 by ${redditUser}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  logger.info(`[RedditBot] Post submitted to r/${subreddit}`);
  await logToMongo({ action: 'postContent', subreddit, title, text, resp: resp.data });
  return resp.data;
}

async function commentOnContent(thingId, text) {
  const resp = await axios.post(
    'https://oauth.reddit.com/api/comment',
    new URLSearchParams({
      thing_id: thingId,
      text
    }),
    {
      headers: {
        'Authorization': `bearer ${redditToken}`,
        'User-Agent': `RedditBot/1.0 by ${redditUser}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  logger.info(`[RedditBot] Commented on ${thingId}`);
  await logToMongo({ action: 'commentOnContent', thingId, text, resp: resp.data });
}

async function autoReplyToComments() {
  // Not implemented: would require polling inbox/messages.
  logger.info('[RedditBot] autoReplyToComments: Not implemented');
}

async function runRedditBot() {
  logger.info('[RedditBot] Starting (Axios-based)');
  if (!redditToken || !redditUser) {
    logger.error('[RedditBot] REDDIT_ACCESS_TOKEN or REDDIT_USER not set in .env');
    return;
  }
  try {
    await getProfile();
    const post = await postContent('test', 'Bot post title', 'Bot post body');
    // Comment on the post if possible
    const postId = post?.json?.data?.id;
    if (postId) {
      await commentOnContent(`t3_${postId}`, 'Nice post!');
      await autoReplyToComments();
    }
    logger.info('[RedditBot] Task complete');
    await logToMongo({ action: 'runRedditBot', status: 'complete' });
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    logger.error(`[RedditBot] Error: ${msg}`);
    await logToMongo({ action: 'runRedditBot', error: msg });
  }
}

module.exports = runRedditBot;
