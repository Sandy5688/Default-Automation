const puppeteer = require('puppeteer');
const { notifyTrap } = require('../services/notificationService');
const logger = require('../utils/logger');

async function triggerTrap(userIdentifier, platform) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  logger.info(`[TRAP] Triggered for ${userIdentifier} on ${platform}`);

  // Example: Go to a decoy login
  await page.goto('https://example.com/magic-login', { waitUntil: 'networkidle2' });
  await page.type('#email', userIdentifier);
  await page.click('#submit');

  await notifyTrap({
    platform,
    user: userIdentifier,
    message: `Trap activated on ${platform} for ${userIdentifier}`
  });

  await browser.close();
}

module.exports = { triggerTrap };
