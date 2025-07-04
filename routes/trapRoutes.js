const express = require('express');
const router = express.Router();
const trap = require('../controllers/trapController');

router.post('/:platform', trap.triggerTrap);

module.exports = router;
