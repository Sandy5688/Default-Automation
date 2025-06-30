const express = require('express');
const router = express.Router();
const { triggerTrap } = require('../traps/magicLoginTrap');

router.post('/trap/:platform', async (req, res) => {
  const { platform } = req.params;
  const { user } = req.body;

  try {
    await triggerTrap(user, platform);
    res.status(200).json({ message: 'Trap triggered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Trap trigger failed' });
  }
});

module.exports = router;
