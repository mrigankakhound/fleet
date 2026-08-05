const cron = require('node-cron');
const { runReminders } = require('./reminderService');
const Settings = require('../models/Settings');

let cronJob = null;

const startCron = async () => {
  // Load schedule from DB
  let cronExpression = '0 8 * * *'; // Default: 8 AM daily
  try {
    const settings = await Settings.findOne({ key: 'main' });
    if (settings?.reminderCronTime) {
      cronExpression = settings.reminderCronTime;
    }
  } catch (err) {
    console.warn('[Cron] Could not load settings, using default schedule.');
  }

  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }

  if (!cron.validate(cronExpression)) {
    console.error(`[Cron] Invalid cron expression: ${cronExpression}. Using default.`);
    cronExpression = '0 8 * * *';
  }

  cronJob = cron.schedule(
    cronExpression,
    async () => {
      console.log(`[Cron] Reminder job triggered at ${new Date().toISOString()}`);
      try {
        await runReminders();
      } catch (err) {
        console.error(`[Cron] Reminder job failed: ${err.message}`);
      }
    },
    {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'Asia/Kolkata',
    }
  );

  console.log(`✅ Cron reminder job scheduled: ${cronExpression}`);
};

const stopCron = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Cron] Job stopped.');
  }
};

// Manually trigger (for testing/admin use)
const triggerNow = async () => {
  return runReminders();
};

module.exports = { startCron, stopCron, triggerNow };
