/**
 * Notification orchestration service.
 * Coordinates Telegram and Email providers based on settings.
 * If both are enabled, both are attempted independently.
 * A failure in one provider does not prevent the other from sending.
 */

const telegramService = require('./telegramService');
const emailService = require('./emailService');

/**
 * Send notifications through all enabled providers.
 *
 * @param {object} opts
 * @param {object} opts.settings        - Settings document from DB
 * @param {string} opts.telegramText    - Telegram message body
 * @param {string} opts.emailSubject    - Email subject line
 * @param {string} opts.emailText       - Email plain-text body
 * @param {string} opts.emailHtml       - Email HTML body (optional)
 *
 * @returns {Promise<{
 *   telegram: { sent: boolean, result?: object, error?: string } | null,
 *   email:    { sent: boolean, result?: object, error?: string } | null,
 *   anySuccess: boolean,
 * }>}
 */
const send = async ({ settings, telegramText, emailSubject, emailText, emailHtml }) => {
  const telegramEnabled = settings?.telegramEnabled === true;
  const emailEnabled = settings?.emailEnabled === true;

  const results = {
    telegram: null,
    email: null,
    anySuccess: false,
  };

  // ── Telegram ─────────────────────────────────────────────────────────────
  if (telegramEnabled) {
    const botToken = settings?.telegramBotToken?.trim();
    const chatId = settings?.telegramChatId?.trim();

    try {
      const result = await telegramService.sendMessage({ botToken, chatId, text: telegramText });
      results.telegram = { sent: true, result };
      results.anySuccess = true;
    } catch (err) {
      console.error(`[Notification] Telegram failed: ${err.message}`);
      results.telegram = { sent: false, error: err.message };
    }
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (emailEnabled) {
    const managerEmail = settings?.managerEmail?.trim();
    const smtp = {
      host: settings?.smtpHost,
      port: settings?.smtpPort,
      user: settings?.smtpUser,
      pass: settings?.smtpPass,
      fromEmail: settings?.smtpFromEmail,
      fromName: settings?.smtpFromName,
    };

    try {
      const result = await emailService.sendEmail({
        smtp,
        to: managerEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      results.email = { sent: true, result };
      results.anySuccess = true;
    } catch (err) {
      console.error(`[Notification] Email failed: ${err.message}`);
      results.email = { sent: false, error: err.message };
    }
  }

  return results;
};

module.exports = { send };
