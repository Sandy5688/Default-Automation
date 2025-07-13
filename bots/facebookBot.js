const axios = require('axios');
const logger = require('../utils/logger');
const { supabase } = require('../services/supabaseClient');

const fbAccessToken = process.env.FB_ACCESS_TOKEN;
const fbPageId = process.env.FB_PAGE_ID;

async function logToSupabase(activity) {
  try {
    await supabase.from('engagements').insert([{
      platform: 'facebook',
      ...activity,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    logger.error(`[FacebookBot] Supabase log error: ${err.message}`);
  }
}

async function getProfile() {
  const resp = await axios.get(
    `https://graph.facebook.com/v18.0/me?access_token=${fbAccessToken}`
  );
  logger.info(`[FacebookBot] Profile: ${JSON.stringify(resp.data)}`);
  await logToSupabase({ action: 'getProfile', data: resp.data });
  return resp.data;
}

async function postContent(message) {
  const resp = await axios.post(
    `https://graph.facebook.com/${fbPageId}/feed`,
    { message, access_token: fbAccessToken }
  );
  logger.info('[FacebookBot] Post published');
  await logToSupabase({ action: 'postContent', message, resp: resp.data });
  return resp.data;
}

async function commentOnContent(postId, message) {
  const resp = await axios.post(
    `https://graph.facebook.com/${postId}/comments`,
    { message, access_token: fbAccessToken }
  );
  logger.info(`[FacebookBot] Commented on ${postId}`);
  await logToSupabase({ action: 'commentOnContent', postId, message, resp: resp.data });
}

async function autoReplyToComments(postId, replyMessage) {
  logger.info('[FacebookBot] autoReplyToComments: Not implemented');
  await logToSupabase({ action: 'autoReplyToComments', status: 'not-implemented', postId });
}

async function runFacebookBot() {
  logger.info('[FacebookBot] Starting (Axios-based)');

  if (!fbAccessToken || !fbPageId) {
    const msg = '[FacebookBot] FB_ACCESS_TOKEN or FB_PAGE_ID not set in .env';
    logger.error(msg);
    await logToSupabase({ action: 'runFacebookBot', error: msg });
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
    await logToSupabase({ action: 'runFacebookBot', status: 'complete' });
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message;
    logger.error(`[FacebookBot] Error: ${msg}`);
    await logToSupabase({ action: 'runFacebookBot', error: msg });
  }
}

module.exports = runFacebookBot;
