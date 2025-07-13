const axios = require('axios');
const logger = require('../utils/logger');
const { supabase } = require('../services/supabaseClient');

const gmbAccessToken = process.env.GMB_ACCESS_TOKEN;
const gmbLocationId = process.env.GMB_LOCATION_ID;

async function logToSupabase(activity) {
  try {
    await supabase.from('engagements').insert([{
      platform: 'google-my-business',
      ...activity,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    logger.error(`[GmbBot] Supabase log error: ${err.message}`);
  }
}

async function getProfile() {
  // GMB API doesn’t expose a direct profile endpoint.
  logger.info('[GmbBot] getProfile: Not supported');
  await logToSupabase({ action: 'getProfile', note: 'Not supported by GMB API' });
}

async function postContent(summary) {
  const payload = {
    languageCode: 'en',
    summary
  };

  const resp = await axios.post(
    `https://mybusiness.googleapis.com/v4/accounts/${gmbLocationId}/localPosts`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${gmbAccessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  logger.info('[GmbBot] Post created');
  await logToSupabase({ action: 'postContent', summary, response: resp.data });
}

async function runGmbBot() {
  logger.info('[GmbBot] Starting (Axios-based)');

  if (!gmbAccessToken || !gmbLocationId) {
    const errMsg = '[GmbBot] GMB_ACCESS_TOKEN or GMB_LOCATION_ID not set in .env';
    logger.error(errMsg);
    await logToSupabase({ action: 'runGmbBot', error: errMsg });
    return;
  }

  try {
    await getProfile(); // Informational/logging only
    await postContent('Bot update!');
    logger.info('[GmbBot] Task complete');
    await logToSupabase({ action: 'runGmbBot', status: 'complete' });
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    logger.error(`[GmbBot] Error: ${errMsg}`);
    await logToSupabase({ action: 'runGmbBot', error: errMsg });
  }
}

module.exports = runGmbBot;
