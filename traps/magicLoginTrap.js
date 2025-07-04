const axios = require('axios');
const { notifyTrap } = require('../services/notificationService');
const logger = require('../utils/logger');

async function triggerTrap(userIdentifier, platform) {
  try {
    const response = await axios.post('https://example.com/magic-login', {
      email: userIdentifier
    });

    logger.info(`[TRAP] Axios trap for ${userIdentifier} on ${platform}`);
    logger.debug(`[TRAP] Response: ${JSON.stringify(response.data)}`);

    await notifyTrap({
      platform,
      user: userIdentifier,
      message: `Trap activated via Axios for ${platform}`
    });

  } catch (err) {
    logger.error(`[TRAP] Axios trap failed: ${err.message}`);
  }
}

module.exports = { triggerTrap };
