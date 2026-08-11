const { Vehicle } = require('../models/Vehicle');
const ReminderLog = require('../models/ReminderLog');
const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');
const notificationService = require('./notificationService');

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDocTypeLabel = (type) => {
  const labels = { insurance: 'Insurance', pollution: 'Pollution (PUC)', gps: 'GPS' };
  return labels[type] || type;
};

/**
 * Build a Telegram-formatted reminder message for the manager.
 */
const buildTelegramMessage = ({ vehicleNumber, ownerName, docTypeLabel, daysLeft, expiryDate }) => {
  let expiresLine;
  if (daysLeft > 0) {
    expiresLine = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  } else if (daysLeft === 0) {
    expiresLine = 'Today (Expiring!)';
  } else {
    expiresLine = `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago`;
  }

  const urgencyLine = daysLeft === 0
    ? '⚠️ Immediate renewal required.'
    : daysLeft < 0
      ? '🔴 Document is overdue. Immediate renewal required.'
      : 'Please renew before expiry.';

  return [
    `🚗 Fleet Reminder Pro`,
    ``,
    `Vehicle:`,
    vehicleNumber,
    ``,
    `Document:`,
    docTypeLabel,
    ``,
    `Expires In:`,
    expiresLine,
    ``,
    `Expiry Date:`,
    formatDate(expiryDate),
    ``,
    `Owner:`,
    ownerName || 'N/A',
    ``,
    urgencyLine,
  ].join('\n');
};

/**
 * Build email subject for the manager.
 */
const buildEmailSubject = ({ docTypeLabel, daysLeft, vehicleNumber }) => {
  if (daysLeft > 0) {
    return `Fleet Reminder - ${docTypeLabel} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${vehicleNumber})`;
  } else if (daysLeft === 0) {
    return `Fleet Reminder - ${docTypeLabel} expires TODAY (${vehicleNumber})`;
  } else {
    return `Fleet Reminder - ${docTypeLabel} OVERDUE by ${Math.abs(daysLeft)} days (${vehicleNumber})`;
  }
};

/**
 * Build plain-text email body for the manager.
 */
const buildEmailText = ({ vehicleNumber, ownerName, docTypeLabel, daysLeft, expiryDate }) => {
  let daysLabel;
  if (daysLeft > 0) {
    daysLabel = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  } else if (daysLeft === 0) {
    daysLabel = 'Expires Today';
  } else {
    daysLabel = `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`;
  }

  return [
    `Fleet Reminder Pro`,
    ``,
    `Vehicle:`,
    vehicleNumber,
    ``,
    `Owner:`,
    ownerName || 'N/A',
    ``,
    `Document:`,
    docTypeLabel,
    ``,
    `Expiry Date:`,
    formatDate(expiryDate),
    ``,
    `Days Remaining:`,
    daysLabel,
    ``,
    `Please renew this document before it expires.`,
  ].join('\n');
};

/**
 * Build HTML email body for the manager.
 */
