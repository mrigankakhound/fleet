const express = require('express');
const router = express.Router();
const {
  getStats, getTodayWidget, getCalendar, getMonthlyChart, getDistributionChart, getActivity, getReminderStats,
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/today', getTodayWidget);
router.get('/calendar', getCalendar);
router.get('/chart/monthly', getMonthlyChart);
router.get('/chart/distribution', getDistributionChart);
router.get('/activity', getActivity);
router.get('/reminder-stats', getReminderStats);

module.exports = router;
