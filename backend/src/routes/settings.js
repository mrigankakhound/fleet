const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getSettings, updateSettings, testTelegram, testEmail, createBackup } = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { triggerNow } = require('../services/cronService');

router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);

// POST /api/settings/test-telegram
router.post('/test-telegram', testTelegram);

// POST /api/settings/test-email
router.post('/test-email', testEmail);

router.get('/backup', createBackup);

// Manually trigger reminders
router.post('/trigger-reminders', async (req, res, next) => {
  try {
    const result = await triggerNow();
    res.json({ success: true, message: 'Reminders triggered.', data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