const buildEmailHtml = ({ vehicleNumber, ownerName, docTypeLabel, daysLeft, expiryDate }) => {
  let daysLabel;
  let urgencyColor = '#3b82f6';
  if (daysLeft > 0) {
    daysLabel = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
    if (daysLeft <= 7) urgencyColor = '#f59e0b';
    if (daysLeft <= 2) urgencyColor = '#ef4444';
  } else if (daysLeft === 0) {
    daysLabel = 'Expires Today';
    urgencyColor = '#ef4444';
  } else {
    daysLabel = `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`;
    urgencyColor = '#dc2626';
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🚗 Fleet Reminder Pro</h1>
            <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">Vehicle Document Expiry Alert</p>
          </td>
        </tr>
        <!-- Urgency Banner -->
        <tr>
          <td style="background:${urgencyColor};padding:12px 32px;">
            <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;text-align:center;">
              ${docTypeLabel} — ${daysLabel}
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${[
                ['Vehicle Number', vehicleNumber],
                ['Owner', ownerName || 'N/A'],
                ['Document', docTypeLabel],
                ['Expiry Date', formatDate(expiryDate)],
                ['Days Remaining', daysLabel],
              ].map(([label, value]) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:45%;">${label}</td>
                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${value}</td>
              </tr>`).join('')}
            </table>
            <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:8px;border-left:4px solid #1d4ed8;">
              <p style="margin:0;color:#1e40af;font-size:14px;">Please renew this document before it expires to avoid penalties.</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              This is an automated message from Fleet Reminder Pro. Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
};

const runReminders = async () => {
  const runStart = new Date();
  console.log(`\n[Reminder Engine] ══════════════════════════════════════════`);
  console.log(`[Reminder Engine] Starting run at  : ${runStart.toISOString()}`);
  console.log(`[Reminder Engine] Local time        : ${runStart.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);

  try {
    const settings = await Settings.findOne({ key: 'main' });
    if (!settings) {
      console.warn('[Reminder Engine] ⚠️  No settings document found in database. Using defaults.');
    }

    // ─── Check notification providers ────────────────────────────────────────
    const telegramEnabled = settings?.telegramEnabled === true;
    const emailEnabled = settings?.emailEnabled === true;
    const hasTelegram = telegramEnabled && settings?.telegramChatId?.trim();
    const hasEmail = emailEnabled && settings?.managerEmail?.trim();

    console.log(`[Reminder Engine] Telegram enabled  : ${telegramEnabled} | chatId set: ${!!(settings?.telegramChatId?.trim())}`);
    console.log(`[Reminder Engine] Email enabled      : ${emailEnabled} | manager email set: ${!!(settings?.managerEmail?.trim())}`);

    if (!hasTelegram && !hasEmail) {
      console.warn(
        '[Reminder Engine] ❌ No notification provider configured.\n' +
        '   → Go to Settings → Notifications and enable Telegram or Email.\n' +
        '   → Aborted.'
      );
      return { totalSent: 0, totalSkipped: 0, totalFailed: 0, aborted: true };
    }

    const reminderDays = settings?.reminderDays || [30, 15, 7, 4, 2, 1, 0];
    console.log(`[Reminder Engine] Reminder thresholds: [${reminderDays.join(', ')}] days`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vehicles = await Vehicle.find({ isActive: true }).lean();
    console.log(`[Reminder Engine] Active vehicles    : ${vehicles.length}`);

    if (vehicles.length === 0) {
      console.log('[Reminder Engine] No active vehicles — nothing to check.');
      console.log(`[Reminder Engine] ══════════════════════════════════════════\n`);
      return { totalSent: 0, totalSkipped: 0, totalFailed: 0 };
    }

    let totalSent = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let totalChecked = 0;

    const docFields = [
      { field: 'insuranceExpiry', type: 'insurance' },
      { field: 'pollutionExpiry', type: 'pollution' },
      { field: 'gpsExpiry', type: 'gps' },
    ];

    for (const vehicle of vehicles) {
      for (const { field, type } of docFields) {
        const expiryDate = vehicle[field];
        if (!expiryDate) continue;

        totalChecked++;

        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const daysLeft = Math.round((expiry - today) / (1000 * 60 * 60 * 24));

        // Check if this daysLeft matches any reminder threshold
        const matchedDay = reminderDays.find((d) => d === daysLeft);
        if (matchedDay === undefined) continue;

        console.log(`[Reminder Engine] ✅ Match: ${vehicle.vehicleNumber} | ${type} | ${daysLeft} days left | expiry: ${expiryDate}`);

        // Deduplication: check if reminder already sent today for this vehicle+doc
        const startOfToday = new Date(today);
        const existingLog = await ReminderLog.findOne({
          vehicleId: vehicle._id,
          documentType: type,
          reminderDays: matchedDay,
          sentAt: { $gte: startOfToday },
        });

        if (existingLog) {
          console.log(`[Reminder Engine]    ↳ Already sent today (log: ${existingLog._id}) — skipping.`);
          totalSkipped++;
          continue;
        }

        const docTypeLabel = getDocTypeLabel(type);
        const msgVars = {
          vehicleNumber: vehicle.vehicleNumber,
          ownerName: vehicle.ownerName,
          docTypeLabel,
          daysLeft,
          expiryDate,
        };

        // Build messages for each provider
        const telegramText = buildTelegramMessage(msgVars);
        const emailSubject = buildEmailSubject({ docTypeLabel, daysLeft, vehicleNumber: vehicle.vehicleNumber });
        const emailText = buildEmailText(msgVars);
        const emailHtml = buildEmailHtml(msgVars);

        let logStatus = 'sent';
        let errorMessage = '';
        const notificationTarget = settings?.telegramChatId || settings?.managerEmail || 'N/A';

        try {
          console.log(`[Reminder Engine]    ↳ Sending notifications...`);
          const notifResult = await notificationService.send({
            settings,
            telegramText,
            emailSubject,
            emailText,
            emailHtml,
          });

          if (notifResult.anySuccess) {
            logStatus = 'sent';
            totalSent++;
            const channels = [
              notifResult.telegram?.sent ? 'Telegram ✅' : notifResult.telegram ? 'Telegram ❌' : null,
              notifResult.email?.sent ? 'Email ✅' : notifResult.email ? 'Email ❌' : null,
            ].filter(Boolean);
            console.log(`[Reminder Engine]    ↳ Sent via: ${channels.join(', ')}`);
          } else {
            logStatus = 'failed';
            const errs = [
              notifResult.telegram?.error,
              notifResult.email?.error,
            ].filter(Boolean).join('; ');
            errorMessage = errs || 'All providers failed.';
            totalFailed++;
            console.error(`[Reminder Engine]    ↳ ❌ All providers failed: ${errorMessage}`);
          }
        } catch (err) {
          logStatus = 'failed';
          errorMessage = err.message;
          totalFailed++;
          console.error(`[Reminder Engine]    ↳ ❌ Exception for ${vehicle.vehicleNumber} ${type}: ${err.message}`);
        }

        // Save log
        await ReminderLog.create({
          vehicleId: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          documentType: type,
          reminderDays: matchedDay,
          expiryDate,
          whatsappNumber: notificationTarget,
          messageContent: telegramText,
          status: logStatus,
          errorMessage,
        });

        if (logStatus !== 'failed') {
          await ActivityLog.create({
            action: 'reminder_sent',
            vehicleId: vehicle._id,
            vehicleNumber: vehicle.vehicleNumber,
            details: `${docTypeLabel} reminder sent to manager (${daysLeft} days left)`,
            performedBy: 'system',
          });
        }
      }
    }

    const duration = ((Date.now() - runStart) / 1000).toFixed(1);
    console.log(`[Reminder Engine] ─────────────────────────────────────────`);
    console.log(`[Reminder Engine] Docs checked   : ${totalChecked}`);
    console.log(`[Reminder Engine] Sent           : ${totalSent}`);
    console.log(`[Reminder Engine] Skipped (dedup): ${totalSkipped}`);
    console.log(`[Reminder Engine] Failed         : ${totalFailed}`);
    console.log(`[Reminder Engine] Duration       : ${duration}s`);
    console.log(`[Reminder Engine] ══════════════════════════════════════════\n`);

    return { totalSent, totalSkipped, totalFailed };
  } catch (error) {
    console.error(`[Reminder Engine] ❌ Fatal error: ${error.message}`);
    console.log(`[Reminder Engine] ══════════════════════════════════════════\n`);
    throw error;
  }
};

module.exports = { runReminders };
