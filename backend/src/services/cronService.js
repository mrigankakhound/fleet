const cron = require('node-cron');
const { runReminders } = require('./reminderService');
const Settings = require('../models/Settings');
const ReminderLog = require('../models/ReminderLog');

let cronJob = null;

/**
 * Check whether today's reminder run has already happened.
 * This prevents duplicate sends when the server restarts mid-day.
 */
const hasTodayRunAlready = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await ReminderLog.countDocuments({ sentAt: { $gte: today } });
  return count > 0;
};

/**
 * Run reminders only if they haven't already been sent today.
 * Logs clearly what happened.
 */
const runIfNeeded = async (reason = 'cron') => {
  const now = new Date();
  console.log(`\n[Cron] ─────────────────────────────────────────────────`);
  console.log(`[Cron] Reminder trigger source : ${reason}`);
  console.log(`[Cron] Server time             : ${now.toISOString()}`);
  console.log(`[Cron] Server timezone offset  : UTC${now.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(now.getTimezoneOffset() / 60)}h`);
  console.log(`[Cron] Configured timezone     : ${process.env.TIMEZONE || 'Asia/Kolkata'}`);

  try {
    const alreadyRan = await hasTodayRunAlready();
    if (alreadyRan && reason === 'startup') {
      console.log(`[Cron] Reminders already sent today — skipping startup run.`);
      console.log(`[Cron] ─────────────────────────────────────────────────\n`);
      return;
    }
    if (alreadyRan && reason !== 'cron') {
      // For manual triggers, always run regardless
    }

    console.log(`[Cron] Running reminder engine...`);
    const result = await runReminders();
    console.log(`[Cron] Result → Sent: ${result.totalSent}, Skipped: ${result.totalSkipped}, Failed: ${result.totalFailed}${result.aborted ? ', ABORTED (no provider configured)' : ''}`);
  } catch (err) {
    console.error(`[Cron] Reminder job failed: ${err.message}`);
  }

  console.log(`[Cron] ─────────────────────────────────────────────────\n`);
};

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
    async () => runIfNeeded('cron'),
    {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'Asia/Kolkata',
    }
  );

  console.log(`✅ Cron reminder job scheduled: [${cronExpression}] (timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'})`);

  // ── Startup check ──────────────────────────────────────────────────────────
  // On every server start (including cold starts / Render restarts), check
  // whether today's reminders have been sent. If not, send them now.
  // This ensures reminders are not silently skipped when the server was
  // asleep during the scheduled cron window.
  console.log(`[Cron] Performing startup reminder check...`);
  setTimeout(() => runIfNeeded('startup'), 5000); // 5s delay lets DB settle after connect
};

const stopCron = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Cron] Job stopped.');
  }
};

/**
 * Restart cron with the latest schedule from DB.
 * Call this after settings are saved.
 */
const restartCron = async () => {
  console.log('[Cron] Restarting cron with updated settings...');
  await startCron();
};

/** Manually trigger reminders (for testing/admin use) — always runs. */
const triggerNow = async () => {
  return runReminders();
};

module.exports = { startCron, stopCron, restartCron, triggerNow };
