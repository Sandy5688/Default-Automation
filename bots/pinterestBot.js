const axios = require('axios');
const logger = require('../utils/logger');
const { supabase } = require('../services/supabaseClient');

const pinterestToken = process.env.PINTEREST_ACCESS_TOKEN;
const pinterestBoardId = process.env.PINTEREST_BOARD_ID;

async function logToSupabase(activity) {
  try {
    await supabase.from('engagements').insert([{
      platform: 'pinterest',
      ...activity,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    logger.error(`[PinterestBot] Supabase log error: ${err.message}`);
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

  try {
    const resp = await axios.post(
      'https://api.pinterest.com/v5/pins',
      payload,
      {
        headers: {
          Authorization: `Bearer ${pinterestToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    logger.info('[PinterestBot] Pin created successfully');
    await logToSupabase({ action: 'postPin', payload, response: resp.data });
    return resp.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    logger.error(`[PinterestBot] postPin error: ${msg}`);
    await logToSupabase({ action: 'postPin', error: msg });
    throw error;
  }
}

async function runPinterestBot() {
  logger.info('[PinterestBot] Starting automation task');
  if (!pinterestToken || !pinterestBoardId) {
    const msg = '[PinterestBot] PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID not set';
    logger.error(msg);
    await logToSupabase({ action: 'runPinterestBot', error: msg });
    return;
  }

  try {
    await postPin();
    logger.info('[PinterestBot] Task complete');
    await logToSupabase({ action: 'runPinterestBot', status: 'complete' });
  } catch (error) {
    // Already logged in postPin
  }
}

module.exports = runPinterestBot;
