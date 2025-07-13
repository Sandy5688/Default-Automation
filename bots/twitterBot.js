const axios = require('axios');
const logger = require('../utils/logger');
const { supabase } = require('../services/supabaseClient');

const bearerToken = process.env.TWITTER_BEARER_TOKEN;
const userId = process.env.TWITTER_USER_ID;

async function logToSupabase(activity) {
  await supabase.from('engagements').insert([{
    platform: 'twitter',
    ...activity,
    created_at: new Date().toISOString()
  }]);
}

async function getProfile() {
  const resp = await axios.get(
    `https://api.twitter.com/2/users/${userId}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  logger.info(`[TwitterBot] Profile: ${JSON.stringify(resp.data)}`);
  await logToSupabase({ action: 'getProfile', data: resp.data });
  return resp.data;
}

async function postContent(text) {
  const resp = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text },
    { headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
  );
  logger.info(`[TwitterBot] Tweeted: ${text}`);
  await logToSupabase({ action: 'postContent', text, resp: resp.data });
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
  await logToSupabase({ action: 'likeContent', tweetId });
}

async function commentOnContent(tweetId, text) {
  const resp = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text, reply: { in_reply_to_tweet_id: tweetId } },
    { headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' } }
  );
  logger.info(`[TwitterBot] Replied to ${tweetId}: ${text}`);
  await logToSupabase({ action: 'commentOnContent', tweetId, text, resp: resp.data });
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
    await logToSupabase({ action: 'runTwitterBot', status: 'complete' });
  } catch (error) {
    logger.error(`[TwitterBot] Error: ${error.response?.data?.detail || error.message}`);
    await logToSupabase({ action: 'runTwitterBot', error: error.message });
  }
}

module.exports = runTwitterBot;