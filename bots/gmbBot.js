const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const gmbAccessToken = process.env.GMB_ACCESS_TOKEN;
const gmbLocationId = process.env.GMB_LOCATION_ID;
const mongoUri = process.env.MONGO_URI;

async function logToMongo(activity) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('automation');
    await db.collection('gmb_logs').insertOne({
      ...activity,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`[GmbBot] MongoDB log error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function getProfile() {
  // GMB API does not provide a direct profile endpoint.
  logger.info('[GmbBot] getProfile: Not supported');
}

async function postContent(summary) {
  const resp = await axios.post(
    `https://mybusiness.googleapis.com/v4/accounts/${gmbLocationId}/localPosts`,
    { languageCode: 'en', summary },
    {
      headers: {
        'Authorization': `Bearer ${gmbAccessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  logger.info('[GmbBot] Post created');
  await logToMongo({ action: 'postContent', summary, resp: resp.data });
}

async function runGmbBot() {
  logger.info('[GmbBot] Starting (Axios-based)');
  if (!gmbAccessToken || !gmbLocationId) {
    logger.error('[GmbBot] GMB_ACCESS_TOKEN or GMB_LOCATION_ID not set in .env');
    return;
  }
  try {
    await getProfile();
    await postContent('Bot update!');
    logger.info('[GmbBot] Task complete');
    await logToMongo({ action: 'runGmbBot', status: 'complete' });
  } catch (error) {
    logger.error(`[GmbBot] Error: ${error.response?.data?.error?.message || error.message}`);
    await logToMongo({ action: 'runGmbBot', error: error.message });
  }
}

module.exports = runGmbBot;
