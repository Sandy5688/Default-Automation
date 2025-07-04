const cron = require('node-cron');
const User = require('../models/User');

function cleanupInactive() {
  cron.schedule('0 2 * * *', async () => {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // 30 days
    const result = await User.deleteMany({ lastActive: { $lt: cutoff } });
    if (result.deletedCount > 0) {
      console.log(`[CRON] Deleted ${result.deletedCount} inactive users`);
    }
  });
}

module.exports = cleanupInactive;
