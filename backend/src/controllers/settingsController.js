const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const env = require('../config/env');
const { Vehicle } = require('../models/Vehicle');
const ReminderLog = require('../models/ReminderLog');
const User = require('../models/User');
const telegramService = require('../services/telegramService');
const emailService = require('../services/emailService');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'main' });
    if (!settings) {
      settings = await Settings.create({ key: 'main' });
    }
    // Mask sensitive credentials for security
    const data = settings.toObject();
    if (data.telegramBotToken) {
      data.telegramBotToken = data.telegramBotToken.substring(0, 8) + '...';
      data.telegramBotTokenSet = true;
    }
    if (data.smtpPass) {
      data.smtpPass = '••••••••';
      data.smtpPassSet = true;
    }
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      // General
      'companyName', 'timezone', 'reminderDays', 'messageTemplate', 'reminderCronTime',
      // Telegram
      'telegramBotToken', 'telegramChatId', 'telegramEnabled',
      // Email (SMTP)
      'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFromEmail', 'smtpFromName', 'emailEnabled',
      // Manager
      'managerName', 'managerEmail',
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    // Don't overwrite bot token if it's the masked version
    if (updates.telegramBotToken && updates.telegramBotToken.includes('...')) {
      delete updates.telegramBotToken;
    }

    // Don't overwrite SMTP password if it's the masked version
    if (updates.smtpPass && updates.smtpPass === '••••••••') {
      delete updates.smtpPass;
    }

    // Parse reminderDays if sent as string
    if (typeof updates.reminderDays === 'string') {
      updates.reminderDays = updates.reminderDays
        .split(',')
        .map((d) => parseInt(d.trim()))
        .filter((d) => !isNaN(d));
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: updates },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      action: 'settings_updated',
      details: 'Settings updated',
      performedBy: req.user?.username || 'admin',
    });

    res.json({ success: true, message: 'Settings saved.', data: settings });
  } catch (error) {
    next(error);
  }
};

// POST /api/settings/test-telegram
const testTelegram = async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: 'main' });

    // DB value takes priority; fall back to env vars
    const botToken = settings?.telegramBotToken?.trim() || env.telegram.botToken;
    const chatId = settings?.telegramChatId?.trim() || env.telegram.chatId;

    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram Bot Token and Chat ID are not configured. Save them in Settings → Notifications first.',
      });
    }

    try {
      const result = await telegramService.sendMessage({
        botToken,
        chatId,
        text: `✅ Fleet Reminder Pro\n\nTelegram integration is working successfully.\n\nTime: ${new Date().toLocaleString('en-IN')}`,
      });
      res.json({ success: true, message: 'Test message sent to Telegram.', data: result });
    } catch (apiErr) {
      // Return a clear 400 so the frontend shows the actual error message
      return res.status(400).json({ success: false, message: `Telegram API error: ${apiErr.message}` });
    }
  } catch (error) {
    next(error);
  }
};

// POST /api/settings/test-email
const testEmail = async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: 'main' });

    // DB value takes priority; fall back to env vars
    const toEmail = settings?.managerEmail?.trim() || req.body.toEmail;
    if (!toEmail) {
      return res.status(400).json({
        success: false,
        message: 'Manager Email is not configured. Set it in Settings → Manager first.',
      });
    }

    const smtp = {
      host: settings?.smtpHost?.trim() || env.smtp.host,
      port: settings?.smtpPort || env.smtp.port,
      user: settings?.smtpUser?.trim() || env.smtp.user,
      pass: settings?.smtpPass?.trim() || env.smtp.pass,
      fromEmail: settings?.smtpFromEmail?.trim() || env.smtp.fromEmail || settings?.smtpUser?.trim() || env.smtp.user,
      fromName: settings?.smtpFromName?.trim() || env.smtp.fromName,
    };

    if (!smtp.host || !smtp.user || !smtp.pass) {
      return res.status(400).json({
        success: false,
        message: 'SMTP credentials are not configured. Save them in Settings → Notifications first.',
      });
    }

    try {
      const result = await emailService.sendEmail({
        smtp,
        to: toEmail,
        subject: 'Fleet Reminder Pro Test',
        text: 'Fleet Reminder Pro email notifications are working successfully.',
        html: `<div style="font-family:Arial,sans-serif;padding:24px;">
        <h2 style="color:#1d4ed8;">✅ Fleet Reminder Pro</h2>
        <p style="font-size:15px;color:#334155;">Email notifications are working successfully.</p>
        <p style="font-size:13px;color:#64748b;">Time: ${new Date().toLocaleString('en-IN')}</p>
      </div>`,
      });
      res.json({ success: true, message: 'Test email sent.', data: result });
    } catch (smtpErr) {
      // Return a clear 400 so the frontend shows the actual SMTP error
      return res.status(400).json({ success: false, message: `Email error: ${smtpErr.message}` });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/backup
const createBackup = async (req, res, next) => {
  try {
    const [vehicles, reminderLogs, activityLogs, users, settings] = await Promise.all([
      Vehicle.find().lean(),
      ReminderLog.find().lean(),
      ActivityLog.find().lean(),
      User.find().select('-passwordHash').lean(),
      Settings.findOne({ key: 'main' }).lean(),
    ]);

    // Remove sensitive credentials from backup
    if (settings) {
      settings.telegramBotToken = '[REDACTED]';
      settings.smtpPass = '[REDACTED]';
    }

    const backup = {
      meta: {
        appName: 'Fleet Reminder Pro',
        backupDate: new Date().toISOString(),
        version: '2.0.0',
        counts: {
          vehicles: vehicles.length,
          reminderLogs: reminderLogs.length,
          activityLogs: activityLogs.length,
        },
      },
      vehicles,
      reminderLogs,
      activityLogs,
      users,
      settings,
    };

    await ActivityLog.create({
      action: 'backup_created',
      details: `Backup created with ${vehicles.length} vehicles`,
      performedBy: req.user?.username || 'admin',
    });

    const filename = `fleet-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings, testTelegram, testEmail, createBackup };
