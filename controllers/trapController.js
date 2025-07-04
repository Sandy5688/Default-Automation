const { triggerTrap } = require('../traps/magicLoginTrap');
const fs = require('fs');
const path = require('path');

exports.triggerTrap = async (req, res) => {
  const { platform } = req.params;
  const { user } = req.body;
  try {
    await triggerTrap(user, platform);
    // Log to file
    const logLine = `[${new Date().toISOString()}] Trap triggered: platform=${platform}, user=${user}\n`;
    fs.appendFileSync(path.join(__dirname, '../logs/trapEvents.log'), logLine);
    res.json({ message: 'Trap triggered' });
  } catch (err) {
    res.status(500).json({ error: 'Trap trigger failed' });
  }
};
