const axios = require('axios');
const logger = require('../utils/logger');

async function triggerTrap(userIdentifier, platform, phone = null) {
  try {
    const response = await axios.post('http://localhost:3000/api/signup', {
      email: userIdentifier,
      phone,
      referrer: platform || 'magicLoginTrap'
    });

    logger.info(`[TRAP] Supabase trap for ${userIdentifier} on ${platform}`);
    logger.debug(`[TRAP] Response: ${JSON.stringify(response.data)}`);
  } catch (err) {
    logger.error(`[TRAP] Axios trap failed: ${err.message}`);
  }
}

module.exports = { triggerTrap };