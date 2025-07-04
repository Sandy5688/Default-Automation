const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const bearerToken = process.env.TWITTER_BEARER_TOKEN;
const userId = process.env.TWITTER_USER_ID;
const mongoUri = process.env.MONGO_URI;

async function logToMongo(activity) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('automation');
    await db.collection('twitter_logs').insertOne({
      ...activity,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`[TwitterBot] MongoDB log error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function getProfile() {
  const resp = await axios.get(
    `https://api.twitter.com/2/users/${userId}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  logger.info(`[TwitterBot] Profile: ${JSON.stringify(resp.data)}`);
  await logToMongo({ action: 'getProfile', data: resp.data });
  return resp.data;
}

async function postContent(text) {
  const resp = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text },
    { headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
  );
  logger.info(`[TwitterBot] Tweeted: ${text}`);
  await logToMongo({ action: 'postContent', text, resp: resp.data });
  return resp.data;
}

async function likeContent(tweetId) {
  if (!userId) return;
  await axios.post(
    `https://api.twitter.com/2/users/${userId}/likes`,
    { tweet_id: tweetId },
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  logger.info(`[TwitterBot] Liked tweet: ${tweetId}`);
  await logToMongo({ action: 'likeContent', tweetId });
}

async function commentOnContent(tweetId, text) {
  // Twitter API v2 does not support direct replies via a single endpoint.
  // Instead, post a tweet with in_reply_to_tweet_id.
  const resp = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text, reply: { in_reply_to_tweet_id: tweetId } },
    { headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
  );
  logger.info(`[TwitterBot] Replied to ${tweetId}: ${text}`);
  await logToMongo({ action: 'commentOnContent', tweetId, text, resp: resp.data });
}

async function autoReplyToComments(tweetId, replyText) {
  // Not implemented: would require streaming or polling mentions.
  logger.info('[TwitterBot] autoReplyToComments: Not implemented');
}

async function runTwitterBot() {
  logger.info('[TwitterBot] Starting (Axios-based)');
  if (!bearerToken || !userId) {
    logger.error('[TwitterBot] TWITTER_BEARER_TOKEN or TWITTER_USER_ID not set in .env');
    return;
  }
  try {
    const profile = await getProfile();

    // Post a tweet
    const tweet = await postContent('Hello world from Axios bot!');

    // Like the tweet
    if (tweet?.data?.id) {
      await likeContent(tweet.data.id);

      // Comment (reply) on the tweet
      await commentOnContent(tweet.data.id, 'Nice tweet!');
      await autoReplyToComments(tweet.data.id, 'Thanks for your reply!');
    }

    logger.info('[TwitterBot] Automation complete');
    await logToMongo({ action: 'runTwitterBot', status: 'complete' });
  } catch (error) {
    logger.error(`[TwitterBot] Error: ${error.response?.data?.detail || error.message}`);
    await logToMongo({ action: 'runTwitterBot', error: error.message });
  }
}

module.exports = runTwitterBot;

