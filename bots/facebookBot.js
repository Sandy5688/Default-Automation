const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const fbAccessToken = process.env.FB_ACCESS_TOKEN;
const fbPageId = process.env.FB_PAGE_ID;
const mongoUri = process.env.MONGO_URI;

async function logToMongo(activity) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('automation');
    await db.collection('facebook_logs').insertOne({
      ...activity,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`[FacebookBot] MongoDB log error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function getProfile() {
  const resp = await axios.get(
    `https://graph.facebook.com/v18.0/me?access_token=${fbAccessToken}`
  );
  logger.info(`[FacebookBot] Profile: ${JSON.stringify(resp.data)}`);
  await logToMongo({ action: 'getProfile', data: resp.data });
  return resp.data;
}

async function postContent(message) {
  const resp = await axios.post(
    `https://graph.facebook.com/${fbPageId}/feed`,
    { message, access_token: fbAccessToken }
  );
  logger.info('[FacebookBot] Post published');
  await logToMongo({ action: 'postContent', message, resp: resp.data });
  return resp.data;
}

async function commentOnContent(postId, message) {
  const resp = await axios.post(
    `https://graph.facebook.com/${postId}/comments`,
    { message, access_token: fbAccessToken }
  );
  logger.info(`[FacebookBot] Commented on ${postId}`);
  await logToMongo({ action: 'commentOnContent', postId, message, resp: resp.data });
}

async function autoReplyToComments(postId, replyMessage) {
  // Not implemented: would require polling comments and replying.
  logger.info('[FacebookBot] autoReplyToComments: Not implemented');
}

async function runFacebookBot() {
  logger.info('[FacebookBot] Starting (Axios-based)');
  if (!fbAccessToken || !fbPageId) {
    logger.error('[FacebookBot] FB_ACCESS_TOKEN or FB_PAGE_ID not set in .env');
    return;
  }
  try {
    await getProfile();
    const post = await postContent('Hello from Axios Facebook bot!');
    const postId = post?.id;
    if (postId) {
      await commentOnContent(postId, 'Nice post!');
      await autoReplyToComments(postId, 'Thanks for your comment!');
    }
    logger.info('[FacebookBot] Task complete');
    await logToMongo({ action: 'runFacebookBot', status: 'complete' });
  } catch (error) {
    logger.error(`[FacebookBot] Error: ${error.response?.data?.error?.message || error.message}`);
    await logToMongo({ action: 'runFacebookBot', error: error.message });
  }
}

module.exports = runFacebookBot;
