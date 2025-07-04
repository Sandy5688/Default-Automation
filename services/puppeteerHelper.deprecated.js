// DEPRECATED: Puppeteer helpers are no longer used in this project.
// All bots have migrated to Axios or HTTP-based automation.
// This file is retained only for historical reference. Do not import it.

const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

// Launch a new Puppeteer browser with default config
async function launchBrowser(options = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...options
  });

  logger.info('[PuppeteerHelper] Browser launched');
  return browser;
}

// Create a new page with optional device emulation and cookies
async function createPage(browser, { emulate = null, cookies = null } = {}) {
  const page = await browser.newPage();

  // Emulate device (optional)
  if (emulate) {
    const devices = require('puppeteer/DeviceDescriptors');
    await page.emulate(devices[emulate]);
    logger.info(`[PuppeteerHelper] Emulated device: ${emulate}`);
  }

  // Set cookies (if session reuse)
  if (cookies) {
    await page.setCookie(...cookies);
    logger.info('[PuppeteerHelper] Session cookies injected');
  }

  return page;
}

// Close browser safely
async function closeBrowser(browser) {
  if (browser) {
    await browser.close();
    logger.info('[PuppeteerHelper] Browser closed');
  }
}

module.exports = {
  launchBrowser,
  createPage,
  closeBrowser,
};