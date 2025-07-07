const axios = require('axios');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const pinterestToken = process.env.PINTEREST_ACCESS_TOKEN;
const pinterestBoardId = process.env.PINTEREST_BOARD_ID;
const mongoUri = process.env.MONGO_URI;

async function logToMongo(activity) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('automation');
    await db.collection('pinterest_logs').insertOne({
      ...activity,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`[PinterestBot] MongoDB log error: ${err.message}`);
  } finally {
    await client.close();
  }
}

async function postPin() {
  const payload = {
    board_id: pinterestBoardId,
    title: 'Automation Update!',
    alt_text: 'Bot Pin',
    media_source: {
      source_type: 'image_url',
      url: 'https://example.com/image.jpg'
    },
    link: 'https://your-site.com',
    description: 'This pin was posted via bot!'
  };

  const resp = await axios.post(
    'https://api.pinterest.com/v5/pins',
    payload,
    {
      headers: {
        'Authorization': `Bearer ${pinterestToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  logger.info('[PinterestBot] Pin created');
  await logToMongo({ action: 'postPin', payload, resp: resp.data });
}

async function runPinterestBot() {
  logger.info('[PinterestBot] Starting');
  if (!pinterestToken || !pinterestBoardId) {
    logger.error('[PinterestBot] PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID not set');
    return;
  }
  try {
    await postPin();
    logger.info('[PinterestBot] Task complete');
    await logToMongo({ action: 'runPinterestBot', status: 'complete' });
  } catch (error) {
    logger.error(`[PinterestBot] Error: ${error.response?.data?.message || error.message}`);
    await logToMongo({ action: 'runPinterestBot', error: error.message });
  }
}

module.exports = runPinterestBot;
