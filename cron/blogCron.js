const cron = require('node-cron');
const { publishPendingBlogs } = require('../blog/blogScheduler');
const logger = require('../utils/logger');

const startBlogCron = () => {
  logger.info('[BLOG_CRON] Blog cron initialized...');

  // Runs every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    logger.info('[BLOG_CRON] Running blog publishing job...');
    await publishPendingBlogs();
  });
};

module.exports = startBlogCron;
